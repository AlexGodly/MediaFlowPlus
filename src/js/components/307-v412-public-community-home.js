/* MediaFlow Plus: actual public Community Home and Workspace entry point.
 * #/community/home is public. Workspace is always the real signed-in scheduler.
 * No private S.library/state is read for the public site.
 */
const MF412_GUEST={tab:'home',query:'',sort:'alpha',page:0,request:0,data:null,loading:false,error:''};
const MF412_GUEST_PAGES=[['home','Home'],['browse','Browse Titles'],['collections','Collections'],['top','Top Titles']];
function mf412GuestRouteType(){
 const m=String(location.hash||'').match(/^#\/community(?:\/(home|browse|collections|top))?\/?$/i);
 return m?(m[1]||'home').toLowerCase():'';
}
function mf412GuestFrame(){
 const e=mfp408Esc,tab=MF412_GUEST.tab;
 return '<div class="mf412g-site" id="mf412g-site"><header class="mf412g-bar">'+
  '<button type="button" class="mf412g-brand" onclick="App.mf412GuestOpen(\'home\')"><span class="mf412g-mark">M+</span>'+
  '<span><b>MediaFlow</b><small>COMMUNITY</small></span></button>'+
  '<nav aria-label="Public Community pages">'+MF412_GUEST_PAGES.map(([id,label])=>
    '<button type="button" class="'+(tab===id?'active':'')+'" onclick="App.mf412GuestOpen(\''+id+'\')">'+e(label)+'</button>').join('')+'</nav>'+
  '<button type="button" class="mf412g-workspace" onclick="App.mf412GuestWorkspace()">My Workspace <span>↗</span></button></header>'+
  '<main id="mf412g-content" class="mf412g-content"><p class="mf412g-loading">Opening Community…</p></main>'+
  '<footer class="mf412g-footer"><b>MEDIAFLOW PLUS</b><span>Community content is always read from explicitly shared sources. Your private workspace is not copied.</span>'+
  '<button onclick="App.mf412GuestWorkspace()">Open Workspace →</button></footer></div>';
}
function mf412GuestMount(){
 let root=document.getElementById('mf412g-overlay');
 if(!root){
  root=document.createElement('div');root.id='mf412g-overlay';root.className='mf412g-overlay';
  root.setAttribute('role','region');root.setAttribute('aria-label','MediaFlow Community public home');
  document.body.appendChild(root);
 }
 root.innerHTML=mf412GuestFrame();
 document.body.classList.add('mf412g-active');
 return root;
}
function mf412GuestClose(){
 MF412_GUEST.request++;
 document.body.classList.remove('mf412g-active');
 document.getElementById('mf412g-overlay')?.remove();
}
function mf412GuestOpen(tab){
 if(!MF412_GUEST_PAGES.some(x=>x[0]===tab))tab='home';
 const target='#/community/'+tab;
 if(location.hash!==target)location.hash=target;
 else{MF412_GUEST.tab=tab;mf412GuestMount();void mf412GuestLoad();}
}
function mf412GuestWorkspace(){
 mf412GuestClose();
 if(location.hash.startsWith('#/community'))location.hash='';
 if(AUTH_USER&&AUTH_READY)App.setView('dashboard');
 else if(window.MediaFlowAuth?.show)window.MediaFlowAuth.show('login');
 else renderAuthScreen('login');
}
function mf412GuestBrowseResults(d){
 const e=mfp408Esc,rows=d.titles||[];
 return '<p class="mf412g-meta">'+Number(d.total||0).toLocaleString()+' matching verified titles'+
  (d.partial?' · Limited live scan; results may be incomplete':'')+'</p>'+
  (rows.length?'<div class="mf412g-titles">'+rows.map(t=>'<article>'+
   '<div class="mf412g-poster">'+(t.cover_url?'<img loading="lazy" src="'+e(t.cover_url)+'" alt="">':'<span>MF+</span>')+'</div>'+
   '<div><h3>'+e(t.title)+'</h3><small>'+e(t.key)+'</small><p>'+
   Number(t.owners_count||0)+' public '+(Number(t.owners_count)===1?'Library':'Libraries')+
   (t.average_rating!=null?' · ★ '+Number(t.average_rating).toFixed(2)+'/10':'')+'</p>'+
   '<button onclick="App.mf412GuestWorkspace()">Add in Workspace →</button></div></article>').join('')+'</div>':
   '<div class="mf412g-empty">No verified titles are currently available from opted-in workspaces.</div>')+
   '<div class="mf412g-actions">'+(MF412_GUEST.page>0?'<button onclick="App.mf412GuestPage(-1)">← Previous</button>':'')+
   (Number(d.total||0)>(MF412_GUEST.page+1)*24?'<button onclick="App.mf412GuestPage(1)">Next →</button>':'')+'</div>';
}
function mf412GuestCollectionCards(rows){
 const e=mfp408Esc;
 return rows.length?'<div class="mf412g-collections">'+rows.map(c=>'<article>'+
  '<div class="mf412g-cover">'+(c.cover_url?'<img loading="lazy" src="'+e(c.cover_url)+'" alt="">':'<span>▤</span>')+'</div>'+
  '<div><small>@'+e(c.username||'member')+' · LIVE COLLECTION</small><h3>'+e(c.title)+'</h3>'+
  '<p>'+e(c.description||'Collection linked to the original owner.')+'</p>'+
  '<span>'+Number(c.total||0)+' live titles</span><button onclick="App.mfp412OpenPublicCollection(\''+
  e(c.owner_id)+'\',\''+e(c.id)+'\')">View collection →</button></div></article>').join('')+'</div>':
  '<div class="mf412g-empty">No publicly shared collections yet. Members can publish original collections from their Workspace.</div>';
}
function mf412GuestContent(){
 const data=MF412_GUEST.data||{},e=mfp408Esc,tab=MF412_GUEST.tab;
 if(tab==='home')return '<section class="mf412g-home"><div class="mf412g-hero">'+
  '<div><span class="mf412g-kicker">THE MEDIAFLOW COMMUNITY</span><h1>Discover more than titles. <em>Discover each other.</em></h1>'+
  '<p>Browse media, follow creators and discover collections shared directly from the people who made them. No copied libraries or shadow databases.</p>'+
  '<div class="mf412g-actions"><button class="primary" onclick="App.mf412GuestOpen(\'browse\')">Explore titles</button>'+
  '<button onclick="App.mf412GuestWorkspace()">My Workspace ↗</button></div></div>'+
  '<div class="mf412g-hero-art"><span>YOUR MEDIA</span><strong>ONE<br>COMMUNITY</strong><small>MEDIAFLOW PLUS</small></div></div>'+
  '<div class="mf412g-shortcuts">'+MF412_GUEST_PAGES.filter(x=>x[0]!=='home').map(([id,label])=>
  '<button onclick="App.mf412GuestOpen(\''+id+'\')"><small>EXPLORE</small><strong>'+e(label)+'</strong><span>See what members share →</span></button>').join('')+
  '<button onclick="App.mf412GuestWorkspace()"><small>YOUR SPACE</small><strong>Workspace</strong><span>Your private library and tools →</span></button></div>'+
  '<div class="mf412g-heading"><h2>Community Collections</h2><button onclick="App.mf412GuestOpen(\'collections\')">Browse all →</button></div>'+
  mf412GuestCollectionCards((data.collections||[]).slice(0,8))+'</section>';
 if(tab==='collections')return '<div class="mf412g-heading"><div><span class="mf412g-kicker">LIVE COLLECTIONS</span><h1>Discover community collections</h1>'+
  '<p>Always linked to the creator’s current originals, never copied into a Community catalog.</p></div></div>'+
  mf412GuestCollectionCards(data.collections||[]);
 return '<section><div class="mf412g-heading"><div><span class="mf412g-kicker">'+(tab==='top'?'COMMUNITY RATINGS':'VERIFIED MEDIA DIRECTORY')+'</span>'+
  '<h1>'+(tab==='top'?'Top titles':'Browse titles')+'</h1><p>Only verified media IDs from public, opted-in workspaces appear here.</p></div></div>'+
  (tab==='browse'?'<div class="mf412g-filters"><input id="mf412g-search" type="search" maxlength="120" placeholder="Search public verified titles…" value="'+e(MF412_GUEST.query)+
  '" oninput="App.mf412GuestSearch(this.value)"><select onchange="App.mf412GuestSort(this.value)" aria-label="Sort titles">'+
  '<option value="alpha"'+(MF412_GUEST.sort==='alpha'?' selected':'')+'>Alphabetical</option>'+
  '<option value="rated"'+(MF412_GUEST.sort==='rated'?' selected':'')+'>Highest rated</option></select></div>':'')+
  mf412GuestBrowseResults(data)+'</section>';
}
async function mf412GuestLoad(){
 const tab=MF412_GUEST.tab,id=++MF412_GUEST.request,root=document.getElementById('mf412g-content');
 if(!root)return;root.innerHTML='<p class="mf412g-loading">Loading public Community content…</p>';
 try{
  const result=tab==='home'||tab==='collections'
   ?await mfp412PublicApi({type:'directory'})
   :await mfp412PublicApi({type:'browse',query:tab==='top'?'':MF412_GUEST.query,
     sort:tab==='top'?'rated':MF412_GUEST.sort,offset:MF412_GUEST.page*24,limit:24});
  if(id!==MF412_GUEST.request||tab!==MF412_GUEST.tab||!root.isConnected)return;
  MF412_GUEST.data=result;MF412_GUEST.error='';root.innerHTML=mf412GuestContent();
 }catch(err){
  if(id!==MF412_GUEST.request||tab!==MF412_GUEST.tab||!root.isConnected)return;
  MF412_GUEST.data={collections:[],titles:[],total:0};
  MF412_GUEST.error=String(err?.message||'Unable to reach the public directory');
  root.innerHTML='<div class="mf412g-alert" role="status">Community live listings are currently unavailable. The public Home and Workspace navigation still work. '+
   '<button onclick="App.mf412GuestLoad()">Retry</button></div>'+mf412GuestContent();
 }
}
function mf412GuestPage(dir){MF412_GUEST.page=Math.max(0,MF412_GUEST.page+Number(dir));void mf412GuestLoad();}
let mf412GuestTimer=null;
function mf412GuestSearch(value){
 MF412_GUEST.query=String(value||'').slice(0,120);MF412_GUEST.page=0;clearTimeout(mf412GuestTimer);
 mf412GuestTimer=setTimeout(()=>{const target=document.getElementById('mf412g-search'),pos=target?.selectionStart;
  void mf412GuestLoad().then(()=>{const next=document.getElementById('mf412g-search');if(next){next.focus();try{next.setSelectionRange(pos,pos);}catch(_){}}});
 },300);
}
function mf412GuestSort(value){MF412_GUEST.sort=value==='rated'?'rated':'alpha';MF412_GUEST.page=0;void mf412GuestLoad();}
function mf412GuestRoute(){
 const tab=mf412GuestRouteType();
 if(!tab){mf412GuestClose();return;}
 MF412_GUEST.tab=tab;MF412_GUEST.page=0;
 mf412GuestMount();void mf412GuestLoad();
}
function mf412AuthExploreLink(){
 const card=document.querySelector('.v297-auth-card');
 if(!card||card.querySelector('.mf412g-explore'))return;
 const button=document.createElement('button');
 button.type='button';button.className='mf412g-explore';
 button.textContent='Explore the Community Home →';
 button.addEventListener('click',()=>mf412GuestOpen('home'));
 card.querySelector('.auth-foot')?.before(button);
}
const mf412GuestAuthBase=renderAuthScreen;
renderAuthScreen=function(){
 const result=mf412GuestAuthBase.apply(this,arguments);
 mf412AuthExploreLink();
 return result;
};
if(window.MediaFlowAuth)window.MediaFlowAuth.show=renderAuthScreen;
if(document.querySelector('.v297-auth-card'))mf412AuthExploreLink();
window.addEventListener('hashchange',mf412GuestRoute);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mf412GuestRoute,{once:true});
else setTimeout(mf412GuestRoute,0);
Object.assign(App,{mf412GuestOpen,mf412GuestWorkspace,mf412GuestLoad,mf412GuestPage,mf412GuestSearch,mf412GuestSort});
