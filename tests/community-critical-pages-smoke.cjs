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
 ' dropAuth(){AUTH_USER=null;},',
 ' corruptVolatileState(){S.settings=null;}',
 '};'
 ].join('\n');
 const patched=bundle.replace(/\}\)\(\);\s*$/,hook+'\n})();\n');
 assert.notEqual(patched,bundle,'Bundle closure not found');
 new (require('node:vm').Script)(patched,{filename:'instrumented-mediaflow.js'});
 // Exercise the real Inbox refresh function with deferred, synthetic Supabase reads.
 // This detects dropped realtime notifications and cross-account stale responses.
 const inboxSource=fs.readFileSync('src/js/components/302-v412-inbox.js','utf8');
 const refreshStart=inboxSource.indexOf('async function mfp412InboxRefresh(){');
 const refreshEnd=inboxSource.indexOf('async function mfp412MarkRead(){',refreshStart);
 assert(refreshStart>=0&&refreshEnd>refreshStart,'v412 Inbox refresh function missing');
 new (require('node:vm').Script)(inboxSource,{filename:'v412-inbox.js'});
 const pending=[],auth={id:'alice'},state={messages:[],profiles:new Map(),active:'',loading:false,ready:false,error:'',lastFetch:0,refreshPending:false,refreshToken:0};
 const fakeDb={from(table){return {select(){return this;},or(){return this;},order(){return this;},limit(){
  return table==='mfp_profiles'?Promise.resolve({data:[],error:null}):
   new Promise((resolve,reject)=>pending.push({resolve,reject}));
 }}}};
 const refresh=new Function('MFP412_INBOX','AUTH_USER','mfp412InboxMe','supabase','mfp412DrawInbox','mfp412MarkRead','console',
  inboxSource.slice(refreshStart,refreshEnd)+';return mfp412InboxRefresh;')(
  state,auth,()=>auth.id,fakeDb,()=>{},()=>Promise.resolve(),console);
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 const initial=refresh();await refresh();
 assert.equal(pending.length,1,'in-flight Inbox refresh should coalesce notifications');
 pending[0].resolve({data:[{id:'old'}],error:null});await initial;await tick();
 assert.equal(pending.length,2,'Inbox should refetch after a notification during a request');
 pending[1].resolve({data:[{id:'latest'}],error:null});await tick();await tick();
 assert.equal(state.messages[0].id,'latest','Inbox must retain latest fetched messages');
 const stale=refresh();
 auth.id='bob';state.refreshToken++;state.loading=false;state.refreshPending=false;state.messages=[];
 const current=refresh();
 pending[3].resolve({data:[{id:'bob-message'}],error:null});await current;
 pending[2].resolve({data:[{id:'alice-message'}],error:null});await stale;
 assert.equal(state.messages[0].id,'bob-message','stale account response leaked into current Inbox');
 const staleError=refresh();
 auth.id='carol';state.refreshToken++;state.loading=false;state.refreshPending=false;
 const currentAgain=refresh();
 pending[4].reject(Error('stale account error'));await staleError;
 pending[5].resolve({data:[{id:'carol-message'}],error:null});await currentAgain;
 assert.equal(state.error,'','stale account error leaked into current Inbox');
 assert.equal(state.messages[0].id,'carol-message');
 assert.match(inboxSource,/refreshToken\+\+;MFP412_INBOX\.refreshPending=false;MFP412_INBOX\.loading=false;/,
  'account switch must invalidate in-flight Inbox requests');
 console.log('INBOX REFRESH REGRESSION: coalescing, stale responses and stale errors passed');
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
 for(const v of ['dashboard','library','history','community','dashboard','library']){
  await page.evaluate(view=>window.App.setView(view),v);
  await page.waitForTimeout(v==='community'?1000:200);
  const snap=await page.evaluate(()=>window.__MF_SMOKE.snapshot());
  snapshots[v]=snap;
  console.log('VIEW',v,'actual',snap.view,'text length',snap.root.length,'sample',snap.root.slice(0,450).replace(/\n/g,' '));
  assert.equal(snap.view,v,'Navigation view mismatch for '+v);
  assert(snap.root.trim().length>80,v+' unexpectedly blank');
 }
 assert(!/Loading community/i.test(snapshots.community.root),'Community spinner never settled');
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
