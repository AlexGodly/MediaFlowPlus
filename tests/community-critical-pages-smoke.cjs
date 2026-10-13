/* Real-browser regression smoke test for critical MediaFlow Plus pages.
 * Uses synthetic data, never touches a live account or database.
 */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const version=fs.readFileSync('VERSION','utf8').trim();
 const bundle=fs.readFileSync('assets/js/mediaflow-v'+version+'.bundle.js','utf8');
 const hook=[
 'window.__MF_SMOKE={',
 ' async boot(){',
 '  AUTH_USER={id:"00000000-0000-4000-8000-000000000001",created_at:new Date().toISOString(),email:"smoke@example.test",user_metadata:{}};',
 '  AUTH_READY=true;',
 '  const q=()=>new Proxy({}, {get(_t,key){',
 '   if(key==="then")return (ok,bad)=>Promise.resolve({data:[],error:null}).then(ok,bad);',
 '   if(key==="maybeSingle"||key==="single")return async()=>({data:null,error:null});',
 '   return (..._args)=>q();',
 '  }});',
 '  supabase={from:()=>q(),auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>{}}};',
 '  await v115StartWithData(undefined);',
 ' },',
 ' snapshot(){return {view:S.view,root:document.getElementById("view-root")?.innerText||"",nav:[...document.querySelectorAll(".nav-item")].map(x=>x.dataset.view)}},',
 ' titleMembership(){',
 ' const saved={library:S.library,plan:S.orderPlan,ui:S.orderPlannerUI};',
 ' const cat=S.categories[0].id;',
 ' S.library=[{id:"mf412-a",title:"Example A",categoryId:cat,status:"active",priority:"high"},{id:"mf412-b",title:"Example B",categoryId:cat,status:"active",priority:"medium"}];',
 ' S.orderPlan={titleIds:["mf412-a"],viewMode:"all",categoryMode:"default",categoryOrder:[],hiddenCategories:[]};',
 ' S.orderPlannerUI={search:"",picks:new Set(),page:0,pageSize:20,categories:[],status:"all",priority:"all",sort:"title-asc"};',
 ' const counts={};for(const mode of ["all","notadded","added"]){S.orderPlannerUI.v412Show=mode;counts[mode]={rows:v138PickerMatches().map(x=>x.id),mode:v140EnsureOrderPickerUI().v412Show,existing:v138EnsureOrderPlan().titleIds.slice()}}',
 ' S.library=saved.library;S.orderPlan=saved.plan;S.orderPlannerUI=saved.ui;return counts;',
 ' },',
 ' dropAuth(){AUTH_USER=null;},',
 ' corruptVolatileState(){S.settings=null;}',
 '};'
 ].join('\n');
 const patched=bundle.replace(/\}\)\(\);\s*$/,hook+'\n})();\n');
 assert.notEqual(patched,bundle,'Bundle closure not found');
 new (require('node:vm').Script)(patched,{filename:'instrumented-mediaflow.js'});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 page.on('console',msg=>{if(msg.type()==='error')console.error('[BROWSER]',msg.text().slice(0,700))});
 await page.route(/mediaflow-v\d+\.bundle\.js/,route=>route.fulfill({contentType:'application/javascript',body:patched}));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
 console.log('STARTUP DIAGNOSTICS',JSON.stringify({errors,html:await page.evaluate(()=>document.getElementById('app')?.textContent?.slice(0,180)),bundleLoaded:await page.evaluate(()=>!!window.__MF_SMOKE),version}));
 const boot=await page.evaluate(async()=>{await window.__MF_SMOKE.boot();return window.__MF_SMOKE.snapshot()});
 console.log('BOOT',JSON.stringify({view:boot.view,rootLength:boot.root.length,nav:boot.nav}));
 const snapshots={};
 for(const v of ['dashboard','library','history','community','inbox','dashboard','library']){
  await page.evaluate(view=>window.App.setView(view),v);
  await page.waitForTimeout(v==='community'?1000:200);
  const snap=await page.evaluate(()=>window.__MF_SMOKE.snapshot());
  snapshots[v]=snap;
  console.log('VIEW',v,'actual',snap.view,'text length',snap.root.length,'sample',snap.root.slice(0,450).replace(/\n/g,' '));
  assert.equal(snap.view,v,'Navigation view mismatch for '+v);
  assert(snap.root.trim().length>80,v+' unexpectedly blank');
 }
 assert(!/Loading community/i.test(snapshots.community.root),'Community spinner never settled');
 assert(/Inbox|conversations/i.test(snapshots.inbox.root),'Inbox missing from page');
 assert(boot.nav.includes('inbox'),'Inbox missing from desktop navigation');
 const show=await page.evaluate(()=>window.__MF_SMOKE.titleMembership());
 console.log('TITLE MEMBERSHIP',JSON.stringify(show));
 assert.deepEqual(show.all.rows,['mf412-a','mf412-b'],'All titles must include assigned/unassigned');
 assert.deepEqual(show.notadded.rows,['mf412-b'],'Not added must exclude assigned');
 assert.deepEqual(show.added.rows,['mf412-a'],'Already added must show assigned');
 const fab=await page.locator('#mfp412-inbox-widget .mfp412-fab').count();
 assert.equal(fab,1,'Floating Inbox shortcut missing');

 assert(snapshots.dashboard.root.match(/session|dashboard|recommend|today/i),'Dashboard UI absent');
 assert(snapshots.library.root.match(/library|add|title/i),'Library UI absent');
 // Expired authentication must never leave Community stuck on Loading.
 await page.evaluate(()=>{window.__MF_SMOKE.dropAuth();window.App.setView('community')});
 await page.waitForTimeout(400);
 const expired=await page.evaluate(()=>window.__MF_SMOKE.snapshot());
 console.log('EXPIRED COMMUNITY',expired.root.slice(0,400).replace(/\\n/g,' '));
 assert(/session is unavailable|temporarily unavailable|Sign in/i.test(expired.root),'Community missing session recovery absent');
 assert(!/Loading community/i.test(expired.root),'Community indefinitely loading after missing auth');

 // A null workspace must produce a recovery UI rather than erase Dashboard.
 await page.evaluate(()=>{window.__MF_SMOKE.corruptVolatileState();window.App.setView('dashboard')});
 await page.waitForTimeout(300);
 const recovery=await page.evaluate(()=>window.__MF_SMOKE.snapshot());
 console.log('DASHBOARD RECOVERY',recovery.root.slice(0,400).replace(/\\n/g,' '));
 assert(/workspace has not loaded|PAGE RECOVERY|Start a session|Today/i.test(recovery.root),'Missing-state navigation produced a blank Dashboard instead of a working or recoverable view');

 console.log('PAGE ERRORS',JSON.stringify(errors.slice(0,8)));
 assert.equal(errors.length,0,'Browser runtime errors encountered');
 await browser.close();
})().catch(e=>{console.error(e?.stack||e);process.exit(1)});
