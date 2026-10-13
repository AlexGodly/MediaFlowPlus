/* Plus v412: deterministic, no-credentials, no-live-database privacy tests.
 * Execute the production Edge Function with a fake Supabase backend.
 */
const vm=require('node:vm'),assert=require('node:assert/strict'),fs=require('node:fs');
const OWNER='11111111-1111-4111-8111-111111111111';
const meta={
 mfp_profiles:[{user_id:OWNER,username:'sample',display_name:'Demo',is_public:false,
  show_library:false,show_history:false,show_personal_order:false,show_old_system:false,
  show_statistics:false,show_ratings:false,show_levels:false,created_at:'2026-10-13'}],
 mfp_profile_showcase:[{owner_id:OWNER,enabled:false,show_collections:true,show_categories:false,show_statistics:false}],
 mfp_shared_collections:[{owner_id:OWNER,collection_id:'coll1',is_published:true,updated_at:'2026-10-13'}],
 mediaflow_states:[{user_id:OWNER,state_data:{
  library:[{id:'t1',title:'Only Opted In',malId:'12345',coverUrl:'https://images.example/cover.png',
   categoryId:'anime',rating:9.5,progress:4,total:12,status:'watching'}],
  categories:[{id:'anime',name:'Anime'}],
  collections:[{id:'coll1',title:'Shared List',description:'Direct source',titleIds:['t1']}],
  sessions:[{date:'2026-10-13',minutes:35,titles:[{libraryId:'t1'}]}],
  orderPlan:{titleIds:['t1']},oldSystem:{balances:{anime:10}}
 }}]
};
let stateRead=0,writes=0;
class Query{
 constructor(name){this.name=name;this.filters=[];this.limitValue=null;this.orderField=null;}
 select(){return this;}
 eq(field,value){this.filters.push(row=>row[field]===value);return this;}
 in(field,values){this.filters.push(row=>values.includes(row[field]));return this;}
 order(field,{ascending=true}={}){this.orderField={field,ascending};return this;}
 limit(n){this.limitValue=n;return this;}
 collect(){
  if(this.name==='mediaflow_states')stateRead++;
  let rows=[...(meta[this.name]||[])].filter(r=>this.filters.every(fn=>fn(r)));
  if(this.orderField)rows.sort((a,b)=>String(a[this.orderField.field]||'').localeCompare(String(b[this.orderField.field]||''))*(this.orderField.ascending?1:-1));
  if(this.limitValue!=null)rows=rows.slice(0,this.limitValue);
  return {data:rows,error:null};
 }
 maybeSingle(){const x=this.collect();return Promise.resolve({data:x.data[0]||null,error:null});}
 then(ok,bad){return Promise.resolve(this.collect()).then(ok,bad);}
 insert(){writes++;throw Error('Do not write in a public projector');}
 update(){writes++;throw Error('Do not write in a public projector');}
 delete(){writes++;throw Error('Do not write in a public projector');}
}
let handler=null;
const fakeAdmin={from(name){return new Query(name);}};
const context={createClient(){return fakeAdmin;},
 Deno:{env:{get(key){return key==='SUPABASE_URL'?'https://fake.supabase.co':'not-an-actual-secret';}},
  serve(fn){handler=fn;}},Request,Response,URL,URLSearchParams,console,
 atob,Uint8Array,DecompressionStream};
const source=fs.readFileSync('supabase/functions/mediaflow-plus-public-workspace/index.ts','utf8')
 .replace(/^import .*;$/gm,'');
vm.runInNewContext(source,context,{filename:'edge.ts'});
assert.equal(typeof handler,'function');
async function get(type,args={}){
 const u=new URL('https://fake.supabase.co/functions/v1/mediaflow-plus-public-workspace');
 u.searchParams.set('type',type);
 for(const [key,value] of Object.entries(args))u.searchParams.set(key,String(value));
 const r=await handler(new Request(u));
 return {status:r.status,data:await r.json()};
}
(async()=>{
 let c=await get('collection',{owner:OWNER,id:'coll1'});
 assert.equal(c.status,404,'A published ref must not override private-profile permission');
 let p=await get('profile',{username:'sample'});
 assert.equal(p.status,404,'An unpublished public showcase is invisible');
 let b=await get('browse');
 assert.equal(b.data.total,0,'A private Library is excluded from discovery');
 let sec=await get('section',{username:'sample',section:'library'});
 assert.equal(sec.status,403,'A private Library page cannot be read');
 assert.equal(stateRead,0,'No canonical state is fetched before privacy checks');

 meta.mfp_profiles[0].is_public=true;meta.mfp_profile_showcase[0].enabled=true;
 c=await get('collection',{owner:OWNER,id:'coll1'});
 assert.equal(c.status,200,'An explicitly shared collection is readable');
 assert.deepEqual(c.data.items.map(x=>x.title),['Only Opted In']);
 assert(!Object.hasOwn(c.data,'state_data'),'Never transmit raw owner state');
 let directory=await get('directory');
 assert.equal(directory.data.collections.length,1,'Live collection directory finds explicit shares');
 b=await get('browse');
 assert.equal(b.data.total,0,'Public profile alone does not publish Library titles');

 meta.mfp_profiles[0].show_library=true;
 b=await get('browse',{query:'Only',sort:'rated'});
 assert.equal(b.status,200);assert.equal(b.data.total,1);
 assert.equal(b.data.titles[0].key,'mal:12345');
 assert.equal(b.data.titles[0].average_rating,null,'Do not leak private ratings');
 meta.mfp_profiles[0].show_ratings=true;
 b=await get('browse',{sort:'rated'});
 assert.equal(b.data.titles[0].average_rating,9.5,'Ratings are read live only on permission');
 sec=await get('section',{username:'sample',section:'library'});
 assert.equal(sec.status,200);assert.equal(sec.data.items[0].rating,9.5);
 let history=await get('section',{username:'sample',section:'history'});
 assert.equal(history.status,403,'Other tabs remain private independently');
 meta.mfp_profiles[0].show_history=true;
 history=await get('section',{username:'sample',section:'history'});
 assert.equal(history.status,200);assert.equal(history.data.items.length,1);
 assert(!Object.hasOwn(history.data.items[0],'notes'),'Do not return private session fields');

 meta.mfp_shared_collections[0].is_published=false;
 c=await get('collection',{owner:OWNER,id:'coll1'});
 assert.equal(c.status,404,'Unpublishing removes immediate access');
 directory=await get('directory');
 assert.equal(directory.data.collections.length,0,'Unpublished ref is removed from live directory');
 meta.mfp_profile_showcase[0].enabled=false;
 p=await get('profile',{username:'sample'});
 assert.equal(p.status,404,'Showcase revocation hides profile');
 sec=await get('section',{username:'sample',section:'library'});
 assert.equal(sec.status,403,'Showcase revocation hides all sections');
 b=await get('browse');assert.equal(b.data.total,0,'Showcase revocation removes Library from Browse');
 assert.equal(writes,0,'Read-only API never performs a write');
 console.log('v412 synthetic privacy: default-private, live opt-in, rating opt-in, 404 revocation, nonmutation — PASSED');
})().catch(err=>{console.error(err);process.exitCode=1;});
