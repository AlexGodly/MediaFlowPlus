/* MediaFlow Plus v412 — Read-only canonical workspace projector.
 * No library/collection/profile snapshots are copied to Community tables.
 * The service role is NEVER returned to clients. Every request validates
 * live publication metadata before reading the owner's private state.
 */
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_ROLE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const admin=createClient(SUPABASE_URL,SERVICE_ROLE,{auth:{persistSession:false,autoRefreshToken:false}});
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"authorization, apikey, x-client-info, content-type","Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, max-age=0"};
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers});}
function text(value,max=250){return String(value??"").slice(0,max);}
function url(value){try{const out=new URL(text(value,2048));return out.protocol==="https:"?out.href:"";}catch{return "";}}
function uuid(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value||"");}
// A public URL must never be able to inflate a compressed private workspace
// without a hard output limit. 96 MiB covers large legitimate libraries while
// rejecting gzip bombs before JSON parsing or public field projection.
const MAX_PUBLIC_STATE_BYTES=96*1024*1024;
async function decodeStateGzip(encoded){
 const binary=atob(encoded);
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")).getReader();
 const decoder=new TextDecoder("utf-8",{fatal:true});
 let decoded="",total=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>MAX_PUBLIC_STATE_BYTES){
    void reader.cancel().catch(()=>{});
    throw new Error("Workspace exceeds public projection limit");
   }
   decoded+=decoder.decode(value,{stream:true});
  }
  decoded+=decoder.decode();
 }finally{reader.releaseLock();}
 const state=JSON.parse(decoded);
 return state&&typeof state==="object"&&!Array.isArray(state)?state:null;
}
async function stateFor(owner){
 const {data,error}=await admin.from("mediaflow_states").select("state_data").eq("user_id",owner).maybeSingle();
 if(error)throw new Error("Workspace is unavailable");
 if(!data?.state_data)return null;
 const raw=data.state_data;
 if(raw?.__mediaflowCompressed!=="gzip")return raw;
 if(typeof raw.data!=="string"||raw.data.length>44000000)throw new Error("Workspace exceeds public projection limit");
 return await decodeStateGzip(raw.data);
}
function canonicalCollection(state,id){
 return (Array.isArray(state?.collections)?state.collections:[]).find(c=>c&&String(c.id)===id)||null;
}
function safeCollectionHeader(c,owner){
 return {id:text(c.id,160),owner_id:owner,title:text(c.title||"Untitled Collection",150),description:text(c.description,850),cover_url:url(c.coverUrl),total:Array.isArray(c.titleIds)?c.titleIds.length:0,updated_at:Number(c.updatedAt)||0};
}
async function published(owner,id){
 const q=await admin.from("mfp_shared_collections").select("owner_id,collection_id,is_published").eq("owner_id",owner).eq("collection_id",id).eq("is_published",true).maybeSingle();
 if(q.error)throw new Error("Sharing is unavailable");
 return !!q.data;
}

async function canPublish(owner){
 const [p,v]=await Promise.all([
  admin.from("mfp_profiles").select("user_id,is_public").eq("user_id",owner).eq("is_public",true).maybeSingle(),
  admin.from("mfp_profile_showcase").select("enabled,show_collections").eq("owner_id",owner).eq("enabled",true).eq("show_collections",true).maybeSingle()
 ]);
 if(p.error||v.error)throw new Error("Publication permissions unavailable");
 return !!p.data&&!!v.data;
}
async function browseDirectory(){
 const q=await admin.from("mfp_shared_collections").select("owner_id,collection_id")
  .eq("is_published",true).order("updated_at",{ascending:false}).limit(80);
 if(q.error)throw new Error("Collection directory unavailable");
 const refs=q.data||[],ids=[...new Set(refs.map(x=>x.owner_id))];
 if(!ids.length)return json({collections:[],source:"live",stored_public_copy:false});
 const [ps,vs]=await Promise.all([
  admin.from("mfp_profiles").select("user_id,username,display_name").in("user_id",ids).eq("is_public",true),
  admin.from("mfp_profile_showcase").select("owner_id").in("owner_id",ids).eq("enabled",true).eq("show_collections",true)
 ]);
 if(ps.error||vs.error)throw new Error("Sharing privacy unavailable");
 const allow=new Set((vs.data||[]).map(x=>x.owner_id)),profiles=new Map((ps.data||[]).filter(x=>allow.has(x.user_id)).map(x=>[x.user_id,x]));
 const states=new Map(),collections=[];
 for(const ref of refs){
  const p=profiles.get(ref.owner_id);if(!p)continue;
  let s=states.get(ref.owner_id);
  if(!s){try{s=await stateFor(ref.owner_id)||{};}catch{continue;}states.set(ref.owner_id,s);}
  const c=canonicalCollection(s,String(ref.collection_id));if(!c||!/^[A-Za-z0-9_-]{1,160}$/.test(String(c.id)))continue;
  collections.push({...safeCollectionHeader(c,ref.owner_id),username:text(p.username,24),display_name:text(p.display_name,100)});
 }
 return json({collections,source:"live",stored_public_copy:false});
}
async function browseVerified(query,sort,offset,limit){
 // Only explicitly public Libraries. Scan source state, never store a duplicate.
 const q=await admin.from("mfp_profiles").select("user_id,username,show_ratings")
  .eq("is_public",true).eq("show_library",true).order("created_at",{ascending:true}).limit(50);
 if(q.error)throw new Error("Browse authorization unavailable");
 const profiles=q.data||[];
 if(!profiles.length)return json({titles:[],total:0,partial:false,source:"live",stored_public_copy:false});
 const visibility=await admin.from("mfp_profile_showcase").select("owner_id").in("owner_id",profiles.map(x=>x.user_id)).eq("enabled",true);
 if(visibility.error)throw new Error("Browse visibility unavailable");
 const publicIds=new Set((visibility.data||[]).map(x=>x.owner_id));
 const found=new Map(),term=query.toLowerCase();let partial=profiles.length===50;
 for(const p of profiles){
  if(!publicIds.has(p.user_id))continue;
  let s;try{s=await stateFor(p.user_id);}catch{partial=true;continue;}
  const seen=new Set();
  for(const t of Array.isArray(s?.library)?s.library:[]){
   if(!t||typeof t!=="object")continue;
   const malRaw=text(t.malId||t.mal_id,80),simklRaw=text(t.simklId||t.simkl_id,80),
    mal=/^[0-9]{1,80}$/.test(malRaw)?malRaw:"",
    simkl=/^[A-Za-z0-9_-]{1,80}$/.test(simklRaw)?simklRaw:"",
    title=text(t.title,250).trim();
   if((!mal&&!simkl)||!title||(term&&!title.toLowerCase().includes(term)))continue;
   const key=mal?"mal:"+mal:"simkl:"+simkl;
   if(seen.has(key))continue;seen.add(key);
   let row=found.get(key);
   if(!row){
    if(found.size>=20000){partial=true;continue;}
    row={key,title,mal_id:mal,simkl_id:simkl,cover_url:url(t.coverUrl||t.cover||t.imageUrl),username:text(p.username,24),owners_count:0,rating_count:0,rating_sum:0};
    found.set(key,row);
   }
   row.owners_count++;
   const rating=Number(t.rating);
   if(p.show_ratings===true&&Number.isFinite(rating)&&rating>0&&rating<=10){row.rating_sum+=rating;row.rating_count++;}
  }
 }
 const results=[...found.values()].map(x=>({
  key:x.key,title:x.title,mal_id:x.mal_id,simkl_id:x.simkl_id,cover_url:x.cover_url,
  username:x.username,owners_count:x.owners_count,rating_count:x.rating_count,
  average_rating:x.rating_count?Math.round(x.rating_sum/x.rating_count*100)/100:null
 }));
 results.sort(sort==="rated"?
  (a,b)=>(b.average_rating??-1)-(a.average_rating??-1)||b.rating_count-a.rating_count||a.title.localeCompare(b.title):
  (a,b)=>a.title.localeCompare(b.title));
 return json({titles:results.slice(offset,offset+limit),total:results.length,partial,source:"live",stored_public_copy:false});
}

async function showCollection(owner,id,offset,limit){
 if(!await canPublish(owner))return json({error:"Collection is not public"},404);
 // Published references MUST be checked first, on every request.
 if(!await published(owner,id))return json({error:"Collection is not public"},404);
 const state=await stateFor(owner);
 const c=canonicalCollection(state,id);
 if(!c)return json({error:"Collection is no longer available"},404);
 const ids=Array.isArray(c.titleIds)?c.titleIds.map(String):[];
 const library=new Map((Array.isArray(state?.library)?state.library:[]).filter(x=>x&&x.id).map(x=>[String(x.id),x]));
 const items=ids.slice(offset,offset+limit).map(key=>library.get(key)).filter(Boolean).map(item=>({title:text(item.title,250),cover_url:url(item.coverUrl||item.cover||item.imageUrl),mal_id:text(item.malId,50),simkl_id:text(item.simklId,50)}));
 return json({collection:safeCollectionHeader(c,owner),items,offset,next_offset:offset+limit<ids.length?offset+limit:null});
}

const SHARED_SECTION_FLAGS={
 library:"show_library",history:"show_history",order:"show_personal_order",
 old:"show_old_system",statistics:"show_statistics",ratings:"show_ratings",levels:"show_levels"
};
function liveTitle(t,cats,ratings=false){
 const v={id:text(t.id,160),title:text(t.title,250),
  cover_url:url(t.coverUrl||t.cover||t.imageUrl),status:text(t.status,32),
  priority:text(t.priority,32),category:text(cats.get(String(t.categoryId))||"",90),
  progress:Number.isFinite(Number(t.progress))?Math.max(0,Math.floor(Number(t.progress))):0,
  total:Number.isFinite(Number(t.total))?Math.max(0,Math.floor(Number(t.total))):null,
  mal_id:text(t.malId,60),simkl_id:text(t.simklId,60)};
 const rating=Number(t.rating);
 if(ratings&&Number.isFinite(rating)&&rating>=0&&rating<=10)v.rating=rating;
 return v;
}
function statsLive(state,categories){
 const library=Array.isArray(state?.library)?state.library:[],
  sessions=Array.isArray(state?.sessions)?state.sessions:[];
 const counts=new Map();
 for(const title of library){
  const key=text(title?.status||"planned",32);counts.set(key,(counts.get(key)||0)+1);
 }
 return {total_titles:library.length,total_sessions:sessions.length,
  total_collections:Array.isArray(state?.collections)?state.collections.length:0,
  total_categories:categories.size,
  by_status:[...counts].map(([name,count])=>({name,count}))};
}
async function sharedSection(username,section,offset,limit){
 const flag=SHARED_SECTION_FLAGS[section];
 if(!flag)return json({error:"Unknown shared section"},400);
 const p=await admin.from("mfp_profiles").select("user_id,is_public,username,show_library,show_history,show_personal_order,show_old_system,show_statistics,show_ratings,show_levels")
  .eq("username",username).eq("is_public",true).maybeSingle();
 if(p.error)throw new Error("Shared section unavailable");
 if(!p.data)return json({error:"Profile is private or unavailable"},404);
 const v=await admin.from("mfp_profile_showcase").select("enabled").eq("owner_id",p.data.user_id).eq("enabled",true).maybeSingle();
 if(v.error)throw new Error("Showcase visibility unavailable");
 if(!v.data||p.data[flag]!==true)return json({error:"This workspace section is private"},403);
 // Load canonical state only after authorization; never transmit entire state.
 const state=await stateFor(p.data.user_id)||{};
 const library=Array.isArray(state.library)?state.library:[],
  categories=new Map((Array.isArray(state.categories)?state.categories:[]).filter(c=>c?.id).map(c=>[String(c.id),text(c.name,90)]));
 const byId=new Map(library.filter(t=>t?.id).map(t=>[String(t.id),t]));
 let rows=[],summary=null;
 if(section==="library")rows=library.filter(t=>t?.id).map(t=>liveTitle(t,categories,p.data.show_ratings===true));
 if(section==="ratings")rows=library.filter(t=>t?.id&&Number(t.rating)>0&&Number(t.rating)<=10)
   .sort((a,b)=>Number(b.rating)-Number(a.rating)).map(t=>liveTitle(t,categories,true));
 if(section==="history"){
  const sessions=Array.isArray(state.sessions)?state.sessions:[];
  rows=sessions.slice().sort((a,b)=>Number(b?.timestamp||0)-Number(a?.timestamp||0)).map(session=>({
   date:text(session.date||session.timestamp,35),minutes:Number(session.minutes)||0,
   category:text(categories.get(String(session.categoryId))||"",90),
   titles:(Array.isArray(session.titles)?session.titles:[]).slice(0,30)
    .map(t=>text(t?.title||byId.get(String(t?.libraryId||""))?.title,220)).filter(Boolean)
  }));
 }
 if(section==="order"){
  const ids=Array.isArray(state.orderPlan?.titleIds)?state.orderPlan.titleIds:[];
  rows=[...new Set(ids.map(String))].map(id=>byId.get(id)).filter(Boolean).map(t=>liveTitle(t,categories,p.data.show_ratings===true));
 }
 if(section==="old"){
  const balances=state.oldSystem?.balances||{};
  rows=Object.entries(balances).slice(0,300).map(([id,val])=>({category:text(categories.get(String(id))||"Category",90),
    balance:Number.isFinite(Number(val))?Number(val):0}));
 }
 if(section==="statistics")summary=statsLive(state,categories);
 if(section==="levels")summary={available:false,note:"Live XP and level parity verification is required before publishing an authoritative level."};
 return json({section,items:rows.slice(offset,offset+limit),total:rows.length,
  offset,next_offset:offset+limit<rows.length?offset+limit:null,summary,
  source:"live_owner_workspace",stored_public_copy:false});
}

async function showProfile(username){
 const p=await admin.from("mfp_profiles").select("user_id,username,display_name,bio,avatar_url,is_public,show_library,show_history,show_personal_order,show_old_system,show_statistics,show_ratings,show_levels").eq("username",username).eq("is_public",true).maybeSingle();
 if(p.error)throw new Error("Public profile unavailable");
 if(!p.data)return json({error:"Profile not found or private"},404);
 const owner=p.data.user_id;
 const visibility=await admin.from("mfp_profile_showcase").select("enabled,show_collections,show_categories,show_statistics").eq("owner_id",owner).eq("enabled",true).maybeSingle();
 if(visibility.error)throw new Error("Public showcase unavailable");
 if(!visibility.data)return json({error:"Profile showcase is not published"},404);
 const result={
  user_id:owner,username:text(p.data.username,24),display_name:text(p.data.display_name,100),
  bio:text(p.data.bio,500),avatar_url:url(p.data.avatar_url),collections:[],categories:[],statistics:null,visible_sections:Object.fromEntries(Object.entries(SHARED_SECTION_FLAGS).map(([name,flag])=>[name,p.data[flag]===true]))
 };
 const opts=visibility.data;
 let live=null;
 if(opts.show_collections||opts.show_categories||opts.show_statistics)live=await stateFor(owner);
 if(opts.show_collections){
  const refs=await admin.from("mfp_shared_collections").select("collection_id").eq("owner_id",owner).eq("is_published",true).limit(100);
  if(refs.error)throw new Error("Collection sharing unavailable");
  for(const x of refs.data||[]){
   const c=canonicalCollection(live,String(x.collection_id));
   if(c)result.collections.push(safeCollectionHeader(c,owner));
  }
 }
 if(opts.show_categories){
  const publicCount=new Map();
  // Category names/counts only, never individual private titles unless a title
  // belongs to a separately shared collection.
  for(const x of Array.isArray(live?.library)?live.library:[])publicCount.set(String(x?.categoryId||""),(publicCount.get(String(x?.categoryId||""))||0)+1);
  result.categories=(Array.isArray(live?.categories)?live.categories:[]).slice(0,75).map(c=>({name:text(c?.name,70),title_count:publicCount.get(String(c?.id||""))||0}));
 }
 if(opts.show_statistics){
  const library=Array.isArray(live?.library)?live.library:[];
  result.statistics={library_titles:library.length,completed_titles:library.filter(x=>x?.status==="completed").length,collection_count:Array.isArray(live?.collections)?live.collections.length:0};
 }
 return json({profile:result});
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="GET")return json({error:"Read-only API"},405);
 if(!SUPABASE_URL||!SERVICE_ROLE)return json({error:"Unavailable"},503);
 try{
  const u=new URL(req.url),type=u.searchParams.get("type");
  if(type==="directory")return await browseDirectory();
  if(type==="browse"){
   const query=text(u.searchParams.get("query"),120).trim();
   const sort=u.searchParams.get("sort")==="rated"?"rated":"alpha";
   const offset=Math.min(20000,Math.max(0,Number.parseInt(u.searchParams.get("offset")||"0",10)||0));
   const limit=Math.min(40,Math.max(1,Number.parseInt(u.searchParams.get("limit")||"24",10)||24));
   return await browseVerified(query,sort,offset,limit);
  }
  if(type==="section"){
   const username=text(u.searchParams.get("username"),24).trim().toLowerCase();
   const section=text(u.searchParams.get("section"),32);
   if(!/^[a-z0-9_]{3,24}$/.test(username))return json({error:"Invalid username"},400);
   const offset=Math.min(100000,Math.max(0,Number.parseInt(u.searchParams.get("offset")||"0",10)||0));
   const limit=Math.min(80,Math.max(1,Number.parseInt(u.searchParams.get("limit")||"30",10)||30));
   return await sharedSection(username,section,offset,limit);
  }
  if(type==="profile"){
   const username=String(u.searchParams.get("username")||"").trim().toLowerCase();
   if(!/^[a-z0-9_]{3,24}$/.test(username))return json({error:"Invalid username"},400);
   return await showProfile(username);
  }
  if(type==="collection"){
   const owner=String(u.searchParams.get("owner")||"");
   const id=String(u.searchParams.get("id")||"");
   if(!uuid(owner)||!(/^[A-Za-z0-9_-]{1,160}$/).test(id))return json({error:"Invalid collection reference"},400);
   const offset=Math.min(100000,Math.max(0,Number.parseInt(String(u.searchParams.get("offset")||"0"),10)||0));
   const limit=Math.min(80,Math.max(1,Number.parseInt(String(u.searchParams.get("limit")||"40"),10)||40));
   return await showCollection(owner,id,offset,limit);
  }
  return json({error:"Unknown public resource"},404);
 }catch(error){console.error("Public projection failed",error);return json({error:"The public workspace is temporarily unavailable"},503);}
});
