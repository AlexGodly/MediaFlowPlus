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
 '  supabase={from:()=>q(),auth:{getSession:async()=>({data:{session:{access_token:"synthetic-smoke-token"}}}),onAuthStateChange:()=>{}}};',
 '  await v115StartWithData(undefined);',
 ' },',
 ' snapshot(){return {view:S.view,root:document.getElementById("view-root")?.innerText||"",nav:[...document.querySelectorAll(".nav-item")].map(x=>x.dataset.view)}},',
 ' debugBrowse(){try{const fn=V219_PAGE_RENDERERS.get("browse"),html=String(fn?.());return {functionName:fn?.name,preview:html.slice(0,360),length:html.length}}catch(e){return {error:String(e),stack:String(e.stack).slice(0,1100)}}},',
 '  membershipTest(){',
'   const priorLibrary=S.library,priorPlan=S.orderPlan;',
'   const categoryId=String(S.categories?.[0]?.id||\'\');',
'   S.library=[',
'    {id:\'mf412-test-1\',title:\'Already In Order\',categoryId,status:\'active\',priority:\'medium\',progress:0,total:12},',
'    {id:\'mf412-test-2\',title:\'Not Yet In Order\',categoryId,status:\'active\',priority:\'medium\',progress:0,total:12}',
'   ];',
'   S.orderPlan={...priorPlan,titleIds:[\'mf412-test-1\']};',
'   const ui=v140EnsureOrderPickerUI();ui.search=\'\';ui.categories=[];ui.status=\'all\';ui.priority=\'all\';',
'   const out={};',
'   for(const show of [\'all\',\'available\',\'added\']){',
'    App.v406MemberSelect(\'titles\',show);',
'    out[show]=v138PickerMatches().map(x=>x.id);',
'   }',
'   App.v406MemberSelect(\'titles\',\'all\');',
'   S.library=priorLibrary;S.orderPlan=priorPlan;',
'   return out;',
'  },',
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
 await page.route('**/functions/v1/mfp-public-workspace?*',route=>{
  const url=new URL(route.request().url());
  const kind=url.searchParams.get('kind');
  const base={owner:{username:'demo',display_name:'Demo'},collection:{id:'c1',title:'Shared Example',description:'A public collection',count:1},titles:[{title:'A Public Title',category:'Anime'}],total:1,next_offset:null};
  const payload=kind==='discover'?{collections:[{...base.collection,owner:base.owner}]}:
    kind==='profile'?{profile:{username:'demo',display_name:'Demo',bio:'A public profile'},collections:[{...base.collection,owner:base.owner}],workspace:{title_count:12,collection_count:1,category_count:3},sections:{library:true,history:true,order:false,old:false,statistics:true,ratings:true,levels:false}}:
    kind==='section'?{section:url.searchParams.get('section'),source:'current_owner_workspace',stored_public_copy:false,items:[{id:'live-title-1',title:'Live Owner Title',category:'Seasonal Anime',status:'active',progress:1,total:12}],total:1,offset:0,next_offset:null,summary:null}:
    kind==='catalog'?{source:'current_owner_workspace',stored_public_copy:false,scope:url.searchParams.get('scope'),partial:false,scanned_profiles:1,total:1,items:[{media_key:'mal:1001',title:'Demo Catalog Title',users_count:1,ratings_count:1,average_rating:9.1,cover_url:''}],offset:0,next_offset:null}:base;
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
 });

 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
 console.log('STARTUP DIAGNOSTICS',JSON.stringify({errors,html:await page.evaluate(()=>document.getElementById('app')?.textContent?.slice(0,180)),bundleLoaded:await page.evaluate(()=>!!window.__MF_SMOKE),version}));
 const boot=await page.evaluate(async()=>{await window.__MF_SMOKE.boot();return window.__MF_SMOKE.snapshot()});
 console.log('BOOT',JSON.stringify({view:boot.view,rootLength:boot.root.length,nav:boot.nav}));
 const snapshots={};
 for(const v of ['dashboard','library','history','community','friends','inbox','browse','dashboard','library']){
  await page.evaluate(view=>window.App.setView(view),v);
  await page.waitForTimeout(v==='community'?1000:200);
  const snap=await page.evaluate(()=>window.__MF_SMOKE.snapshot());
  snapshots[v]=snap;
  console.log('VIEW',v,'actual',snap.view,'text length',snap.root.length,'sample',snap.root.slice(0,450).replace(/\n/g,' '));
  if(v==='browse'&&!snap.root.trim()){const debug=await page.evaluate(()=>({hasRenderer:window.MediaFlowRuntime?.hasPageRenderer('browse'),knownPages:window.MediaFlowRuntime?.getRegisteredPages(),preview:window.__MF_SMOKE.debugBrowse(),rootHtml:document.getElementById('view-root')?.innerHTML?.slice(0,1200),appContent:document.getElementById('app')?.textContent?.slice(0,400),view:window.__MF_SMOKE.snapshot().view}));console.log('BROWSE CRITICAL DIAGNOSTICS',JSON.stringify(debug));}
  assert.equal(snap.view,v,'Navigation view mismatch for '+v);
  assert(snap.root.trim().length>80,v+' unexpectedly blank');
 }
 assert(!/Loading community/i.test(snapshots.community.root),'Community spinner never settled');
 assert(/conversations|Messages/i.test(snapshots.inbox.root),'Inbox missing');
 assert(/Following|Followers|Mutuals/i.test(snapshots.friends.root),'Restored Friends tabs missing');
 assert(boot.nav.includes('friends'),'Friends missing from app navigation');
 assert(boot.nav.includes('browse'),'Live Browse missing from app navigation');

 
 await page.evaluate(()=>{window.App.setView('community');window.App.mfp408Tab('reviews');});
 await page.waitForTimeout(350);
 const reviewsText=await page.locator('#view-root').innerText();
 assert(/Top Rated|Demo Catalog Title/i.test(reviewsText),'Community Top does not show the live canonical ratings directory');
 assert(!reviewsText.includes('Publish review'),'Duplicate rating publisher was not removed');
 await page.evaluate(()=>window.App.lb413StartAdd('mal:1001'));
 assert(await page.evaluate(()=>!!document.querySelector('#lb413-add-overlay .lb413-category-list button')),'Live Browse private Quick Add category dialog missing');
 await page.evaluate(()=>window.App.lb413CloseAdd());
  const membership=await page.evaluate(()=>window.__MF_SMOKE.membershipTest());
 console.log('MEMBERSHIP',JSON.stringify(membership));
 assert.deepEqual(membership.all.sort(),['mf412-test-1','mf412-test-2'],'All titles should show eligible and added');
 assert.deepEqual(membership.available,['mf412-test-2'],'Not added filter should exclude assigned title');
 assert.deepEqual(membership.added,['mf412-test-1'],'Already added filter should show assigned title');

 await page.waitForTimeout(4300);
 const floating=await page.evaluate(()=>!!document.querySelector('#in412-float-wrap .in412-fab'));
 console.log('FLOATING INBOX',floating);
 assert(floating,'Floating inbox button not mounted');
 await page.evaluate(()=>window.App.in412Toggle());
 assert(await page.evaluate(()=>!!document.querySelector('#in412-float-wrap .in412-mini-panel')),'Mini Inbox does not open');
 await page.evaluate(()=>window.App.in412Open());
 assert.equal(await page.evaluate(()=>window.__MF_SMOKE.snapshot().view),'inbox','Mini Inbox to full Inbox navigation failed');
 assert(snapshots.dashboard.root.match(/session|dashboard|recommend|today/i),'Dashboard UI absent');
 assert(snapshots.library.root.match(/library|add|title/i),'Library UI absent');
 await page.evaluate(()=>window.App.setView('about'));
 const about=await page.locator('#view-root').innerText();
 console.log('ABOUT DIAGNOSTICS',JSON.stringify({text:about.slice(0,1700),html:(await page.locator('#view-root').innerHTML()).slice(0,950)}));
 assert(about.includes('Everything in its place')&&about.includes('Version & updates')&&about.includes('MEDIAFLOW EVOLUTION'),'Personal v408/v383 About content absent');
 const aboutHref=await page.locator('#view-root a').filter({hasText:'Open latest web app'}).getAttribute('href');
 assert(aboutHref?.includes('/MediaFlowPlus/'),'Plus About accidentally points at Personal edition');
 await page.evaluate(()=>window.App.setView('explorecollections'));
 await page.waitForTimeout(300);
 assert(/Community Collections/i.test(await page.locator('#view-root').innerText()),'Community collection discovery absent');

 await page.setViewportSize({width:390,height:760});
 await page.evaluate(()=>window.App.setView('inbox'));
 await page.waitForTimeout(150);
 await page.evaluate(()=>window.App.in412Toggle());
 const miniRect=await page.locator('#in412-float-wrap .in412-mini-panel').boundingBox();
 assert(miniRect&&miniRect.x>=-1&&miniRect.x+miniRect.width<=392,'Mini Inbox clipped on mobile');
 await page.evaluate(()=>window.App.in412Toggle());
 await page.setViewportSize({width:1440,height:900});

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

 // Signed-out shared links must show public allowed data, not the Login wall.
 await page.evaluate(()=>{window.location.hash='#/u/demo'});
 await page.waitForTimeout(600);
 const guestProfile=await page.locator('#ps412-public-host').innerText();
 assert(/Demo|Published collections/i.test(guestProfile),'Guest public profile does not render');
 assert(/Live workspace/i.test(guestProfile),'Public profile live Workspace tabs missing');
 await page.evaluate(()=>window.App.ps412Tab('library'));
 await page.waitForTimeout(350);
 const liveTitles=await page.locator('#ps412-live-section').innerText();
 assert(liveTitles.includes('Live Owner Title'),'Public Library tab did not load the owner-native projection');
 assert(liveTitles.includes('No copies'),'Public Library did not indicate canonical source');
 await page.evaluate(()=>{window.location.hash='#/collection/demo/c1'});
 await page.waitForTimeout(600);
 const guestCollection=await page.locator('#ps412-public-host').innerText();
 assert(/Shared Example|A Public Title/i.test(guestCollection),'Guest shared collection does not render');
 assert(!guestCollection.includes('rawStateMarker'),'Guest public page disclosed private workspace');

 console.log('PAGE ERRORS',JSON.stringify(errors.slice(0,8)));
 assert.equal(errors.length,0,'Browser runtime errors encountered');
 await browser.close();
})().catch(e=>{console.error(e?.stack||e);process.exit(1)});
