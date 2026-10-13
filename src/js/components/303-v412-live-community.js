/* MediaFlow Plus v412 — Canonical live Community collection references.
 * Publication and subscription tables contain IDs and permission flags only.
 * Public data is projected on demand by a read-only Supabase Edge Function.
 */
const MFP412_SHARE={showcase:null,shown:new Set(),subs:[],lookup:new Map(),loading:false,publicRoute:'',publicItems:[],publicInfo:null,busy:false,owner:''};
const mfp412ShareEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mfp412PublicApi(query){
 const url=SUPABASE_URL+'/functions/v1/mediaflow-plus-public-workspace?'+new URLSearchParams(query);
 return fetch(url,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY},cache:'no-store'}).then(async res=>{
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(body.error||'Public content is unavailable');
  return body;
 });
}
function mfp412ProfileLink(username){return location.origin+location.pathname+'#/u/'+encodeURIComponent(username);}
function mfp412CollectionLink(owner,id){return location.origin+location.pathname+'#/collection/'+encodeURIComponent(owner)+'/'+encodeURIComponent(id);}
async function mfp412Copy(value){
 try{await navigator.clipboard.writeText(value);showToast('Link copied ✓');}
 catch(_){window.prompt('Copy the sharing link',value);}
}
function mfp412OpenPublicProfile(username){location.hash='#/u/'+encodeURIComponent(username);}
function mfp412OpenPublicCollection(owner,id){location.hash='#/collection/'+encodeURIComponent(owner)+'/'+encodeURIComponent(id);}
function mfp412PublicClose(){if(location.hash.startsWith('#/'))location.hash='';document.getElementById('mf412-public-route')?.remove();}
function mfp412PublicShell(){
 let root=document.getElementById('mf412-public-route');
 if(!root){root=document.createElement('div');root.id='mf412-public-route';root.className='mf412-public-route';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Shared MediaFlow Plus workspace');document.body.append(root);}
 return root;
}
function mfp412PublicLoading(){mfp412PublicShell().innerHTML='<div class="mf412-public-panel"><button class="mf412-public-close" onclick="App.mfp412PublicClose()">Close ×</button><p class="mf412-empty">Opening the live public workspace…</p></div>';}
function mfp412PublicError(error){
 const root=mfp412PublicShell();
 root.innerHTML='<div class="mf412-public-panel"><button class="mf412-public-close" onclick="App.mfp412PublicClose()">Close ×</button><h2>Shared workspace unavailable</h2><p>'+mfp412ShareEsc(error?.message||error||'Could not load public content')+'</p><p>No private workspace data has been exposed or modified.</p><button class="btn" onclick="App.mfp412PublicRetry()">Try again</button></div>';
}
function mfp412PublicRetry(){void mfp412Route();}
function mfp412PublicProfileView(profile){
 const cols=Array.isArray(profile.collections)?profile.collections:[];
 const stats=profile.statistics;
 const cats=Array.isArray(profile.categories)?profile.categories:[];
 return '<section class="mf412-public-panel">'+
  '<header class="mf412-public-head"><div class="mf412-public-avatar">'+mfp412ShareEsc((profile.display_name||profile.username||'?').slice(0,1).toUpperCase())+'</div><div><span class="mf412-kicker">PUBLIC MEDIAFLOW PLUS WORKSPACE</span><h1>'+mfp412ShareEsc(profile.display_name||profile.username)+'</h1><p>@'+mfp412ShareEsc(profile.username)+'</p></div><button class="mf412-public-close" onclick="App.mfp412PublicClose()">Close ×</button></header>'+
  '<p>'+mfp412ShareEsc(profile.bio||'Welcome to my workspace.')+'</p>'+
  (stats?'<div class="mf412-public-metrics"><div><b>'+Number(stats.library_titles||0).toLocaleString()+'</b><span>Library titles</span></div><div><b>'+Number(stats.completed_titles||0).toLocaleString()+'</b><span>Completed</span></div><div><b>'+Number(stats.collection_count||0).toLocaleString()+'</b><span>Collections</span></div></div>':'')+
  (cats.length?'<h2>Workspace categories</h2><div class="mf412-share-chips">'+cats.map(c=>'<span>'+mfp412ShareEsc(c.name)+' · '+Number(c.title_count||0).toLocaleString()+'</span>').join('')+'</div>':'')+
  '<h2>Shared collections</h2>'+
  (cols.length?'<div class="mf412-shared-list">'+cols.map(c=>'<article><h3>'+mfp412ShareEsc(c.title)+'</h3><p>'+mfp412ShareEsc(c.description)+'</p><small>'+Number(c.total||0).toLocaleString()+' titles</small><div class="mf412-share-actions"><button onclick="App.mfp412OpenPublicCollection(\''+mfp412ShareEsc(c.owner_id)+'\',\''+mfp412ShareEsc(c.id)+'\')">View live collection</button></div></article>').join('')+'</div>':'<p class="mf412-empty">No collections have been published.</p>')+'</section>';
}
function mfp412PublicCollectionView(data){
 const c=data.collection,items=data.items||[];
 const sameOwner=String(c.owner_id)===String(AUTH_USER?.id||'');
 return '<section class="mf412-public-panel">'+
  '<header class="mf412-public-head"><div><span class="mf412-kicker">LIVE COMMUNITY COLLECTION</span><h1>'+mfp412ShareEsc(c.title)+'</h1><p>'+Number(c.total||0).toLocaleString()+' titles · Synced from the owner workspace</p></div><button class="mf412-public-close" onclick="App.mfp412PublicClose()">Close ×</button></header>'+
  '<p>'+mfp412ShareEsc(c.description)+'</p>'+
  '<div class="mf412-share-actions">'+
   (!AUTH_USER?'<span class="hint">Sign in to subscribe or convert this collection.</span>':
    sameOwner?'<span class="hint">This is your own collection.</span>':
    '<button onclick="App.mfp412Subscribe(\''+mfp412ShareEsc(c.owner_id)+'\',\''+mfp412ShareEsc(c.id)+'\')">Subscribe</button>'+
    '<button onclick="App.mfp412ConvertPrompt(\''+mfp412ShareEsc(c.owner_id)+'\',\''+mfp412ShareEsc(c.id)+'\')">Convert to my collection</button>')+
   '<button onclick="App.mfp412CopyCollection(\''+mfp412ShareEsc(c.owner_id)+'\',\''+mfp412ShareEsc(c.id)+'\')">Copy link</button>'+
  '</div><h2>Titles</h2><div id="mf412-public-items" class="mf412-public-items">'+items.map(item=>'<div><b>'+mfp412ShareEsc(item.title)+'</b></div>').join('')+'</div>'+
  (data.next_offset!==null?'<button class="btn" onclick="App.mfp412PublicMore()">Load more titles</button>':'')+'</section>';
}
async function mfp412Route(){
 const hash=location.hash,stamp=hash;
 if(hash.startsWith('#/community'))return;
 if(!hash.startsWith('#/u/')&&!hash.startsWith('#/collection/')){mfp412PublicClose();return;}
 mfp412PublicLoading();
 try{
  let data=null;
  if(hash.startsWith('#/u/')){
   const username=decodeURIComponent(hash.slice(4));
   if(!/^[a-z0-9_]{3,24}$/.test(username))throw new Error('Invalid profile URL');
   data=await mfp412PublicApi({type:'profile',username});
   if(location.hash!==stamp)return;
   MFP412_SHARE.publicInfo={kind:'profile',data};
   mfp412PublicShell().innerHTML=mfp412PublicProfileView(data.profile);
  }else{
   const parts=hash.slice('#/collection/'.length).split('/').map(decodeURIComponent);
   if(parts.length!==2)throw new Error('Invalid collection URL');
   const [owner,id]=parts;
   data=await mfp412PublicApi({type:'collection',owner,id,offset:0,limit:40});
   if(location.hash!==stamp)return;
   MFP412_SHARE.publicItems=[...(data.items||[])];MFP412_SHARE.publicInfo={kind:'collection',owner,id,data};
   mfp412PublicShell().innerHTML=mfp412PublicCollectionView(data);
  }
 }catch(e){if(location.hash===stamp)mfp412PublicError(e);}
}
async function mfp412PublicMore(){
 const current=MFP412_SHARE.publicInfo;
 if(!current||current.kind!=='collection'||current.data.next_offset===null)return;
 try{
  const data=await mfp412PublicApi({type:'collection',owner:current.owner,id:current.id,offset:current.data.next_offset,limit:40});
  MFP412_SHARE.publicItems.push(...(data.items||[]));current.data.next_offset=data.next_offset;
  const host=document.getElementById('mf412-public-items');
  if(host)host.insertAdjacentHTML('beforeend',(data.items||[]).map(t=>'<div><b>'+mfp412ShareEsc(t.title)+'</b></div>').join(''));
  const button=host?.parentElement?.querySelector('button[onclick*="mfp412PublicMore"]');
  if(data.next_offset===null)button?.remove();
 }catch(e){showToast(e?.message||'Could not load more titles');}
}
async function mfp412LoadShowcase(){
 if(!AUTH_USER||!supabase)return;
 try{
  const [p,shared]=await Promise.all([
   supabase.from('mfp_profile_showcase').select('enabled,show_collections,show_categories,show_statistics').eq('owner_id',AUTH_USER.id).maybeSingle(),
   supabase.from('mfp_shared_collections').select('collection_id').eq('owner_id',AUTH_USER.id).eq('is_published',true)
  ]);
  if(p.error)throw p.error;if(shared.error)throw shared.error;
  MFP412_SHARE.showcase=p.data||{enabled:false,show_collections:true,show_categories:false,show_statistics:false};
  MFP412_SHARE.shown=new Set((shared.data||[]).map(x=>String(x.collection_id)));
  const form=document.getElementById('mf412-showcase-form');
  if(form){
   for(const key of ['enabled','show_collections','show_categories','show_statistics']){
    const el=form.elements.namedItem(key);
    if(el)el.checked=!!MFP412_SHARE.showcase[key];
   }
  }
 }catch(e){console.warn('Showcase preferences unavailable',e);}
}
function mfp412ShowcaseHtml(){
 return '<section class="mfp408-card mf412-profile-sharing"><h3>Public workspace showcase</h3><p class="mfp408-muted">Opt in to live public views. Your full private Library and Settings never become readable by other accounts.</p>'+
  '<form id="mf412-showcase-form" onsubmit="return App.mfp412SaveShowcase(event)">'+
  [['enabled','Publish public workspace page'],['show_collections','Show my published collections'],['show_categories','Show category names and counts'],['show_statistics','Show aggregate statistics']].map(([key,label])=>
   '<label class="mf412-share-toggle"><input type="checkbox" name="'+key+'"><span>'+label+'</span></label>').join('')+
  '<button type="submit">Save sharing preferences</button></form>'+
  '<div class="mf412-share-actions"><button type="button" onclick="App.mfp412ShareProfile()">Copy profile link</button></div></section>';
}
const mfp412ProfileRowsBase=mfp408RenderRows;
mfp408RenderRows=function(){
 let html=mfp412ProfileRowsBase.apply(this,arguments);
 if(MFP408.tab==='profile')html+=mfp412ShowcaseHtml();
 return html;
};
async function mfp412SaveShowcase(event){
 event.preventDefault();
 if(!AUTH_USER||!supabase)return;
 const data=new FormData(event.target),payload={owner_id:AUTH_USER.id,
  enabled:data.has('enabled'),show_collections:data.has('show_collections'),
  show_categories:data.has('show_categories'),show_statistics:data.has('show_statistics'),
  updated_at:new Date().toISOString()};
 try{
  const r=await supabase.from('mfp_profile_showcase').upsert(payload,{onConflict:'owner_id'});
  if(r.error)throw r.error;MFP412_SHARE.showcase=payload;
  showToast(payload.enabled?'Public workspace settings saved ✓':'Workspace showcase unpublished ✓');
 }catch(e){showToast('Could not save sharing settings: '+(e?.message||e));}
}
function mfp412ShareProfile(){
 const username=String(MFP408.profile?.username||'');
 if(!username)return showToast('Save a public Community username first.');
 if(!MFP412_SHARE.showcase?.enabled)return showToast('Enable your public workspace showcase first.');
 if(MFP408.profile?.is_public===false)return showToast('Your Community profile must also be public.');
 void mfp412Copy(mfp412ProfileLink(username));
}
const mfp412ProfileTabBase=App.mfp408Tab;
App.mfp408Tab=function(tab){
 const result=mfp412ProfileTabBase.apply(this,arguments);
 if(tab==='profile')setTimeout(()=>{void mfp412LoadShowcase();},180);
 return result;
};
async function mfp412OpenShareDialog(id){
 const collection=v274CollectionById(id);if(!collection||!AUTH_USER||!/^[A-Za-z0-9_-]{1,160}$/.test(String(id)))return;
 await mfp412LoadShowcase();
 const on=MFP412_SHARE.shown.has(String(id));
 document.getElementById('mf412-share-dialog')?.remove();
 const wrap=document.createElement('div');wrap.id='mf412-share-dialog';wrap.className='mf412-share-dialog';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');
 wrap.innerHTML='<section class="mf412-public-panel"><button class="mf412-public-close" onclick="document.getElementById(\'mf412-share-dialog\').remove()">Close ×</button>'+
  '<h2>Share '+mfp412ShareEsc(collection.title)+'</h2><p>Sharing links to this original collection. It does not copy any Library or collection data to the Community database.</p>'+
  '<p class="mf412-share-state">'+(on?'Currently published':'Not published')+'</p><div class="mf412-share-actions">'+
  (on?'<button onclick="App.mfp412UnpublishOwned(\''+mfp412ShareEsc(id)+'\')">Unpublish</button>':
  '<button onclick="App.mfp412PublishOwned(\''+mfp412ShareEsc(id)+'\')">Publish collection</button>')+
  (on?'<button onclick="App.mfp412CopyCollection(\''+mfp412ShareEsc(AUTH_USER.id)+'\',\''+mfp412ShareEsc(id)+'\')">Copy public link</button>':'')+
  '</div></section>';
 document.body.append(wrap);
}
async function mfp412PublishOwned(id){
 if(MFP412_SHARE.busy||!AUTH_USER||!v274CollectionById(id))return;
 if(!confirm('Publish this original Collection and its included title names and covers to anyone with the link?'))return;
 MFP412_SHARE.busy=true;
 try{
  // Canonical source must be saved before any public reference is enabled.
  await saveState();
  const r=await supabase.from('mfp_shared_collections').upsert({owner_id:AUTH_USER.id,collection_id:id,is_published:true,updated_at:new Date().toISOString()},{onConflict:'owner_id,collection_id'});
  if(r.error)throw r.error;
  MFP412_SHARE.shown.add(String(id));await mfp412OpenShareDialog(id);
  await mfp412Copy(mfp412CollectionLink(AUTH_USER.id,id));
 }catch(e){showToast('Publishing failed: '+(e?.message||e));}
 finally{MFP412_SHARE.busy=false;}
}
async function mfp412UnpublishOwned(id){
 if(!confirm('Unpublish this collection immediately? Subscribers will no longer be able to view its contents.'))return;
 try{
  const r=await supabase.from('mfp_shared_collections').update({is_published:false,updated_at:new Date().toISOString()}).eq('owner_id',AUTH_USER.id).eq('collection_id',id);
  if(r.error)throw r.error;MFP412_SHARE.shown.delete(String(id));
  await mfp412OpenShareDialog(id);showToast('Collection unpublished ✓');
 }catch(e){showToast(e?.message||'Unpublish failed');}
}
function mfp412CopyCollection(owner,id){void mfp412Copy(mfp412CollectionLink(owner,id));}
const mfp412CollectionDetailBase=v274CollectionDetailHtml;
v274CollectionDetailHtml=function(c){
 const html=mfp412CollectionDetailBase.apply(this,arguments);
 if(!/^[A-Za-z0-9_-]{1,160}$/.test(String(c?.id||'')))return html;
 return html.replace('<div class="mf274-hero-actions">','<div class="mf274-hero-actions"><button class="btn btn-sm" onclick="App.mfp412OpenShareDialog(\''+mfp412ShareEsc(c.id)+'\')">Share collection</button>');
};
function mfp412CommunitySection(){
 return '<section class="mf412-community-collections card"><div class="mf412-community-head"><div><span class="mf412-kicker">LIVE SUBSCRIPTIONS</span><h2>Community Collections</h2><p>Follow original collections from other workspaces. They update when their owners edit them.</p></div></div><div id="mf412-subscribed-list"><p class="mf412-empty">Loading subscriptions…</p></div></section>';
}
const mfp412CollectionBrowserBase=v274CollectionsBrowserHtml;
v274CollectionsBrowserHtml=function(){
 const html=mfp412CollectionBrowserBase.apply(this,arguments),end=html.lastIndexOf('</div>');
 return end<0?html+mfp412CommunitySection():html.slice(0,end)+mfp412CommunitySection()+html.slice(end);
};
function mfp412SubscriptionCards(){
 const rows=MFP412_SHARE.subs;
 if(!rows.length)return '<p class="mf412-empty">No Community Collections yet. Explore profiles and subscribe to shared collections.</p>';
 return '<div class="mf412-subscribed-grid">'+rows.map(row=>{
  const key=row.owner_id+'/'+row.collection_id;
  const remote=MFP412_SHARE.lookup.get(key),c=remote?.collection;
  const title=c?.title||'Collection currently unavailable';
  return '<article class="mf412-subscribed-card"><span class="mf412-kicker">SUBSCRIBED COLLECTION</span><h3>'+mfp412ShareEsc(title)+'</h3>'+
   '<p>'+mfp412ShareEsc(c?.description||'The owner may have unpublished or removed this collection.')+'</p>'+
   '<small>'+(c?Number(c.total||0).toLocaleString()+' live titles':'Not currently public')+'</small>'+
   '<div class="mf412-share-actions">'+(c?'<button onclick="App.mfp412OpenPublicCollection(\''+mfp412ShareEsc(row.owner_id)+'\',\''+mfp412ShareEsc(row.collection_id)+'\')">View</button><button onclick="App.mfp412ConvertPrompt(\''+mfp412ShareEsc(row.owner_id)+'\',\''+mfp412ShareEsc(row.collection_id)+'\')">Convert</button>':'')+
   '<button onclick="App.mfp412Unsubscribe(\''+mfp412ShareEsc(row.owner_id)+'\',\''+mfp412ShareEsc(row.collection_id)+'\')">Unsubscribe</button></div></article>';
 }).join('')+'</div>';
}
async function mfp412LoadSubscriptions(){
 const root=document.getElementById('mf412-subscribed-list');
 if(!root||!AUTH_USER||!supabase||MFP412_SHARE.loading)return;
 MFP412_SHARE.loading=true;
 try{
  const result=await supabase.from('mfp_collection_subscriptions').select('owner_id,collection_id,subscribed_at').eq('subscriber_id',AUTH_USER.id).order('subscribed_at',{ascending:false}).limit(30);
  if(result.error)throw result.error;
  MFP412_SHARE.subs=result.data||[];
  // At most 30 metadata reads; never sync or duplicate the owner's private data.
  await Promise.all(MFP412_SHARE.subs.map(async row=>{
   const key=row.owner_id+'/'+row.collection_id;
   try{const remote=await mfp412PublicApi({type:'collection',owner:row.owner_id,id:row.collection_id,offset:0,limit:1});MFP412_SHARE.lookup.set(key,remote);}
   catch(_){MFP412_SHARE.lookup.delete(key);}
  }));
  if(root.isConnected)root.innerHTML=mfp412SubscriptionCards();
 }catch(e){if(root.isConnected)root.innerHTML='<p class="mf412-empty">Subscriptions unavailable. <button type="button" onclick="App.mfp412LoadSubscriptions()">Retry</button></p>';}
 finally{MFP412_SHARE.loading=false;}
}
async function mfp412Subscribe(owner,id){
 if(!AUTH_USER)return showToast('Sign in to subscribe.');
 if(owner===AUTH_USER.id)return showToast('You cannot subscribe to your own collection.');
 try{
  const existing=await supabase.from('mfp_collection_subscriptions').select('collection_id').eq('subscriber_id',AUTH_USER.id).eq('owner_id',owner).eq('collection_id',id).maybeSingle();
  if(existing.error)throw existing.error;
  if(!existing.data){
   const r=await supabase.from('mfp_collection_subscriptions').insert({subscriber_id:AUTH_USER.id,owner_id:owner,collection_id:id});
   if(r.error)throw r.error;
  }
  showToast('Subscribed to the live collection ✓');
  if(S.view==='collections')void mfp412LoadSubscriptions();
 }catch(e){showToast('Subscription failed: '+(e?.message||e));}
}
async function mfp412Unsubscribe(owner,id){
 if(!AUTH_USER||!confirm('Unsubscribe from this collection? Your converted personal copies will be kept.'))return;
 try{
  const r=await supabase.from('mfp_collection_subscriptions').delete().eq('subscriber_id',AUTH_USER.id).eq('owner_id',owner).eq('collection_id',id);
  if(r.error)throw r.error;
  MFP412_SHARE.subs=MFP412_SHARE.subs.filter(x=>x.owner_id!==owner||x.collection_id!==id);
  const root=document.getElementById('mf412-subscribed-list');if(root)root.innerHTML=mfp412SubscriptionCards();
  showToast('Unsubscribed ✓');
 }catch(e){showToast(e?.message||'Unsubscribe failed');}
}
function mfp412ConvertPrompt(owner,id){
 if(!AUTH_USER)return showToast('Sign in to convert a Community Collection.');
 const categories=(S.categories||[]).filter(x=>x?.id);
 if(!categories.length)return showToast('Create a personal Library category before conversion.');
 document.getElementById('mf412-convert-dialog')?.remove();
 const wrap=document.createElement('div');wrap.id='mf412-convert-dialog';wrap.className='mf412-share-dialog';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');
 wrap.innerHTML='<section class="mf412-public-panel"><button class="mf412-public-close" onclick="document.getElementById(\'mf412-convert-dialog\').remove()">Close ×</button><h2>Convert to My Collections</h2>'+
  '<p>This is an explicit one-time copy. Missing titles are imported into your Library as Planned with the category you choose; your copy will not follow the owner.</p>'+
  '<label>Category for imported titles <select id="mf412-convert-category">'+categories.map(c=>'<option value="'+mfp412ShareEsc(c.id)+'">'+mfp412ShareEsc(c.name)+'</option>').join('')+'</select></label>'+
  '<div class="mf412-share-actions"><button onclick="App.mfp412ConvertCollection(\''+mfp412ShareEsc(owner)+'\',\''+mfp412ShareEsc(id)+'\')">Import and create my collection</button></div></section>';
 document.body.append(wrap);
}
async function mfp412ConvertCollection(owner,id){
 if(MFP412_SHARE.busy||!AUTH_USER)return;
 const category=document.getElementById('mf412-convert-category')?.value;
 if(!(S.categories||[]).some(x=>String(x.id)===String(category)))return showToast('Choose a valid Library category.');
 MFP412_SHARE.busy=true;
 try{
  // Snapshot the currently PUBLIC live source via paged allowlisted reads.
  // Do not read another user's raw private mediaflow_states row.
  let offset=0,info=null,items=[];
  while(offset!==null){
   const result=await mfp412PublicApi({type:'collection',owner,id,offset,limit:80});
   info=result.collection;items.push(...(result.items||[]));
   offset=result.next_offset;
   if(items.length>5000)throw new Error('Large collections over 5,000 titles need a dedicated bulk import. No changes were made.');
  }
  if(!info)throw new Error('Collection is unavailable');
  if(!confirm('Create an independent collection with '+items.length+' titles? Missing titles will be added to your Library.'))return;
  const original=new Map((S.library||[]).map(t=>[cleanTitle(t.title).toLocaleLowerCase(),t]));
  const now=Date.now(),ids=[],newItems=[];
  for(const remote of items){
   const title=cleanTitle(remote.title);if(!title)continue;
   const key=title.toLocaleLowerCase();
   let item=original.get(key);
   if(!item){
    item={id:uid(),title,categoryId:category,progress:0,total:null,status:'planned',priority:'medium',estimatedMinutes:null,tags:['Community'],coverUrl:remote.cover_url||'',createdAt:now,modifiedAt:now};
    S.library.push(item);newItems.push(item);original.set(key,item);
   }
   ids.push(String(item.id));
  }
  v274EnsureCollections();
  const collection=v274NormalizeCollection({id:uid(),title:info.title,description:info.description,coverUrl:info.cover_url,titleIds:[...new Set(ids)],createdAt:now,updatedAt:now});
  S.collections.push(collection);
  for(const item of newItems)awardLibraryAdditionXP(item.id);
  v53InvalidateLibraryCache();
  await saveState();
  document.getElementById('mf412-convert-dialog')?.remove();
  showToast('Independent Collection created · '+newItems.length+' new Library titles ✓');
  if(S.view==='collections')render();
 }catch(e){showToast('Conversion failed: '+(e?.message||e));}
 finally{MFP412_SHARE.busy=false;}
}
MediaFlowRuntime.registerPageEnhancer('collections',()=>{setTimeout(()=>{void mfp412LoadSubscriptions();},0);});
MediaFlowRuntime.registerPageEnhancer('community',()=>{if(MFP408.tab==='profile')setTimeout(()=>{void mfp412LoadShowcase();},750);});
Object.assign(App,{mfp412OpenPublicProfile,mfp412OpenPublicCollection,mfp412PublicClose,mfp412PublicRetry,mfp412PublicMore,mfp412ShareProfile,mfp412CopyCollection,mfp412SaveShowcase,mfp412LoadShowcase,mfp412OpenShareDialog,mfp412PublishOwned,mfp412UnpublishOwned,mfp412LoadSubscriptions,mfp412Subscribe,mfp412Unsubscribe,mfp412ConvertPrompt,mfp412ConvertCollection});
window.addEventListener('hashchange',()=>{void mfp412Route();});
setTimeout(()=>{void mfp412Route();},0);
