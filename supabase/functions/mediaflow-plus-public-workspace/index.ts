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
async function showCollection(owner,id,offset,limit){
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
async function showProfile(username){
 const p=await admin.from("mfp_profiles").select("user_id,username,display_name,bio,avatar_url,is_public").eq("username",username).eq("is_public",true).maybeSingle();
 if(p.error)throw new Error("Public profile unavailable");
 if(!p.data)return json({error:"Profile not found or private"},404);
 const owner=p.data.user_id;
 const visibility=await admin.from("mfp_profile_showcase").select("enabled,show_collections,show_categories,show_statistics").eq("owner_id",owner).eq("enabled",true).maybeSingle();
 if(visibility.error)throw new Error("Public showcase unavailable");
 if(!visibility.data)return json({error:"Profile showcase is not published"},404);
 const result={
  user_id:owner,username:text(p.data.username,24),display_name:text(p.data.display_name,100),
  bio:text(p.data.bio,500),avatar_url:url(p.data.avatar_url),collections:[],categories:[],statistics:null
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
