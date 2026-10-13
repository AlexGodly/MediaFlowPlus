/* Plus v412 desktop/tablet/mobile Community smoke, fully synthetic/no live data. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {chromium}=require('playwright');
(async()=>{
 const version=fs.readFileSync('VERSION','utf8').trim();
 const bundle=fs.readFileSync('assets/js/mediaflow-v'+version+'.bundle.js','utf8');
 const hook=[
 'window.__MF_V412={',
 'async boot(){',
 ' AUTH_USER={id:"00000000-0000-4000-8000-000000000001",created_at:new Date().toISOString(),email:"synthetic@example.test",user_metadata:{}};AUTH_READY=true;',
 ' const q=()=>new Proxy({},{get(_t,key){',
 ' if(key==="then")return (ok,bad)=>Promise.resolve({data:[],error:null}).then(ok,bad);',
 ' if(key==="maybeSingle"||key==="single")return async()=>({data:null,error:null});',
 ' return()=>q();}});',
 ' supabase={from:()=>q(),auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>{}}};',
 ' await v115StartWithData(undefined);',
 '},',
 'go(t){App.setView("community");App.mfp408Tab(t);}',
 '};'
 ].join('\n');
 const source=bundle.replace(/\}\)\(\);\s*$/,hook+'\n})();\n');
 assert.notEqual(source,bundle,'Runtime injection unavailable');
 new vm.Script(source);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.route(/mediaflow-v\d+\.bundle\.js/,route=>route.fulfill({contentType:'application/javascript',body:source}));
 await page.route('**/functions/v1/mediaflow-plus-public-workspace?*',async route=>{
  const url=new URL(route.request().url),type=url.searchParams.get('type');
  let data={error:'Unknown'};
  if(type==='directory')data={source:'live',stored_public_copy:false,
   collections:[{id:'coll1',owner_id:'11111111-1111-4111-8111-111111111111',
    username:'creator',title:'Source-linked Classics',description:'Live collection from a creator',total:1,cover_url:''}]};
  if(type==='browse')data={source:'live',stored_public_copy:false,total:1,partial:false,
   titles:[{key:'mal:123',mal_id:'123',simkl_id:'',username:'creator',title:'Sample title',
   rating_count:1,average_rating:8.5,owners_count:1,cover_url:''}]};
  if(type==='profile')data={profile:{username:'creator',display_name:'Creator',bio:'Demo',
   visible_sections:{library:true,history:false,order:false,old:false,statistics:true,ratings:true,levels:false},
   collections:[],statistics:null,categories:[]}};
  if(type==='section')data={section:url.searchParams.get('section'),source:'live_owner_workspace',
   stored_public_copy:false,items:[{id:'t1',title:'Source-linked title',category:'Anime',progress:1,total:12}],total:1,next_offset:null};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data),
   headers:{'access-control-allow-origin':'*'}});
 });
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>window.__MF_V412.boot());
 for(const size of [{width:1440,height:900},{width:820,height:1000},{width:390,height:844},{width:320,height:680}]){
  await page.setViewportSize(size);
  await page.evaluate(()=>window.__MF_V412.go('home'));
  await page.waitForFunction(()=>document.querySelector('#mfp408-content')?.textContent.includes('Source-linked Classics'),{timeout:10000});
  const home=await page.locator('#mfp408-content').innerText();
  assert.match(home,/A world of stories/);assert.match(home,/Source-linked Classics/);
  await page.evaluate(()=>window.App.mfp408Tab('browse'));
  await page.waitForFunction(()=>document.querySelector('#mfp408-content')?.textContent.includes('Sample title'),{timeout:10000});
  const browsing=await page.locator('#mfp408-content').innerText();
  assert.match(browsing,/Sample title/);assert.match(browsing,/Quick add/);
  await page.evaluate(()=>window.App.mfp408Tab('top'));
  await page.waitForFunction(()=>document.querySelector('#mfp408-content')?.textContent.includes('Sample title'),{timeout:10000});
  const top=await page.locator('#mfp408-content').innerText();
  assert.match(top,/Top community titles/);
  const geometry=await page.evaluate(()=>{
   const e=document.querySelector('#mfp408-content');
   return {width:e?.clientWidth,scroll:e?.scrollWidth,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  assert(geometry.scroll<=geometry.width+8,'Community Top overflow at width '+size.width+': '+JSON.stringify(geometry));
  console.log('RESPONSIVE COMMUNITY',size.width,'Home/Browse/Top OK',JSON.stringify(geometry));
 }
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{window.location.hash='#/u/creator';});
 await page.waitForFunction(()=>document.getElementById('mf412s-content')?.textContent.includes('Source-linked title'),{timeout:15000});
 const publicPage=await page.locator('#mf412s-content').innerText();
 assert.match(publicPage,/Source-linked title/);
 assert.equal(errors.length,0,'Browser runtime failures: '+errors.join(' | '));
 await browser.close();
 console.log('v412 desktop/tablet/mobile Community and public profile synthetic smoke PASSED');
})().catch(err=>{console.error(err?.stack||err);process.exit(1)});
