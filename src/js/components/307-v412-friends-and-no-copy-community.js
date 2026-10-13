/* MediaFlow Plus — restored v320-inspired Friends workspace.
 * Friends/follows are relationship records. Ratings and collection content are
 * read from the canonical private owner Workspace, NEVER published as clones.
 */
(function(){
'use strict';
const FR412={owner:'',tab:'following',rows:[],people:new Map(),loaded:false,error:'',
 queries:{following:'',followers:'',mutuals:''},busy:false};
const frEsc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const FR412_TABS=[['following','Following'],['followers','Followers'],['mutuals','Mutuals']];
function frGroups(){
 const me=String(AUTH_USER?.id||''),following=new Set(),followers=new Set();
 for(const edge of FR412.rows){
  if(String(edge.follower_id)===me)following.add(String(edge.following_id));
  if(String(edge.following_id)===me)followers.add(String(edge.follower_id));
 }
 return {following:[...following],followers:[...followers],mutuals:[...following].filter(id=>followers.has(id))};
}
function frContent(){
 if(!AUTH_USER)return '<div class="fr412-empty">Sign in to see Friends and Connections.</div>';
 if(FR412.error)return '<div class="fr412-empty" role="alert">'+frEsc(FR412.error)+'<div><button type="button" class="btn" onclick="App.fr412Refresh()">Retry</button></div></div>';
 if(!FR412.loaded)return '<div class="fr412-empty">Loading your connections…</div>';
 const groups=frGroups(),term=FR412.queries[FR412.tab].trim().toLocaleLowerCase();
 const all=groups[FR412.tab].map(id=>({id,p:FR412.people.get(id)})).filter(x=>x.p&&(!term||String(x.p.username||'').toLowerCase().includes(term)||String(x.p.display_name||'').toLowerCase().includes(term)||String(x.p.bio||'').toLowerCase().includes(term)));
 const tabs=FR412_TABS.map(([id,label])=>'<button type="button" role="tab" aria-selected="'+String(FR412.tab===id)+'" class="'+(FR412.tab===id?'selected':'')+'" onclick="App.fr412Tab(\''+id+'\')">'+label+' <span>'+groups[id].length+'</span></button>').join('');
 return '<div class="fr412-card"><div class="fr412-tabs" role="tablist" aria-label="Connections">'+tabs+'</div><label class="fr412-search">Search '+frEsc(FR412.tab)+'<input type="search" placeholder="Username or display name…" value="'+frEsc(FR412.queries[FR412.tab])+'" oninput="App.fr412Search(this.value)"></label></div>'+
  (all.length?'<div class="fr412-grid">'+all.map(({id,p})=>{
   const name=String(p.display_name||p.username||'Member');
   return '<article class="fr412-card fr412-person"><div class="fr412-person-top"><span class="fr412-avatar">'+frEsc(name.charAt(0).toUpperCase())+'</span><div><strong>'+frEsc(name)+'</strong><small>@'+frEsc(p.username)+'</small></div></div><p>'+frEsc(p.bio||'')+'</p><div class="fr412-actions"><a class="btn btn-sm" href="#/u/'+encodeURIComponent(p.username)+'">View public workspace</a><button type="button" class="btn btn-sm" onclick="App.fr412Message(\''+frEsc(id)+'\')">Message</button><button type="button" class="btn btn-sm" onclick="App.fr412Toggle(\''+frEsc(id)+'\')">'+(groups.following.includes(id)?'Unfollow':'Follow')+'</button></div></article>';
  }).join('')+'</div>':'<div class="fr412-empty">'+(term?'No matching connections.':'No connections in this section yet.')+'</div>');
}
function frPage(){
 return '<section class="fr412-page"><header class="fr412-hero"><div><span class="fr412-label">MEDIAFLOW PLUS · COMMUNITY</span><h1>Friends</h1><p>Your people, one place — Following, Followers and Mutuals.</p></div><button type="button" class="btn" onclick="App.fr412Refresh()">Refresh</button></header><div id="fr412-host">'+frContent()+'</div></section>';
}
function frDraw(){
 const host=document.getElementById('fr412-host');
 if(!host||String(S.view||'')!=='friends')return;
 const active=document.activeElement,caret=active?.matches?.('.fr412-search input')?active.selectionStart:null;
 host.innerHTML=frContent();
 if(caret!==null){const next=host.querySelector('.fr412-search input');if(next){next.focus({preventScroll:true});try{next.setSelectionRange(caret,caret)}catch(_){}}}
}
async function frFetch(force=false){
 const me=String(AUTH_USER?.id||'');
 if(!me||!supabase){FR412.error='Sign in to see Friends.';frDraw();return;}
 if(FR412.owner!==me){FR412.owner=me;FR412.rows=[];FR412.people.clear();FR412.loaded=false;FR412.error='';}
 if(FR412.busy)return;
 if(FR412.loaded&&!force){frDraw();return;}
 FR412.busy=true;
 try{
  const r=await supabase.from('mfp_follows').select('follower_id,following_id').or('follower_id.eq.'+me+',following_id.eq.'+me).limit(1500);
  if(r.error)throw r.error;
  const rows=r.data||[];
  const ids=[...new Set(rows.flatMap(x=>[x.follower_id,x.following_id]).filter(id=>String(id)!==me))];
  let people=[];
  for(let i=0;i<ids.length;i+=100){
   const p=await supabase.from('mfp_profiles').select('user_id,username,display_name,bio,avatar_url').in('user_id',ids.slice(i,i+100));
   if(p.error)throw p.error;people.push(...(p.data||[]));
  }
  if(FR412.owner!==me)return;
  FR412.rows=rows;FR412.people=new Map(people.map(p=>[String(p.user_id),p]));FR412.error='';FR412.loaded=true;
 }catch(error){
  FR412.error='Connections could not load; please retry.';
  console.error('MediaFlow Plus Friends',error);
 }finally{FR412.busy=false;frDraw();}
}
function frTab(tab){if(FR412_TABS.some(x=>x[0]===tab)){FR412.tab=tab;frDraw();}}
function frSearch(s){FR412.queries[FR412.tab]=String(s||'');frDraw();}
async function frToggle(id){
 if(!AUTH_USER||FR412.busy)return;
 const me=String(AUTH_USER.id);if(me===id)return;
 FR412.busy=true;
 try{
  const following=frGroups().following.includes(String(id));
  const q=supabase.from('mfp_follows');
  const r=following?await q.delete().eq('follower_id',me).eq('following_id',id):await q.insert({follower_id:me,following_id:id});
  if(r.error)throw r.error;
 }catch(error){FR412.error=String(error?.message||'Could not update connection');}
 finally{FR412.busy=false;FR412.loaded=false;void frFetch(true);}
}
function frMessage(id){
 if(typeof App.in412MessageTo==='function')App.in412MessageTo(id);
 else if(typeof App.mfp408MessageTo==='function')App.mfp408MessageTo(id);
}
if(!NAV_ITEMS.some(n=>n.id==='friends')){
 const at=NAV_ITEMS.findIndex(n=>n.id==='community');
 NAV_ITEMS.splice(at<0?NAV_ITEMS.length:at+1,0,{id:'friends',label:'Friends'});
}
if(!MOBILE_MORE_NAV.includes('friends'))MOBILE_MORE_NAV.push('friends');
ICONS.friends='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2"/><path d="M17 6a3 3 0 0 1 0 6M19 20v-2a6 6 0 0 0-3-5"/></svg>';
if(typeof v161NormalizeNavLayout==='function')S.navLayout=v161NormalizeNavLayout(S.navLayout);
MediaFlowRuntime.registerPageRenderer('friends',frPage);
MediaFlowRuntime.registerPageEnhancer('friends',()=>{void frFetch();});
Object.assign(App,{fr412Refresh:()=>frFetch(true),fr412Tab:frTab,fr412Search:frSearch,fr412Toggle:frToggle,fr412Message:frMessage});

// Stop the obsolete Community forms that stored copies of Library ratings
// and entire collection item lists in separate public database tables.
// Existing legacy rows (if present) are preserved for migration/recovery.
const frOldCommunityRows=mfp408RenderRows;
mfp408RenderRows=function(){
 if(MFP408.tab==='reviews'){
  const own=(S.library||[]).filter(x=>Number(x?.rating)>0&&Number(x.rating)<=10)
   .slice().sort((a,b)=>Number(b.rating)-Number(a.rating)).slice(0,30);
  return '<div class="mfp408-heading"><h2>Ratings · Live from your Library</h2></div>'+
   '<div class="mfp408-card"><h3>One source of truth</h3><p>Ratings are edited in the original Workspace Library. MediaFlow Plus will derive Community rankings directly from opted-in owners’ saved Libraries; separate published rating copies are disabled.</p><button type="button" onclick="App.setView(\'library\')">Go to my Library</button></div>'+
   '<div class="mfp408-card"><h3>Your highest-rated titles</h3>'+
   (own.length?own.map(x=>'<p><b>'+frEsc(x.title)+'</b> · '+Number(x.rating).toFixed(1)+'/10</p>').join(''):'<p>No rated titles in your current Library yet.</p>')+'</div>';
 }
 const html=String(frOldCommunityRows.apply(this,arguments));
 if(MFP408.tab!=='people')return html;
 return html.replace(/<button onclick="App\.mfp408MessageTo\('([a-f0-9-]+)'\)">Message<\/button>/ig,(full,id)=>{
  const p=(MFP408.rows||[]).find(x=>String(x.user_id)===id);
  const link=p&&/^[a-z0-9_]{3,24}$/.test(String(p.username||''))?'<a class="btn btn-sm" href="#/u/'+encodeURIComponent(p.username)+'">View workspace</a>':'';
  return link+full;
 });
};
App.mfp408Review=function(event){event?.preventDefault?.();showToast('Ratings belong to your Library. No duplicate rating record will be created.');return false;};
App.mfp408Collection=function(event){event?.preventDefault?.();showToast('Share the original collection using Collections → Publish. No duplicate Collection will be created.');return false;};
window.MediaFlowPlusFriends412={release:412,readOnlySource:"mfp_follows",refresh:frFetch};
})();