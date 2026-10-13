// MediaFlow Plus v412: live, read-only, privacy-checked projection.
 // Source of truth: owner mediaflow_states.state_data. Never duplicate an owner's
 // Library or Collections in the Community schema or return the entire snapshot.
const cors={
 "access-control-allow-origin":"*",
 "access-control-allow-headers":"authorization,apikey,content-type,x-client-info",
 "access-control-allow-methods":"GET,OPTIONS",
 "cache-control":"private, no-store, max-age=0",
 "content-type":"application/json; charset=utf-8",
 "x-content-type-options":"nosniff"
};
const PROJECT=Deno.env.get("SUPABASE_URL")||"";
const SECRET=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers:cors});}
function clean(x,n=200){return String(x??"").slice(0,n);}
function httpsImage(x){const s=clean(x,1024);try{const u=new URL(s);return u.protocol==="https:"?u.href:"";}catch(_){return "";}}
async function api(path){
 const res=await fetch(PROJECT+"/rest/v1/"+path,{headers:{"apikey":SECRET,"authorization":"Bearer "+SECRET,"accept":"application/json"}});
 if(!res.ok)throw new Error("Database lookup unavailable ("+res.status+")");
 return await res.json();
}
async function userId(req){
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
 if(!token||token===SECRET)return "";
 try{
  const res=await fetch(PROJECT+"/auth/v1/user",{headers:{"apikey":SECRET,"authorization":"Bearer "+token}});
  if(!res.ok)return "";
  const user=await res.json();
  return /^[\da-f-]{36}$/i.test(String(user?.id||""))?user.id:"";
 }catch(_){return "";}
}
async function blockedBetween(userId,ownerId){
 if(!userId||userId===ownerId)return false;
 const r=await api("mfp_blocks?select=blocker_id&or="+encodeURIComponent("(and(blocker_id.eq."+userId+",blocked_id.eq."+ownerId+"),and(blocker_id.eq."+ownerId+",blocked_id.eq."+userId+"))")+"&limit=1");
 return r.length>0;
}
async function loadState(ownerId){
 const rows=await api("mediaflow_states?select=state_data&user_id=eq."+ownerId+"&limit=1");
 const raw=rows[0]?.state_data;
 if(!raw)return {};
 if(raw.__mediaflowCompressed!=="gzip")return raw&&typeof raw==="object"?raw:{};
 const text=clean(raw.data,35000000);
 if(text.length!==String(raw.data||"").length)throw new Error("Workspace exceeds public sharing budget");
 const bytes=Uint8Array.from(atob(text),c=>c.charCodeAt(0));
 const decompressed=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
 if(decompressed.length>110000000)throw new Error("Workspace exceeds public sharing budget");
 const parsed=JSON.parse(decompressed);
 return parsed&&typeof parsed==="object"?parsed:{};
}
function publicOwner(profile){
 return {username:clean(profile.username,24),display_name:clean(profile.display_name,100),bio:clean(profile.bio,500),avatar_url:httpsImage(profile.avatar_url)};
}
function stateCollection(state,id){
 return (Array.isArray(state.collections)?state.collections:[]).find(c=>String(c?.id||"")===id)||null;
}
function collectionCard(c,profile){
 return {id:clean(c.id,160),title:clean(c.title,120),description:clean(c.description,1000),
 cover_url:httpsImage(c.coverUrl),count:Array.isArray(c.titleIds)?c.titleIds.length:0,
 updated_at:Number(c.updatedAt)||0,owner:publicOwner(profile)};
}
async function ownerWithAccess(username,viewer){
 const rows=await api("mfp_profiles?select=user_id,username,display_name,bio,avatar_url,is_public,show_workspace_stats,show_workspace_categories&username=eq."+username+"&limit=1");
 const owner=rows[0];if(!owner)return null;
 if(!owner.is_public&&owner.user_id!==viewer)return null;
 if(await blockedBetween(viewer,owner.user_id))return null;
 return owner;
}
async function publications(ownerId){
 return await api("mfp_collection_publications?select=owner_id,collection_id,created_at&owner_id=eq."+ownerId+"&order=created_at.desc&limit=100");
}
async function profileView(owner,viewer){
 const pubs=await publications(owner.user_id);
 const state=await loadState(owner.user_id);
 const collections=pubs.map(p=>stateCollection(state,p.collection_id)).filter(Boolean).map(c=>collectionCard(c,owner));
 const response={profile:publicOwner(owner),collections};
 if(owner.show_workspace_stats===true){
  response.workspace={title_count:Array.isArray(state.library)?state.library.length:0,
   collection_count:Array.isArray(state.collections)?state.collections.length:0,
   category_count:Array.isArray(state.categories)?state.categories.length:0};
 }
 if(owner.show_workspace_categories===true){
  response.categories=(Array.isArray(state.categories)?state.categories:[]).filter(c=>c?.id).slice(0,120).map(c=>({name:clean(c.name,100)}));
 }
 return response;
}
async function collectionView(owner,id,offset,limit){
 const pubs=await publications(owner.user_id);
 if(!pubs.some(p=>p.collection_id===id))return null;
 const state=await loadState(owner.user_id),c=stateCollection(state,id);
 if(!c)return null;
 const ids=Array.isArray(c.titleIds)?c.titleIds.map(String):[];
 const byId=new Map((Array.isArray(state.library)?state.library:[]).filter(x=>x?.id).map(x=>[String(x.id),x]));
 const categories=new Map((Array.isArray(state.categories)?state.categories:[]).filter(x=>x?.id).map(x=>[String(x.id),clean(x.name,100)]));
 const slice=ids.slice(offset,offset+limit);
 const titles=slice.map(key=>byId.get(key)).filter(Boolean).map(item=>({
  title:clean(item.title,250),cover_url:httpsImage(item.coverUrl||item.cover||item.imageUrl),
  total:Number.isFinite(Number(item.total))?Math.max(0,Math.floor(Number(item.total))):null,
  category:categories.get(String(item.categoryId))||"",
  mal_id:clean(item.malId,45),simkl_id:clean(item.simklId,45),media_service_id:clean(item.mediaServiceId,45)
 }));
 return {owner:publicOwner(owner),collection:collectionCard(c,owner),titles,offset,
 total:ids.length,next_offset:offset+slice.length<ids.length?offset+slice.length:null};
}
async function discover(){
 const pubs=await api("mfp_collection_publications?select=owner_id,collection_id&order=created_at.desc&limit=30");
 const owners=new Map(),data=new Map(),items=[];
 for(const p of pubs){
  let owner=owners.get(p.owner_id);
  if(owner===undefined){const rows=await api("mfp_profiles?select=user_id,username,display_name,bio,avatar_url,is_public&user_id=eq."+p.owner_id+"&limit=1");owner=rows[0]||null;owners.set(p.owner_id,owner);}
  if(!owner?.is_public)continue;
  let state=data.get(p.owner_id);
  if(!state){state=await loadState(p.owner_id);data.set(p.owner_id,state);}
  const c=stateCollection(state,p.collection_id);if(c)items.push(collectionCard(c,owner));
 }
 return {collections:items};
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="GET")return reply({error:"Read-only endpoint"},405);
 if(!PROJECT||!SECRET)return reply({error:"Public showcase unavailable"},503);
 try{
  const url=new URL(req.url),kind=url.searchParams.get("kind")||"profile";
  const viewer=await userId(req);
  if(kind==="discover")return reply(await discover());
  const username=clean(url.searchParams.get("username"),24).toLowerCase();
  if(!/^[a-z0-9_]{3,24}$/.test(username))return reply({error:"Invalid username"},400);
  const owner=await ownerWithAccess(username,viewer);
  if(!owner)return reply({error:"Profile unavailable or private"},404);
  if(kind==="profile")return reply(await profileView(owner,viewer));
  if(kind==="collection"){
   const id=clean(url.searchParams.get("collection_id"),160);
   if(!/^[a-zA-Z0-9_-]{1,160}$/.test(id))return reply({error:"Invalid collection ID"},400);
   const offset=Math.max(0,Math.min(100000,Number(url.searchParams.get("offset"))||0));
   const limit=Math.max(1,Math.min(500,Number(url.searchParams.get("limit"))||80));
   const result=await collectionView(owner,id,offset,limit);
   return result?reply(result):reply({error:"Collection unavailable or private"},404);
  }
  return reply({error:"Unknown public resource"},400);
 }catch(error){
  console.error("mfp public showcase request failed",String(error));
  return reply({error:"Unable to load public workspace right now"},503);
 }
});
