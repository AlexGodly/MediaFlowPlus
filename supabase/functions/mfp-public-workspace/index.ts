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
 const rows=await api("mfp_profiles?select=user_id,username,display_name,bio,avatar_url,is_public,show_workspace_stats,show_workspace_categories,show_library,show_history,show_personal_order,show_old_system,show_statistics,show_ratings,show_levels&username=eq."+username+"&limit=1");
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
 const response={profile:publicOwner(owner),collections,sections:{library:owner.show_library===true,history:owner.show_history===true,order:owner.show_personal_order===true,old:owner.show_old_system===true,statistics:owner.show_statistics===true,ratings:owner.show_ratings===true,levels:owner.show_levels===true}};
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
async function discover(viewer){
 const pubs=await api("mfp_collection_publications?select=owner_id,collection_id&order=created_at.desc&limit=30");
 const owners=new Map(),data=new Map(),items=[];
 for(const p of pubs){
  let owner=owners.get(p.owner_id);
  if(owner===undefined){const rows=await api("mfp_profiles?select=user_id,username,display_name,bio,avatar_url,is_public&user_id=eq."+p.owner_id+"&limit=1");owner=rows[0]||null;owners.set(p.owner_id,owner);}
  if(!owner?.is_public||await blockedBetween(viewer,owner.user_id))continue;
  let state=data.get(p.owner_id);
  if(!state){state=await loadState(p.owner_id);data.set(p.owner_id,state);}
  const c=stateCollection(state,p.collection_id);if(c)items.push(collectionCard(c,owner));
 }
 return {collections:items};
}

/* Public workspace tabs: everything below is constructed from the CURRENT
 * canonical owner state at request time. Results are carefully allowlisted,
 * paginated and only returned when the owner opted into that particular tab.
 * There is no public mirror, materialized view or copied Library data. */
const SECTION_FLAGS={
 library:"show_library",history:"show_history",order:"show_personal_order",
 old:"show_old_system",statistics:"show_statistics",ratings:"show_ratings",
 levels:"show_levels"
};
function safeCount(n,max=1e9){const x=Number(n);return Number.isFinite(x)?Math.max(0,Math.min(max,Math.floor(x))):0;}
function safeDate(value){
 const n=Number(value);
 if(Number.isFinite(n)&&n>0){const d=new Date(n);return Number.isNaN(d.getTime())?"":d.toISOString();}
 const s=String(value||"");return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:"";
}
function categoryIndex(state){
 return new Map((Array.isArray(state.categories)?state.categories:[])
 .filter(x=>x?.id).map(x=>[String(x.id),clean(x.name,110)]));
}
function titleProjection(t,cats,allowRatings=false){
 const x={id:clean(t.id,160),title:clean(t.title,260),
  cover_url:httpsImage(t.coverUrl||t.cover||t.imageUrl),
  category:cats.get(String(t.categoryId))||"",
  status:clean(t.status,35),priority:clean(t.priority,25),
  progress:safeCount(t.progress),total:safeCount(t.total),
  mal_id:clean(t.malId,60),simkl_id:clean(t.simklId,60),
  media_service_id:clean(t.mediaServiceId,60)};
 if(allowRatings&&Number.isFinite(Number(t.rating))&&Number(t.rating)>0)
  x.rating=Math.max(0,Math.min(10,Number(t.rating)));
 return x;
}
function historyProjection(session,byId,cats){
 const rows=(Array.isArray(session.titles)?session.titles:[]).slice(0,40);
 const titles=rows.map(t=>{
  const item=byId.get(String(t.libraryId||""));
  return {title:clean(t.title||item?.title,260),cover_url:httpsImage(item?.coverUrl),
   consumed:safeCount(t.qty||t.amount||t.progressDelta),repeat:t.repeat===true};
 }).filter(t=>t.title);
 return {date:safeDate(session.date)||safeDate(session.timestamp),
  category:cats.get(String(session.categoryId))||"",
  minutes:safeCount(session.minutes,100000),
  amount:safeCount(session.actualAmount,1000000),
  unit:clean(session.unit,30),titles};
}
function liveOrderRows(state,byId,cats,allowRatings){
 const order=state.orderPlan&&typeof state.orderPlan==="object"?state.orderPlan:{};
 const ids=Array.isArray(order.titleIds)?order.titleIds:[];
 const seen=new Set(),out=[];
 for(const id of ids){
  const key=String(id);if(seen.has(key))continue;seen.add(key);
  const item=byId.get(key);if(item)out.push(titleProjection(item,cats,allowRatings));
 }
 return out;
}
function liveOldRows(state,cats){
 const old=state.oldSystem&&typeof state.oldSystem==="object"?state.oldSystem:{};
 const balances=old.balances&&typeof old.balances==="object"?old.balances:{};
 return Object.entries(balances).slice(0,300).map(([key,val])=>({
  category:cats.get(key)||"Category",
  balance:Number.isFinite(Number(val))?Number(val):0
 }));
}
function liveStats(state,cats){
 const library=Array.isArray(state.library)?state.library:[];
 const sessions=Array.isArray(state.sessions)?state.sessions:[];
 const statuses=new Map(),categories=new Map();
 for(const t of library){
  const st=clean(t.status||"planned",35);
  statuses.set(st,(statuses.get(st)||0)+1);
  const name=cats.get(String(t.categoryId))||"Uncategorized";
  categories.set(name,(categories.get(name)||0)+1);
 }
 const mins=sessions.reduce((sum,s)=>sum+safeCount(s?.minutes,100000),0);
 return {total_titles:library.length,total_sessions:sessions.length,
  total_minutes:mins,completed_titles:library.filter(t=>String(t.status)==="completed").length,
  by_status:[...statuses].map(([name,count])=>({name,count})),
  by_category:[...categories].map(([name,count])=>({name,count}))};
}
function liveLevels(state){
 // Use existing authoritative persisted XP totals only when recognizable.
 // The app's v334 active-time/XP and streak rules require parity checks before
 // publishing a computed level or claiming a verified global rank.
 const xp=state?.xpLedger?.totalXP;
 if(!Number.isFinite(Number(xp))||Number(xp)<0)return {
  available:false,note:"Live level parity is being verified against the current Workspace engine."
 };
 return {available:false,note:"Live XP ranking requires parity with all Workspace reward ledgers."};
}
async function workspaceSection(owner,section,offset,limit){
 if(!Object.hasOwn(SECTION_FLAGS,section))return {error:"Unknown workspace section",status:400};
 if(owner[SECTION_FLAGS[section]]!==true)return {error:"This workspace section is private",status:403};
 const state=await loadState(owner.user_id);
 const lib=Array.isArray(state.library)?state.library:[];
 const cats=categoryIndex(state),byId=new Map(lib.filter(t=>t?.id).map(t=>[String(t.id),t]));
 const allowRatings=owner.show_ratings===true;
 let rows=[],summary=null;
 if(section==="library"){
  const selected=lib.filter(t=>t&&t.id);
  return {section,owner:publicOwner(owner),items:selected.slice(offset,offset+limit).map(t=>titleProjection(t,cats,allowRatings)),
   total:selected.length,offset,next_offset:offset+limit<selected.length?offset+limit:null,
   summary:null,source:"current_owner_workspace",stored_public_copy:false};
 }
 if(section==="ratings")rows=lib.filter(t=>t&&Number(t.rating)>0&&Number(t.rating)<=10)
  .sort((a,b)=>Number(b.rating)-Number(a.rating)||clean(a.title).localeCompare(clean(b.title)))
  .map(t=>titleProjection(t,cats,true));
 if(section==="history")rows=(Array.isArray(state.sessions)?state.sessions:[])
  .slice().sort((a,b)=>Number(b?.timestamp||0)-Number(a?.timestamp||0))
  .map(s=>historyProjection(s,byId,cats));
 if(section==="order")rows=liveOrderRows(state,byId,cats,allowRatings);
 if(section==="old")rows=liveOldRows(state,cats);
 if(section==="statistics")summary=liveStats(state,cats);
 if(section==="levels")summary=liveLevels(state);
 const total=rows.length;
 return {section,owner:publicOwner(owner),items:rows.slice(offset,offset+limit),
  total,offset,next_offset:offset+limit<total?offset+limit:null,
  summary,source:"current_owner_workspace",stored_public_copy:false};
}


/* Live Browse and Top: aggregate original title IDs/ratings in memory ONLY.
 * Zero Community media copy tables. Bounded scope prevents exhaustive
 * unbounded decompression on every request; partial coverage is disclosed.
 */
function canonicalMediaIdentity(t){
 const sources=[['mal','malId'],['simkl','simklId'],['anilist','anilistId'],
  ['tmdb','tmdbId'],['imdb','imdbId'],['kitsu','kitsuId']];
 for(const [provider,key] of sources){
  const value=clean(t?.[key],90);
  if(/^[a-zA-Z0-9:_-]{1,90}$/.test(value))return provider+':'+value;
 }
 const extra=t?.externalIds;
 if(extra&&typeof extra==='object'&&!Array.isArray(extra)){
  for(const [provider] of sources){
   const value=clean(extra[provider],90);
   if(/^[a-zA-Z0-9:_-]{1,90}$/.test(value))return provider+':'+value;
  }
 }
 return '';
}
async function liveCatalog(scope,search,offset,limit,viewer){
 // Every request requires the current viewer's verified Plus auth JWT.
 // Public profile deep links remain guest-readable through the other route.
 if(!viewer)return {error:"Sign in to browse live Community titles",status:401};
 if(scope!=="titles"&&scope!=="top")return {error:"Invalid Community catalog",status:400};
 const flag=scope==="top"?"show_ratings":"show_library";
 const raw=await api("mfp_profiles?select=user_id,username,display_name,is_public,show_library,show_ratings&is_public=eq.true&"+flag+"=eq.true&order=created_at.asc&limit=13");
 const eligible=raw.filter(p=>p.is_public===true&&p[flag]===true);
 const capped=eligible.slice(0,8),groups=new Map();
 let partial=raw.length>=13||eligible.length>8,scanned=0;
 for(const owner of capped){
  if(await blockedBetween(viewer,owner.user_id))continue;
  const state=await loadState(owner.user_id),library=Array.isArray(state.library)?state.library:[];
  scanned++;
  if(library.length>75000)partial=true;
  const seen=new Set();
  for(const t of library.slice(0,75000)){
   if(!t||typeof t!=="object")continue;
   const mediaKey=canonicalMediaIdentity(t);if(!mediaKey||seen.has(mediaKey))continue;
   seen.add(mediaKey);
   let row=groups.get(mediaKey);
   if(!row){
    row={media_key:mediaKey,title:clean(t.title,240),cover_url:httpsImage(t.coverUrl),
     users_count:0,ratings_count:0,sum:0};
    groups.set(mediaKey,row);
   }
   row.users_count++;
   if(owner.show_ratings===true&&Number(t.rating)>0&&Number(t.rating)<=10){
    row.sum+=Number(t.rating);row.ratings_count++;
   }
  }
 }
 const filter=clean(search,120).trim().toLocaleLowerCase();
 let items=[...groups.values()].filter(row=>(!filter||row.title.toLocaleLowerCase().includes(filter))&&(scope!=="top"||row.ratings_count>0)).map(row=>({
  media_key:row.media_key,title:row.title,cover_url:row.cover_url,
  users_count:row.users_count,ratings_count:row.ratings_count,
  average_rating:row.ratings_count?Math.round(row.sum/row.ratings_count*100)/100:null
 }));
 items.sort(scope==="top"?
  (a,b)=>(b.average_rating??0)-(a.average_rating??0)||b.ratings_count-a.ratings_count||a.title.localeCompare(b.title):
  (a,b)=>b.users_count-a.users_count||b.ratings_count-a.ratings_count||a.title.localeCompare(b.title));
 const total=items.length;
 return {source:"current_owner_workspace",stored_public_copy:false,scope,partial,
  scanned_profiles:scanned,eligible_sample:eligible.length,
  total,items:items.slice(offset,offset+limit),offset,next_offset:offset+limit<total?offset+limit:null};
}

Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="GET")return reply({error:"Read-only endpoint"},405);
 if(!PROJECT||!SECRET)return reply({error:"Public showcase unavailable"},503);
 try{
  const url=new URL(req.url),kind=url.searchParams.get("kind")||"profile";
  const viewer=await userId(req);
  if(kind==="catalog"){
   const scope=clean(url.searchParams.get("scope")||"titles",12);
   const search=clean(url.searchParams.get("search"),120);
   const offset=Math.max(0,Math.min(5000,Math.floor(Number(url.searchParams.get("offset"))||0)));
   const limit=Math.max(1,Math.min(50,Math.floor(Number(url.searchParams.get("limit"))||25)));
   const data=await liveCatalog(scope,search,offset,limit,viewer);
   return data?.error?reply({error:data.error},data.status||400):reply(data);
  }
  if(kind==="discover")return reply(await discover(viewer));
  const username=clean(url.searchParams.get("username"),24).toLowerCase();
  if(!/^[a-z0-9_]{3,24}$/.test(username))return reply({error:"Invalid username"},400);
  const owner=await ownerWithAccess(username,viewer);
  if(!owner)return reply({error:"Profile unavailable or private"},404);
  if(kind==="profile")return reply(await profileView(owner,viewer));
  if(kind==="section"){
   const section=clean(url.searchParams.get("section"),32);
   const offset=Math.max(0,Math.min(100000,Math.floor(Number(url.searchParams.get("offset"))||0)));
   const limit=Math.max(1,Math.min(100,Math.floor(Number(url.searchParams.get("limit"))||40)));
   const result=await workspaceSection(owner,section,offset,limit);
   return result?.error?reply({error:result.error},result.status||403):reply(result);
  }
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
