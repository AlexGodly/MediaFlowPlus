/* MediaFlow Plus v413 — live public Edge projection contract tests.
 * Runs locally in Node with a synthetic owner workspace and mocked PostgREST.
 * ZERO live Supabase access and ZERO Personal Edition access.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ownerId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const viewerId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const profile={user_id:ownerId,username:'creator',display_name:'Demo Creator',bio:'Public sample',
 avatar_url:null,is_public:true,show_workspace_stats:false,show_workspace_categories:false,
 show_library:false,show_history:false,show_personal_order:false,show_old_system:false,
 show_statistics:false,show_ratings:false,show_levels:false};
const SECRET='NEVER_RETURN_PRIVATE_NOTES_4398';
const state={library:[
 {id:'alpha',title:'Alpha Series',categoryId:'cat1',rating:9.1,status:'active',priority:'high',progress:8,total:24,privateNotes:SECRET,coverUrl:'https://example.test/alpha.jpg'},
 {id:'beta',title:'Beta Series',categoryId:'cat1',rating:5,status:'completed',priority:'low',progress:12,total:12,privateNotes:SECRET},
 {id:'gamma',title:'Gamma',categoryId:'cat1',progress:0,total:20}
 ],categories:[{id:'cat1',name:'Anime',privateTag:SECRET}],sessions:[{date:'2026-10-12',timestamp:1791763200000,categoryId:'cat1',minutes:53,actualAmount:2,unit:'episodes',notes:SECRET,titles:[{title:'Alpha Series',libraryId:'alpha',qty:2,privateNote:SECRET}]}],
 collections:[{id:'c1',title:'Creator Picks',description:'Published list',titleIds:['alpha','beta'],privateNotes:SECRET}],
 orderPlan:{titleIds:['beta','alpha'],privateNotes:SECRET},oldSystem:{balances:{cat1:18},privateNotes:SECRET},
 xpLedger:{totalXP:2000,privateNotes:SECRET},settings:{secretKey:SECRET}};
let blocked=false;let handler=null;let serviceCalls=0;
async function fakeFetch(input,options={}){
 const url=new URL(String(input));
 if(url.pathname==='/auth/v1/user')return new Response(JSON.stringify({id:viewerId}),{status:200,headers:{'content-type':'application/json'}});
 const name=url.pathname.replace(/^\/rest\/v1\//,'');
 if(!name||!url.pathname.startsWith('/rest/v1/'))throw Error('Unexpected remote call: '+url.pathname);
 serviceCalls++;
 let rows=[];
 if(name==='mfp_profiles')rows=profile? [profile]:[];
 if(name==='mfp_blocks')rows=blocked?[{blocker_id:viewerId}]:[];
 if(name==='mediaflow_states')rows=[{user_id:ownerId,state_data:state}];
 if(name==='mfp_collection_publications')rows=[{owner_id:ownerId,collection_id:'c1',created_at:'2026-10-13T09:00:00Z'}];
 // emulate PostgREST equality predicates for owner and username.
 const username=url.searchParams.get('username');
 const userId=url.searchParams.get('user_id');
 const owner=url.searchParams.get('owner_id');
 if(username&&username.startsWith('eq.'))rows=rows.filter(x=>x.username===username.slice(3));
 if(userId&&userId.startsWith('eq.'))rows=rows.filter(x=>x.user_id===userId.slice(3));
 if(owner&&owner.startsWith('eq.'))rows=rows.filter(x=>x.owner_id===owner.slice(3));
 return new Response(JSON.stringify(rows),{status:200,headers:{'content-type':'application/json'}});
}
const code=fs.readFileSync('supabase/functions/mfp-public-workspace/index.ts','utf8');
new vm.Script(code,{filename:'mfp-public-workspace/index.ts'});
vm.runInNewContext(code,{
 Deno:{env:{get:key=>key==='SUPABASE_URL'?'https://unit-test.local':key==='SUPABASE_SERVICE_ROLE_KEY'?'test-service-role':''},serve:fn=>{handler=fn;}},
 fetch:fakeFetch,URL,URLSearchParams,Response,Blob,Uint8Array,DecompressionStream,atob,console
},{filename:'mfp-public-workspace/index.ts'});
assert.equal(typeof handler,'function','Edge handler is registered');
async function request(params,viewer=false){
 const url=new URL('https://edge.example/mfp-public-workspace');
 for(const [k,v] of Object.entries(params))url.searchParams.set(k,String(v));
 const response=await handler(new Request(url,{headers:viewer?{authorization:'Bearer signed-viewer-token'}:{}}));
 const raw=await response.text();
 assert(!raw.includes(SECRET),'Private notes were leaked!');
 assert(!raw.includes('"state_data"'),'A raw cloud state was exposed!');
 return {status:response.status,json:JSON.parse(raw)};
}
(async()=>{
 let r=await request({kind:'profile',username:'creator'});
 assert.equal(r.status,200);assert.equal(r.json.profile.username,'creator');
 assert.equal(r.json.sections.library,false);
 assert.equal(r.json.sections.history,false);
 assert.equal(r.json.collections.length,1,'Only explicitly published collection is listed');
 for(const section of ['library','history','order','old','statistics','ratings','levels']){
  r=await request({kind:'section',username:'creator',section});
  assert.equal(r.status,403,'Private section leaked: '+section);
 }
 profile.show_library=true;
 r=await request({kind:'section',username:'creator',section:'library',offset:1,limit:1});
 assert.equal(r.status,200);
 assert.equal(r.json.total,3);assert.equal(r.json.items.length,1);
 assert.equal(r.json.items[0].title,'Beta Series');
 assert.equal(r.json.items[0].rating,undefined,'Ratings leaked through the Library tab');
 assert.equal(r.json.stored_public_copy,false);
 assert.equal(r.json.source,'current_owner_workspace');
 profile.show_ratings=true;
 r=await request({kind:'section',username:'creator',section:'ratings'});
 assert.equal(r.status,200);
 assert.equal(r.json.items.length,2);assert.equal(r.json.items[0].rating,9.1);
 r=await request({kind:'section',username:'creator',section:'library'});
 assert.equal(r.json.items[0].rating,9.1,'Allowed ratings should come from original Library');
 profile.show_history=true;
 r=await request({kind:'section',username:'creator',section:'history'});
 assert.equal(r.status,200);assert.equal(r.json.items[0].titles[0].title,'Alpha Series');
 assert.equal(r.json.items[0].minutes,53);
 profile.show_personal_order=true;
 r=await request({kind:'section',username:'creator',section:'order'});
 assert.deepEqual(JSON.parse(JSON.stringify(r.json.items.map(x=>x.title))),['Beta Series','Alpha Series']);
 profile.show_old_system=true;
 r=await request({kind:'section',username:'creator',section:'old'});
 assert.equal(r.json.items[0].category,'Anime');assert.equal(r.json.items[0].balance,18);
 profile.show_statistics=true;
 r=await request({kind:'section',username:'creator',section:'statistics'});
 assert.equal(r.json.summary.total_titles,3);assert.equal(r.json.summary.total_sessions,1);
 profile.show_levels=true;
 r=await request({kind:'section',username:'creator',section:'levels'});
 assert.equal(r.json.summary.available,false,'Do not invent unverifiable XP parity');
 r=await request({kind:'section',username:'creator',section:'madeup'});
 assert.equal(r.status,400);
 blocked=true;
 r=await request({kind:'section',username:'creator',section:'library'},true);
 assert.equal(r.status,404,'Blocked viewer must not see public owner data');
 blocked=false;
 profile.is_public=false;
 r=await request({kind:'profile',username:'creator'});
 assert.equal(r.status,404,'Private profile was exposed');
 console.log('PASS live public projection: 7 gates, opt-in, redaction, pagination, canonical updates, blocking and no-mirror contract; '+serviceCalls+' mocked DB calls');
})().catch(e=>{console.error(e?.stack||e);process.exitCode=1;});
