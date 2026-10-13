/* MediaFlow Plus v412 — live, reference-based workspace showcasing.
 * Owner collections remain ONLY in mediaflow_states. Publication/subscription
 * rows are identifiers and permissions, never duplicated collection payloads.
 */
(function(){
'use strict';
const PS412={route:null,publicData:null,error:'',discover:[],subs:[],pubs:new Set(),profiles:[],
 lastSubs:0,publicBusy:false,shareBusy:false,discoverFilter:'',offset:0,publicToken:0,section:'',sectionOffset:0,sectionSeq:0,sectionData:null};
const psEsc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const psHandle=x=>String(x||'').toLowerCase().trim();
const psPublicUrl=username=>location.origin+location.pathname+'#/u/'+encodeURIComponent(username);
const psCollectionUrl=(username,id)=>location.origin+location.pathname+'#/collection/'+encodeURIComponent(username)+'/'+encodeURIComponent(id);
function psRoute(hash=location.hash){
 let m=String(hash||'').match(/^#\/u\/([a-z0-9_]{3,24})$/);
 if(m)return {kind:'profile',username:m[1]};
 m=String(hash||'').match(/^#\/collection\/([a-z0-9_]{3,24})\/([a-zA-Z0-9_-]{1,160})$/);
 return m?{kind:'collection',username:m[1],id:m[2]}:null;
}
function psAlert(message){try{showToast(message)}catch(_){console.info(message)}}
async function psProfile(){
 if(!AUTH_USER||!supabase)return null;
 const r=await supabase.from('mfp_profiles').select('*').eq('user_id',AUTH_USER.id).maybeSingle();
 if(r.error)throw r.error;return r.data;
}
async function psPublicRequest(kind,username='',id='',offset=0,limit=60){
 const q=new URLSearchParams({kind});if(username)q.set('username',username);
 if(id){q.set(kind==='section'?'section':'collection_id',id);q.set('offset',String(offset));q.set('limit',String(limit));}
 const headers={'apikey':SUPABASE_PUBLISHABLE_KEY};
 if(AUTH_USER&&supabase){const r=await supabase.auth.getSession();if(r.data?.session?.access_token)headers.authorization='Bearer '+r.data.session.access_token;}
 const result=await fetch(SUPABASE_URL+'/functions/v1/mfp-public-workspace?'+q.toString(),{headers,cache:'no-store'});
 const data=await result.json().catch(()=>({error:'Malformed response'}));
 if(!result.ok)throw new Error(data?.error||'Shared workspace unavailable');
 return data;
}
async function psCopy(value){
 try{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
  else{const el=document.createElement('textarea');el.value=value;document.body.appendChild(el);el.select();document.execCommand('copy');el.remove();}
  psAlert('Share link copied ✓');
 }catch(e){prompt('Copy your share link:',value)}
}
async function psShareProfile(){
 const p=await psProfile();if(!p?.username)return psAlert('Create your Community username first.');
 if(!p.is_public)return psAlert('Enable Public profile before sharing.');
 await psCopy(psPublicUrl(p.username));
}
async function psOwnerPubs(force=false){
 if(!AUTH_USER||!supabase)return;
 if(!force&&PS412.pubsAt&&Date.now()-PS412.pubsAt<10000)return;
 const r=await supabase.from('mfp_collection_publications').select('collection_id').eq('owner_id',AUTH_USER.id);
 if(r.error)throw r.error;
 PS412.pubs=new Set((r.data||[]).map(x=>String(x.collection_id)));PS412.pubsAt=Date.now();
 const host=document.getElementById('ps412-own-publish');
 if(host&&V274_UI.activeId)host.innerHTML=psOwnerBar(V274_UI.activeId);
}
function psOwnerBar(id){
 const active=PS412.pubs.has(String(id));
 return '<div class="ps412-share-card"><div><b>Community sharing</b><p>'+ (active?'Live shared collection — changes are visible to subscribers.':'Private collection — only you can see its contents.')+'</p></div><div class="ps412-share-actions">'+
 '<button type="button" class="btn btn-sm" onclick="App.ps412TogglePublish(\''+psEsc(id)+'\')">'+(active?'Unpublish':'Publish collection')+'</button>'+
 (active?'<button type="button" class="btn btn-sm btn-ghost" onclick="App.ps412ShareCollection(\''+psEsc(id)+'\')">Copy share link</button>':'')+
 '</div></div>';
}
async function psTogglePublish(id){
 if(PS412.shareBusy||!AUTH_USER)return;PS412.shareBusy=true;
 try{
  const own=v274CollectionById(id);if(!own)throw new Error('Collection no longer exists.');
  const p=await psProfile();
  if(!p?.username)throw new Error('Create a Community profile before publishing.');
  if(!p.is_public)throw new Error('Enable Public profile in Community → My profile to share collections.');
  const active=PS412.pubs.has(String(id));
  if(active&&!confirm('Unpublish this collection? Subscribers will immediately lose public access, but their independent conversions remain.'))return;
  const q=supabase.from('mfp_collection_publications');
  const r=active?await q.delete().eq('owner_id',AUTH_USER.id).eq('collection_id',String(id)):
   await q.insert({owner_id:AUTH_USER.id,collection_id:String(id)});
  if(r.error)throw r.error;
  await psOwnerPubs(true);psAlert(active?'Collection unpublished.':'Collection shared live ✓');
 }catch(e){psAlert(String(e?.message||e));console.error('Collection publication failed',e)}
 finally{PS412.shareBusy=false;}
}
async function psShareCollection(id){
 const c=v274CollectionById(id);if(!c)return;
 const p=await psProfile();if(!p?.is_public||!PS412.pubs.has(String(id))){psAlert('Publish this collection and enable your public profile first.');return;}
 await psCopy(psCollectionUrl(p.username,id));
}
function psGuestShell(){
 const route=psRoute();if(!route)return;
 PS412.route=route;PS412.publicData=null;PS412.error='';PS412.offset=0;PS412.section='';PS412.sectionOffset=0;PS412.sectionSeq++;
 const app=document.getElementById('app');if(!app)return;
 app.innerHTML='<div class="ps412-guest-shell"><header class="ps412-public-head"><strong>MediaFlow Plus</strong><a href="'+location.pathname+'" class="btn btn-sm">Open MediaFlow Plus</a></header><main class="ps412-public-guest-content"><div id="ps412-public-host" role="main"><p>Loading public workspace…</p></div></main><footer>Shared live from the owner’s MediaFlow Plus workspace. Unpublished content remains private.</footer></div>';
 void psFetchRoute();
}
function psPublicRenderer(){return '<section class="ps412-public-page"><div class="ps412-public-top"><button class="btn btn-sm" onclick="App.ps412Back()">← Back to Collections</button><span>PUBLIC COMMUNITY WORKSPACE</span></div><div id="ps412-public-host" aria-live="polite">Loading public workspace…</div></section>';}
function psBack(){location.hash='';S.view='collections';render();}
async function psFetchRoute(){
 const route=PS412.route||psRoute();if(!route)return;
 const epoch=++PS412.publicToken;PS412.error='';
 try{
  const data=await psPublicRequest(route.kind,route.username,route.id||'',PS412.offset,60);
  if(epoch!==PS412.publicToken)return;
  PS412.publicData=data;
  psShowRoute();
 }catch(e){if(epoch!==PS412.publicToken)return;PS412.error=String(e?.message||e);psShowRoute();}
}

/* Owner-native read-only Community sections inspired by Personal v327-v329.
 * All content arrives from the Plus Edge allowlist; no private workspace
 * rows or copied public media are requested by the browser.
 */
const PS412_PUBLIC_TABS=[
 ['library','Library'],['history','History'],['order','Personal Order'],
 ['old','Old System'],['statistics','Statistics'],['ratings','Ratings'],
 ['levels','Level & XP']
];
function psPublicTabsHtml(flags){
 const enabled=PS412_PUBLIC_TABS.filter(([key])=>flags?.[key]===true);
 if(!enabled.length)return '<div class="ps412-panel"><h2>Workspace visibility</h2><p>This member has not published any additional workspace sections.</p></div>';
 return '<section class="ps412-panel ps412-live-workspace">'+
 '<div class="ps412-panel-top"><div><h2>Live workspace</h2><p>Read-only views of the owner’s latest shared Workspace data — not duplicated Community records.</p></div><button type="button" class="btn btn-sm" onclick="App.ps412RefreshSection()">Refresh</button></div>'+
 '<div class="ps412-live-tabs" role="tablist" aria-label="Published workspace sections">'+
 enabled.map(([id,label],i)=>'<button type="button" role="tab" aria-selected="'+String(i===0)+'" data-ps412-tab="'+id+'" onclick="App.ps412Tab(\''+id+'\')">'+psEsc(label)+'</button>').join('')+
 '</div><div id="ps412-live-section" aria-live="polite">Select a tab to load the latest published records.</div></section>';
}
function psPublicItemHtml(section,x,i){
 const pos=PS412.sectionOffset+i+1;
 if(section==='old')return '<div class="ps412-title"><span>'+pos+'.</span><strong>'+psEsc(x.category||'Category')+'</strong><small>Balance: '+psEsc(Number(x.balance||0).toLocaleString())+'</small></div>';
 if(section==='history'){
  return '<article class="ps412-history-row"><div class="ps412-history-head"><strong>'+psEsc(x.category||'Consumption')+'</strong><small>'+psEsc(x.date||'')+' · '+Number(x.minutes||0).toLocaleString()+' min · '+Number(x.amount||0).toLocaleString()+' '+psEsc(x.unit||'units')+'</small></div>'+
  (x.titles?.length?'<p>'+x.titles.map(t=>psEsc(t.title)).join(' · ')+'</p>':'<p>No title details shared for this session</p>')+'</article>';
 }
 const meta=[x.category,x.status,x.priority].filter(Boolean).map(psEsc);
 if(Number.isFinite(Number(x.progress))&&Number(x.total)>0)meta.push(Number(x.progress).toLocaleString()+' / '+Number(x.total).toLocaleString());
 if(x.rating!=null)meta.push('★ '+Number(x.rating).toFixed(1)+'/10');
 return '<article class="ps412-workspace-title"><span class="ps412-workspace-position">'+pos+'</span>'+
 (x.cover_url?'<img src="'+psEsc(x.cover_url)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="ps412-cover-fallback">▤</span>')+
 '<div><strong>'+psEsc(x.title||'Untitled')+'</strong><p>'+meta.join(' · ')+'</p></div></article>';
}
function psSummaryHtml(section,summary){
 if(section==='levels')return '<div class="ps412-panel"><p>'+psEsc(summary?.note||'Level comparison is not available until XP parity is verified.')+'</p></div>';
 if(section!=='statistics'||!summary)return '<p>No public summary available.</p>';
 const tiles=[['Library titles',summary.total_titles],['History entries',summary.total_sessions],
  ['Minutes recorded',summary.total_minutes],['Completed titles',summary.completed_titles]];
 const counts=rows=>Array.isArray(rows)?rows.slice(0,35).map(x=>'<div class="ps412-summary-entry"><span>'+psEsc(x.name||'Other')+'</span><b>'+Number(x.count||0).toLocaleString()+'</b></div>').join(''):'';
 return '<div class="ps412-stats">'+tiles.map(([name,value])=>'<div><b>'+Number(value||0).toLocaleString()+'</b><small>'+psEsc(name)+'</small></div>').join('')+'</div>'+
 '<div class="ps412-summary-columns"><div><h3>Titles by status</h3>'+counts(summary.by_status)+'</div><div><h3>Titles by category</h3>'+counts(summary.by_category)+'</div></div>';
}
function psRenderSection(){
 const host=document.getElementById('ps412-live-section');if(!host)return;
 const data=PS412.sectionData,section=PS412.section;
 if(!data){host.innerHTML='<p>Loading live workspace data…</p>';return;}
 if(data.error){host.innerHTML='<p role="alert">'+psEsc(data.error)+'</p><button type="button" class="btn" onclick="App.ps412RefreshSection()">Retry section</button>';return;}
 let body='';
 if(section==='statistics'||section==='levels')body=psSummaryHtml(section,data.summary);
 else body='<div class="ps412-workspace-rows">'+((data.items||[]).length?data.items.map((x,i)=>psPublicItemHtml(section,x,i)).join(''):'<p>No publicly visible entries in this section yet.</p>')+'</div>';
 const next=data.next_offset,previous=PS412.sectionOffset>0;
 const pager=(previous||next!==null)?'<div class="ps412-pager">'+(previous?'<button type="button" class="btn" onclick="App.ps412SectionPage(-1)">← Previous</button>':'')+
 '<small>'+Math.min(PS412.sectionOffset+1,Number(data.total||0)).toLocaleString()+'–'+Math.min(Number(data.total||0),PS412.sectionOffset+(data.items?.length||0)).toLocaleString()+' of '+Number(data.total||0).toLocaleString()+'</small>'+
 (next!==null?'<button type="button" class="btn" onclick="App.ps412SectionPage(1)">Next →</button>':'')+'</div>':'';
 host.innerHTML='<div class="ps412-live-status"><span>Viewing the owner’s current Workspace</span><span>Read-only · No copies</span></div>'+body+pager;
}
async function psFetchSection(){
 const route=PS412.route||psRoute(),section=PS412.section;
 if(!route||route.kind!=='profile'||!section)return;
 if(PS412.publicData?.sections?.[section]!==true)return;
 const seq=++PS412.sectionSeq;PS412.sectionData=null;psRenderSection();
 try{
  const data=await psPublicRequest('section',route.username,section,PS412.sectionOffset,40);
  if(seq!==PS412.sectionSeq||PS412.section!==section)return;
  if(data.source!=='current_owner_workspace'||data.stored_public_copy!==false)throw Error('Unexpected public sharing source');
  PS412.sectionData=data;psRenderSection();
 }catch(e){if(seq!==PS412.sectionSeq)return;PS412.sectionData={error:String(e?.message||'Section unavailable')};psRenderSection();}
}
function psSelectTab(tab){
 if(!PS412_PUBLIC_TABS.some(([x])=>x===tab)||PS412.publicData?.sections?.[tab]!==true)return;
 PS412.section=tab;PS412.sectionOffset=0;
 for(const b of document.querySelectorAll('[data-ps412-tab]'))b.setAttribute('aria-selected',String(b.dataset.ps412Tab===tab));
 void psFetchSection();
}
function psSectionPage(direction){
 const d=PS412.sectionData;if(!d)return;
 const step=40,offset=PS412.sectionOffset;
 PS412.sectionOffset=direction>0&&d.next_offset!==null?d.next_offset:Math.max(0,offset-step);
 void psFetchSection();
}
function psRefreshSection(){if(PS412.section)void psFetchSection();else if(PS412.route?.kind==='profile')void psFetchRoute();}

function psShowRoute(){
 const host=document.getElementById('ps412-public-host');if(!host)return;
 const route=PS412.route;const data=PS412.publicData;
 if(PS412.error){host.innerHTML='<div class="ps412-panel" role="alert"><h2>Public workspace unavailable</h2><p>'+psEsc(PS412.error)+'</p><button class="btn" onclick="App.ps412Retry()">Retry</button></div>';return;}
 if(!data)return;
 if(route.kind==='profile'){
  const p=data.profile||{};
  host.innerHTML='<div class="ps412-profile-hero"><div class="ps412-avatar">'+psEsc((p.display_name||p.username||'?').charAt(0).toUpperCase())+'</div><div><h1>'+psEsc(p.display_name||p.username)+'</h1><p>@'+psEsc(p.username)+'</p><p>'+psEsc(p.bio||'')+'</p></div></div>'+
  (data.workspace?'<div class="ps412-stats"><div><b>'+Number(data.workspace.title_count||0).toLocaleString()+'</b><small>Titles in workspace</small></div><div><b>'+Number(data.workspace.collection_count||0).toLocaleString()+'</b><small>Personal collections</small></div><div><b>'+Number(data.workspace.category_count||0).toLocaleString()+'</b><small>Categories</small></div></div>':'')+
  (data.categories?.length?'<div class="ps412-panel"><h2>Shared workspace categories</h2><div class="ps412-chips">'+data.categories.map(x=>'<span>'+psEsc(x.name)+'</span>').join('')+'</div></div>':'')+
  '<section class="ps412-panel"><h2>Published collections</h2>'+psCards(data.collections||[])+'</section>'+psPublicTabsHtml(data.sections||{});
  if(!PS412.section||data.sections?.[PS412.section]!==true){PS412.section=PS412_PUBLIC_TABS.find(([key])=>data.sections?.[key]===true)?.[0]||'';PS412.sectionOffset=0;}
  if(PS412.section){document.querySelectorAll('[data-ps412-tab]').forEach(el=>el.setAttribute('aria-selected',String(el.dataset.ps412Tab===PS412.section)));void psFetchSection();}
 }else{
  const c=data.collection||{},o=data.owner||{},rows=data.titles||[];
  host.innerHTML='<div class="ps412-profile-hero"><div><span>Live shared collection</span><h1>'+psEsc(c.title)+'</h1><p>by <a href="#/u/'+encodeURIComponent(o.username||route.username)+'">@'+psEsc(o.username||route.username)+'</a> · '+Number(data.total||0).toLocaleString()+' titles</p><p>'+psEsc(c.description||'')+'</p></div></div>'+
   '<div class="ps412-public-actions">'+(AUTH_USER?'<button class="btn btn-primary" onclick="App.ps412Subscribe(\''+psEsc(o.username||route.username)+'\',\''+psEsc(c.id)+'\')">Subscribe to live collection</button><button class="btn" onclick="App.ps412Convert(\''+psEsc(o.username||route.username)+'\',\''+psEsc(c.id)+'\')">Convert to my collection</button>':'<span>Sign in to subscribe or convert this collection.</span>')+
   '<button class="btn" onclick="App.ps412CopyCurrent()">Copy link</button></div>'+
   '<div class="ps412-panel"><h2>Collection titles</h2><div class="ps412-titles">'+rows.map((t,i)=>'<div class="ps412-title"><span>'+(PS412.offset+i+1)+'.</span><strong>'+psEsc(t.title)+'</strong><small>'+psEsc(t.category||'')+'</small></div>').join('')+'</div>'+
   (data.next_offset!==null?'<button class="btn" onclick="App.ps412More()">Next titles →</button>':'')+'</div>';
 }
}
function psCards(rows){
 return rows.length?'<div class="ps412-collection-grid">'+rows.map(c=>'<article class="ps412-collection-card"><div><h3>'+psEsc(c.title)+'</h3><p>'+psEsc(c.description||'')+'</p><small>'+Number(c.count||0).toLocaleString()+' titles · @'+psEsc(c.owner?.username||'')+'</small></div><button type="button" class="btn btn-sm" onclick="App.ps412Open(\''+psEsc(c.owner?.username||'')+'\',\''+psEsc(c.id)+'\')">View collection</button></article>').join('')+'</div>':'<p>No public collections yet.</p>';
}
function psOpen(username,id){
 location.hash='#/collection/'+encodeURIComponent(username)+'/'+encodeURIComponent(id);
}
function psMore(){PS412.offset=PS412.publicData?.next_offset??PS412.offset;void psFetchRoute();}
function psRetry(){void psFetchRoute();}
function psCopyCurrent(){void psCopy(location.href);}
function psHashChanged(){
 const route=psRoute();
 if(!route)return;
 PS412.route=route;PS412.publicData=null;PS412.error='';PS412.offset=0;PS412.section='';PS412.sectionOffset=0;PS412.sectionSeq++;
 if(AUTH_USER&&AUTH_READY&&document.querySelector('.sidebar')){
  S.view='publicshare';render();
 }else psGuestShell();
}
const psOriginalAuth=renderAuthScreen;
renderAuthScreen=function(){if(psRoute())return psGuestShell();return psOriginalAuth.apply(this,arguments);};
window.addEventListener('hashchange',psHashChanged);
setTimeout(()=>{if(psRoute())psHashChanged();},350);

async function psSubscribe(username,id){
 if(!AUTH_USER)return psAlert('Please sign in to subscribe.');
 try{
  const profile=await supabase.from('mfp_profiles').select('user_id,is_public').eq('username',username).eq('is_public',true).single();
  if(profile.error)throw profile.error;
  const proof=await psPublicRequest('collection',username,id,0,1);
  if(!proof?.collection)throw new Error('Collection is not public.');
  if(profile.data.user_id===AUTH_USER.id)throw new Error('You own this collection.');
  const r=await supabase.from('mfp_collection_subscriptions').upsert({subscriber_id:AUTH_USER.id,owner_id:profile.data.user_id,collection_id:id},{onConflict:'subscriber_id,owner_id,collection_id'});
  if(r.error)throw r.error;psAlert('Subscribed — this collection stays connected to its owner ✓');
  PS412.lastSubs=0;void psLoadSubs(true);
 }catch(e){psAlert(String(e?.message||'Could not subscribe'));}
}
async function psUnsubscribe(ownerId,id){
 if(!confirm('Unsubscribe from this Community Collection? Independent copies in My Collections will not be deleted.'))return;
 const r=await supabase.from('mfp_collection_subscriptions').delete().eq('subscriber_id',AUTH_USER.id).eq('owner_id',ownerId).eq('collection_id',id);
 if(r.error)return psAlert('Could not unsubscribe.');
 PS412.lastSubs=0;await psLoadSubs(true);psAlert('Unsubscribed.');
}
async function psLoadSubs(force=false){
 if(!AUTH_USER){PS412.subs=[];PS412.subscriberId='';return;}
 if(PS412.subscriberId!==String(AUTH_USER.id)){PS412.subs=[];PS412.lastSubs=0;PS412.subscriberId=String(AUTH_USER.id);}
 if(!force&&Date.now()-PS412.lastSubs<14000)return;
 const q=await supabase.from('mfp_collection_subscriptions').select('owner_id,collection_id,subscribed_at').eq('subscriber_id',AUTH_USER.id).order('subscribed_at',{ascending:false}).limit(120);
 if(q.error){console.warn('Community subscriptions:',q.error);return;}
 const subs=q.data||[],ownerIds=[...new Set(subs.map(x=>x.owner_id))];
 let owners=[];
 if(ownerIds.length){const r=await supabase.from('mfp_profiles').select('user_id,username,is_public').in('user_id',ownerIds);if(!r.error)owners=r.data||[];}
 const lookup=new Map(owners.map(x=>[x.user_id,x.username]));
 const results=await Promise.all(subs.map(async s=>{
  const username=lookup.get(s.owner_id);if(!username)return {...s,unavailable:true};
  try{const data=await psPublicRequest('collection',username,s.collection_id,0,1);return {...s,username,collection:data.collection,unavailable:false};}
  catch(_){return {...s,username,unavailable:true};}
 }));
 PS412.subs=results;PS412.lastSubs=Date.now();
 psRenderSubs();
}
function psSubsHtml(){
 if(PS412.subscriberId!==String(AUTH_USER?.id||'')){PS412.subs=[];PS412.subscriberId=String(AUTH_USER?.id||'');PS412.lastSubs=0;PS412.pubs=new Set();PS412.pubsAt=0;}
 return '<section class="ps412-panel ps412-community-section"><div class="ps412-panel-top"><div><h2>Community Collections</h2><p>Live subscriptions to other members’ collections — stored as references, never copied.</p></div><button type="button" class="btn btn-sm" onclick="App.ps412RefreshSubscriptions()">Refresh</button></div>'+
 (PS412.subs.length?'<div class="ps412-collection-grid">'+PS412.subs.map(s=>'<article class="ps412-collection-card"><h3>'+psEsc(s.unavailable?'Unavailable collection':s.collection?.title||'Shared collection')+'</h3><p>'+psEsc(s.unavailable?'The owner removed or restricted public access. Your independent converted collections are unaffected.':(s.collection?.description||''))+'</p>'+
 '<small>'+psEsc(s.username||'Member')+'</small><div class="ps412-share-actions">'+(!s.unavailable?'<button class="btn btn-sm" onclick="App.ps412Open(\''+psEsc(s.username)+'\',\''+psEsc(s.collection_id)+'\')">View live</button><button class="btn btn-sm" onclick="App.ps412Convert(\''+psEsc(s.username)+'\',\''+psEsc(s.collection_id)+'\')">Convert to my collection</button>':'')+
 '<button class="btn btn-sm btn-ghost" onclick="App.ps412Unsubscribe(\''+psEsc(s.owner_id)+'\',\''+psEsc(s.collection_id)+'\')">Unsubscribe</button></div></article>').join('')+'</div>':'<p>You have no Community subscriptions yet. Explore published collections to follow other members.</p>')+
 '<button type="button" class="btn" onclick="App.ps412Explore()">Discover shared collections →</button></section>';
}
function psRenderSubs(){const el=document.getElementById('ps412-community-list');if(el)el.innerHTML=psSubsHtml();}
const psCollectionsBrowserBase=v274CollectionsBrowserHtml;
v274CollectionsBrowserHtml=function(){
 const html=psCollectionsBrowserBase.apply(this,arguments);
 return html.replace(/<\/div>\s*$/,'<div id="ps412-community-list">'+psSubsHtml()+'</div></div>');
};
const psDetailBase=v274CollectionDetailHtml;
v274CollectionDetailHtml=function(c){
 let html=String(psDetailBase.apply(this,arguments));
 return html.replace(/(<div class="mf274-page[^"]*">)/,'$1<div id="ps412-own-publish">'+psOwnerBar(c.id)+'</div>');
};
MediaFlowRuntime.registerPageEnhancer('collections',()=>{
 if(V274_UI.activeId)void psOwnerPubs();else void psLoadSubs();
});
async function psConvert(username,id){
 if(!AUTH_USER||!Array.isArray(S.library)||!Array.isArray(S.categories))return psAlert('Sign in and load your workspace before converting.');
 if(!confirm('Convert this live shared collection into your own editable collection? Missing titles will be added to your Library with fresh, private progress. This creates an independent copy.'))return;
 try{
  let offset=0,total=0,all=[],meta=null;
  do{
   const data=await psPublicRequest('collection',username,id,offset,500);
   meta=data.collection;total=Number(data.total||0);
   if(total>10000)throw new Error('This collection is too large for one safe conversion (maximum 10,000 titles).');
   all.push(...(data.titles||[]));offset=data.next_offset===null?null:data.next_offset;
   if(offset!==null&&(!Number.isFinite(offset)||offset<=0))throw new Error('Conversion paging error');
  }while(offset!==null);
  if(!meta)throw new Error('Collection unavailable');
  const already=new Map((S.library||[]).filter(i=>i?.title).map(i=>[String(i.title).trim().toLocaleLowerCase(),String(i.id)]));
  const categories=new Map((S.categories||[]).filter(x=>x?.name).map(x=>[String(x.name).trim().toLocaleLowerCase(),String(x.id)]));
  const fallback=S.categories[0]?.id;if(!fallback)throw new Error('No destination category is configured.');
  const newItems=[],ids=[];
  for(const t of all){
   const title=String(t.title||'').trim();if(!title)continue;
   const key=title.toLocaleLowerCase();let titleId=already.get(key);
   if(!titleId){
    titleId=uid();already.set(key,titleId);
    newItems.push({id:titleId,title,categoryId:categories.get(String(t.category||'').toLocaleLowerCase())||fallback,
     coverUrl:String(t.cover_url||''),total:Number(t.total)||null,progress:0,
     status:'planned',priority:'medium',createdAt:Date.now(),modifiedAt:Date.now()});
   }
   ids.push(titleId);
  }
  const imported=sanitizeLibrary(newItems);
  if(imported.length)S.library.push(...imported);
  v274EnsureCollections();
  const copy=v274NormalizeCollection({id:v274Id(),title:meta.title,description:meta.description,
   coverUrl:meta.cover_url,titleIds:[...new Set(ids)]});
  S.collections.push(copy);v53InvalidateLibraryCache();
  await saveState();
  PS412.lastSubs=0;V274_UI.activeId=copy.id;render();
  psAlert('Converted '+ids.length+' titles into an independent collection. '+imported.length+' new Library titles added.');
 }catch(e){psAlert('Conversion failed: '+String(e?.message||e));console.error('Convert live collection',e);}
}

const psCommunityRowsBase=mfp408RenderRows;
mfp408RenderRows=function(){
 let html=String(psCommunityRowsBase.apply(this,arguments));
 if(MFP408.tab==='profile'){
  const p=MFP408.profile||{};
  const fields='<label class="ps412-showcase-setting"><input name="ps412_workspace_stats" type="checkbox" '+(p.show_workspace_stats?'checked':'')+'> Show workspace totals publicly</label>'+
   '<label class="ps412-showcase-setting"><input name="ps412_workspace_categories" type="checkbox" '+(p.show_workspace_categories?'checked':'')+'> Show category names publicly</label>'+
   '<label class="ps412-showcase-setting"><input name="ps412_show_library" type="checkbox" '+(p.show_library?'checked':'')+'> Share Library (read-only)</label>'+
   '<label class="ps412-showcase-setting"><input name="ps412_show_history" type="checkbox" '+(p.show_history?'checked':'')+'> Share History (read-only)</label>'+
   '<label class="ps412-showcase-setting"><input name="ps412_show_personal_order" type="checkbox" '+(p.show_personal_order?'checked':'')+'> Share Personal Order (read-only)</label>'+
   '<label class="ps412-showcase-setting"><input name="ps412_show_old_system" type="checkbox" '+(p.show_old_system?'checked':'')+'> Share Old System (read-only)</label>'+
   '<label class="ps412-showcase-setting"><input name="ps412_show_statistics" type="checkbox" '+(p.show_statistics?'checked':'')+'> Share Statistics (read-only)</label>'+
   '<label class="ps412-showcase-setting"><input name="ps412_show_ratings" type="checkbox" '+(p.show_ratings?'checked':'')+'> Share Ratings (read-only)</label>'+
   '<label class="ps412-showcase-setting"><input name="ps412_show_levels" type="checkbox" '+(p.show_levels?'checked':'')+'> Share Level & XP (read-only)</label>';
  html=html.replace('<button type="submit">Save profile</button>',fields+'<button type="submit">Save profile</button>');
  if(!MFP408.profile)html=html.replace('name="is_public" type="checkbox" checked','name="is_public" type="checkbox"');
  html+='<div class="mfp408-card"><h3>Share your live workspace profile</h3><p>Only your explicitly enabled public sections and published collections are visible. Your private Library snapshot is never shared.</p>'+
    '<button type="button" onclick="App.ps412ShareProfile()">Copy public profile link</button></div>';
 }
 return html;
};
App.mfp408SaveProfile=async function(e){
 e.preventDefault();
 const f=new FormData(e.target),username=psHandle(f.get('username')),avatar=String(f.get('avatar_url')||'').trim();
 if(!/^[a-z0-9_]{3,24}$/.test(username))return mfp408Notice('Use 3–24 lowercase letters, numbers or underscores.',true);
 if(avatar&&!mfp408SafeURL(avatar))return mfp408Notice('Avatar must be HTTPS.',true);
 await mfp408Mutation('mfp_profiles','upsert',{
  user_id:AUTH_USER.id,username,display_name:String(f.get('display_name')||'').slice(0,100),
  bio:String(f.get('bio')||'').slice(0,500),avatar_url:avatar||null,is_public:f.has('is_public'),
  show_workspace_stats:f.has('ps412_workspace_stats'),show_workspace_categories:f.has('ps412_workspace_categories'),
  show_library:f.has('ps412_show_library'), show_history:f.has('ps412_show_history'), show_personal_order:f.has('ps412_show_personal_order'), show_old_system:f.has('ps412_show_old_system'), show_statistics:f.has('ps412_show_statistics'), show_ratings:f.has('ps412_show_ratings'), show_levels:f.has('ps412_show_levels')
 });
};
const psCommunityTabBase=App.mfp408Tab;
App.mfp408Tab=function(tab){if(tab==='collections'){S.view='explorecollections';render();return;}return psCommunityTabBase(tab);};
function psExplore(){S.view='explorecollections';render();void psDiscover();}
function psExploreRenderer(){
 return '<section class="ps412-public-page"><div class="ps412-public-top"><button class="btn btn-sm" onclick="App.setView(\'community\')">← Community</button><span>DISCOVER</span></div><h1>Community Collections</h1><p>Discover published, live collections from other MediaFlow Plus workspaces.</p><input class="ps412-explore-search" type="search" value="'+psEsc(PS412.discoverFilter)+'" placeholder="Search public collections or creators…" oninput="App.ps412FilterExplore(this.value)"><div id="ps412-explore-results">'+psExploreHtml()+'</div></section>';
}
function psExploreHtml(){
 const q=PS412.discoverFilter.toLocaleLowerCase();
 return psCards(PS412.discover.filter(c=>!q||String(c.title||'').toLocaleLowerCase().includes(q)||String(c.owner?.username||'').includes(q)));
}
function psFilterExplore(s){PS412.discoverFilter=String(s||'');const e=document.getElementById('ps412-explore-results');if(e)e.innerHTML=psExploreHtml();}
async function psDiscover(){
 const host=document.getElementById('ps412-explore-results');
 if(host)host.textContent='Finding public collections…';
 try{
  const data=await psPublicRequest('discover');PS412.discover=data.collections||[];
  if(host)host.innerHTML=psExploreHtml();
 }catch(e){if(host)host.textContent='Community discovery is temporarily unavailable. '+String(e?.message||e);}
}
MediaFlowRuntime.registerPageRenderer('publicshare',psPublicRenderer);
MediaFlowRuntime.registerPageEnhancer('publicshare',()=>{PS412.route=psRoute()||PS412.route;if(PS412.route)void psFetchRoute();});
MediaFlowRuntime.registerPageRenderer('explorecollections',psExploreRenderer);
MediaFlowRuntime.registerPageEnhancer('explorecollections',psDiscover);
Object.assign(App,{ps412ShareProfile:psShareProfile,ps412TogglePublish:psTogglePublish,ps412ShareCollection:psShareCollection,
 ps412Unsubscribe:psUnsubscribe,ps412RefreshSubscriptions:()=>psLoadSubs(true),ps412Subscribe:psSubscribe,
 ps412Open:psOpen,ps412Back:psBack,ps412More:psMore,ps412Retry:psRetry,ps412CopyCurrent:psCopyCurrent,
 ps412Convert:psConvert,ps412Explore:psExplore,ps412FilterExplore:psFilterExplore,ps412Tab:psSelectTab,ps412SectionPage:psSectionPage,ps412RefreshSection:psRefreshSection});
setInterval(()=>{if(AUTH_USER&&String(S.view||'')==='collections'&&!V274_UI.activeId&&document.visibilityState==='visible')void psLoadSubs(true);},60000);
window.MediaFlowPlusSharing412={release:412,live:true,canonical:'mediaflow_states',publicationRowsOnly:true,refreshSubscriptions:psLoadSubs};
})();