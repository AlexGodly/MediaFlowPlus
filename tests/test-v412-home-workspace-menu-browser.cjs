/* End-to-end Community Home, Workspace, and collapsible menu smoke.
 * Synthetic account and public Edge responses; no live data is read/written.
 */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {chromium}=require('playwright');
(async()=>{
 const ver=fs.readFileSync('VERSION','utf8').trim();
 const bundle=fs.readFileSync('assets/js/mediaflow-v'+ver+'.bundle.js','utf8');
 const hook=[
 'window.__MF_NAV_SMOKE={async boot(){',
 ' AUTH_USER={id:"00000000-0000-4000-8000-000000000001",created_at:new Date().toISOString(),email:"synthetic@example.test",user_metadata:{}}; AUTH_READY=true;',
 ' const q=()=>new Proxy({},{get(_t,key){',
 ' if(key==="then")return (ok,bad)=>Promise.resolve({data:[],error:null}).then(ok,bad);',
 ' if(key==="maybeSingle"||key==="single")return async()=>({data:null,error:null});',
 ' return()=>q();}});',
 ' supabase={from:()=>q(),auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>{}}};',
 ' await v115StartWithData(undefined);}};'
 ].join('\n');
 const patched=bundle.replace(/\}\)\(\);\s*$/,hook+'\n})();\n');
 assert.notEqual(patched,bundle,'Could not instrument app bundle');
 new vm.Script(patched,{filename:'instrumented-app.js'});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1366,height:850}});
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.route(/mediaflow-v\d+\.bundle\.js/,r=>r.fulfill({contentType:'application/javascript',body:patched}));
 await page.route('**/functions/v1/mediaflow-plus-public-workspace?*',r=>{
  const params=new URL(r.request().url()).searchParams;
  const data=params.get('type')==='directory'?{collections:[]}:{
   titles:[{key:'mal:42',mal_id:'42',title:'Live sample',username:'creator',owners_count:1,average_rating:9,rating_count:1,cover_url:''}],total:1,partial:false};
  return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 // Public Home exists before login and is not a private workspace copy.
 await page.evaluate(()=>{location.hash='#/community/home'});
 await page.waitForFunction(()=>!!document.querySelector('#mf412g-overlay .mf412g-hero h1'),{timeout:10000});
 assert.match(await page.locator('#mf412g-content').innerText(),/Discover more than titles/i);
 await page.getByRole('button',{name:/My Workspace/i}).first().click();
 await page.waitForFunction(()=>!document.getElementById('mf412g-overlay'),{timeout:10000});
 assert(await page.locator('.v297-auth-card').count()===1,'Guest Workspace link must lead to sign-in');
 await page.evaluate(()=>window.__MF_NAV_SMOKE.boot());
 await page.evaluate(()=>window.App.mfp412Navigate('home'));
 await page.waitForFunction(()=>document.querySelector('.mf412n-community')&&
  document.querySelector('#mfp408-content')?.textContent.includes('A world of stories'),{timeout:10000});
 assert(await page.locator('.mf412n-link').count()>=10,'Missing nested Community destinations');
 assert.equal(await page.locator('.sidebar>.nav').count(),0); // scoped correctly via .sidebar .nav
 const before=await page.locator('.mf412n-group-head').getAttribute('aria-expanded');
 await page.locator('.mf412n-group-head').click();
 const after=await page.locator('.mf412n-group-head').getAttribute('aria-expanded');
 assert.notEqual(before,after,'Community group must collapse');
 await page.locator('.mf412n-group-head').click();
 await page.locator('.mf412n-link[data-mf412-destination="browse"]').click();
 await page.waitForFunction(()=>document.querySelector('#mfp408-content')?.textContent.includes('Live sample'),{timeout:10000});
 assert.match(await page.locator('#mfp408-content').innerText(),/Browse titles/);
 await page.getByRole('button',{name:/My Workspace/i}).first().click();
 await page.waitForFunction(()=>document.querySelector('#view-root')?.textContent.includes('Today'),{timeout:10000});
 assert.equal(await page.evaluate(()=>S.view),'dashboard');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>window.App.mfp412Navigate('home'));
 await page.locator('.mobile-more-wrap > .mtab').click();
 await page.waitForFunction(()=>!document.querySelector('#mobile-more-menu')?.classList.contains('hide'),{timeout:10000});
 assert.equal(await page.locator('.mf412n-mobile-head').count(),1);
 await page.locator('.mf412n-mobile-head').click();
 assert.equal(await page.locator('.mf412n-mobile-head').getAttribute('aria-expanded'),'false');
 await page.locator('.mf412n-mobile-head').click();
 await page.locator('.mf412n-mobile-page').filter({hasText:'Friends'}).click();
 assert.equal(await page.evaluate(()=>MFP408.tab),'friends');
 assert.equal(await page.evaluate(()=>S.view),'community');
 const horizontal=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+10);
 assert(!horizontal,'Community menu creates global horizontal scrolling');
 assert.equal(errors.length,0,'Page errors '+JSON.stringify(errors));
 await browser.close();
 console.log('v412 public Home, Workspace switch, nested sidebar/menu and mobile collapse PASSED');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
