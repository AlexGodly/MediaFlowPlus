/* MediaFlow Plus v414 — Public Community Home and native Workspace/Community menus.
 * All Community data remains projected live from owner workspaces.
 * This supplements v413; it never replaces Browse/Top/Friends/Inbox or their backend.
 */
(function(){
'use strict';
const LINKS=[
 ['home','Home','house'],['browse','Browse Titles','compass'],['collections','Collections','layers'],
 ['top','Top Titles','star'],['people','People','users'],['feed','Feed','rss'],
 ['friends','Friends','heart'],['messages','Inbox','mail'],['notifications','Notifications','bell'],['profile','Public Profile','user']
];
const icons={
 house:'<path d="m3 11 9-8 9 8v10H3z"/><path d="M9 21v-8h6v8"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/>',
 layers:'<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
 star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
 users:'<circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M17 7a4 4 0 0 1 0 8M20 17a5 5 0 0 1 3 4"/>',
 rss:'<path d="M4 12a8 8 0 0 1 8 8M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.5"/>',
 heart:'<path d="m20.8 5.6-1.5-1.5a5.5 5.5 0 0 0-7.8 0L12 4.6l-.5-.5a5.5 5.5 0 0 0-7.8 7.8L12 20l8.8-8.1a5.5 5.5 0 0 0 0-6.3z"/>',
 mail:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>',
 bell:'<path d="M18 9a6 6 0 1 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9M10 21h4"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/>'
};
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const svg=id=>'<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[id]+'</svg>';
const G={tab:'home',data:null,error:'',request:0,loginRequested:false,home:[],homeLoaded:0,homeRequest:0,navObserver:null,observed:null,refreshQueued:false};
const publicTab=()=>String(location.hash||'').match(/^#\/community(?:\/(home|collections|browse|top))?\/?$/i)?.[1]?.toLowerCase()||(/^(#\/community|#\/community\/)$/.test(String(location.hash||''))?'home':'');
function prefs(){
 const raw=S.settings?.mfp414CommunityMenu||{},all=LINKS.map(x=>x[0]);
 return {show:raw.show!==false,expanded:raw.expanded!==false,
  hidden:Array.isArray(raw.hidden)?raw.hidden.filter(x=>all.includes(x)):[],order:[...new Set([...(Array.isArray(raw.order)?raw.order:[]).filter(x=>all.includes(x)),...all])]};
}
function savePrefs(p){S.settings=S.settings||{};S.settings.mfp414CommunityMenu=p;try{persistSettings()}catch(e){console.warn('Community menu settings were not saved',e)}}
function links(){const p=prefs(),by=new Map(LINKS.map(x=>[x[0],x]));return p.order.filter(id=>!p.hidden.includes(id)).map(id=>by.get(id)).filter(Boolean)}
function selected(){if(S.view==='browse')return String(window.MediaFlowPlusLiveBrowse413?.scope?.()||'titles')==='top'?'top':'browse';if(S.view==='friends')return 'friends';if(S.view==='inbox')return 'messages';if(S.view==='explorecollections')return 'collections';if(S.view==='community')return MFP408.tab||'home';return '';}
function hasGroup(){return prefs().show&&typeof v161VisibleNavItems==='function'&&v161VisibleNavItems().some(x=>x.id==='community')}
function navDesktop(){
 const p=prefs(),current=selected();
 return '<section class="mf414-community" aria-label="Community navigation">'+
 '<button type="button" class="mf414-community-toggle '+(current?'current':'')+'" aria-expanded="'+p.expanded+'" aria-controls="mf414-community-items" onclick="App.mf414Toggle()">'+
 '<span class="mf414-glyph">'+svg('users')+'</span><strong>Community</strong><span class="mf414-caret">⌄</span></button>'+
 '<div class="mf414-community-items" id="mf414-community-items"'+(p.expanded?'':' hidden')+'>'+
 links().map(([id,label,icon])=>'<button type="button" class="mf414-menu-link '+(id===current?'active':'')+'" onclick="App.mf414Navigate(\''+id+'\')"'+(id===current?' aria-current="page"':'')+
 ' title="'+label+'">'+svg(icon)+'<span>'+label+'</span></button>').join('')+'</div></section>';
}
function navSync(){
 const nav=document.querySelector('#app .sidebar .nav');if(!AUTH_USER||!nav)return;
 if(nav!==G.observed){
  G.navObserver?.disconnect();G.observed=nav;
  G.navObserver=new MutationObserver(()=>{if(G.refreshQueued)return;G.refreshQueued=true;queueMicrotask(()=>{G.refreshQueued=false;navSync()})});
  G.navObserver.observe(nav,{childList:true});
 }
 if(!nav.querySelector(':scope > .mf414-workspace')){
  nav.insertAdjacentHTML('afterbegin','<button class="mf414-workspace" type="button" onclick="App.mf414Workspace()">'+svg('layers')+'<strong>Workspace</strong><span>↗</span></button>');
 }
 const group=hasGroup();
 for(const view of ['community','browse','friends','inbox','explorecollections']){
  const node=nav.querySelector(':scope > .nav-item[data-view="'+view+'"]');if(node){node.hidden=group;node.style.display=group?'none':'';}
 }
 let current=nav.querySelector(':scope > .mf414-community');
 if(!group){current?.remove();return;}
 const html=navDesktop();
 if(!current){
  const host=document.createElement('div');host.innerHTML=html;current=host.firstElementChild;
  const anchor=nav.querySelector(':scope > .nav-item[data-view="community"]');
  if(anchor)nav.insertBefore(current,anchor);else nav.appendChild(current);
 }
 if(current.dataset.mf414Html!==html){
  const holder=document.createElement('div');holder.innerHTML=html;
  current.replaceWith(holder.firstElementChild);current=holder.firstElementChild;current.dataset.mf414Html=html;
 }
}
function toggle(){
 const p=prefs();p.expanded=!p.expanded;savePrefs(p);
 if(document.body.classList.contains('mf265-sidebar-collapsed')&&typeof App.v265ToggleSidebar==='function')App.v265ToggleSidebar();
 navSync();
 const body=document.querySelector('#mf414-mobile-list');if(body)body.hidden=!p.expanded;
 const btn=document.querySelector('.mf414-mobile-toggle');if(btn)btn.setAttribute('aria-expanded',String(p.expanded));
}
function navigate(id){
 if(!AUTH_USER){guestOpen('home');return;}
 const destinations=LINKS.map(x=>x[0]);if(!destinations.includes(id))return;
 if(id==='browse'||id==='top'){App.lb413Tab(id==='top'?'top':'titles');}
 else if(id==='collections'){App.ps412Explore();}
 else if(id==='friends'||id==='messages'){App.setView(id==='friends'?'friends':'inbox');}
 else{MFP408.tab=id;MFP408.limit=12;App.setView('community');}
 navSync();
 document.querySelector('#mobile-more-menu')?.classList.add('hide');
 try{window.scrollTo({top:0,behavior:'auto'})}catch(_){}
}
function workspace(){
 guestClose();G.loginRequested=true;
 if(publicTab())location.hash='';
 if(AUTH_USER&&AUTH_READY)App.setView('dashboard');
 else window.MediaFlowAuth?.show?.('login');
}
function mobileLinks(){
 const p=prefs(),sel=selected();
 return '<section class="mf414-mobile-section"><button type="button" class="mf414-mobile-toggle" aria-expanded="'+p.expanded+'" onclick="App.mf414Toggle()">'+svg('users')+'<strong>Community</strong><span>⌄</span></button>'+
 '<div id="mf414-mobile-list" class="mf414-mobile-list"'+(p.expanded?'':' hidden')+'>'+
 links().map(([id,label,icon])=>'<button type="button" class="'+(sel===id?'active':'')+'" onclick="App.mf414Navigate(\''+id+'\')">'+svg(icon)+'<span>'+label+'</span></button>').join('')+'</div></section>';
}
const baseMobile=renderMobileTabs;
renderMobileTabs=function(){
 if(typeof v161VisibleNavItems!=='function'||typeof v296MoreMenuHtml!=='function')return baseMobile.apply(this,arguments);
 const all=v161VisibleNavItems(),group=hasGroup();
 const work=group?all.filter(n=>!['community','browse','friends','inbox'].includes(n.id)):all;
 const slots=typeof v276MobileNavSlotCount==='function'?v276MobileNavSlotCount():7;
 const needsMore=work.length>slots||group;
 const count=needsMore?Math.max(1,slots-1):Math.min(slots,work.length);
 const primary=work.slice(0,count),extra=work.slice(count);
 const tabs=primary.map(n=>'<button type="button" class="mtab '+(S.view===n.id?'active':'')+
 '" onclick="App.mobileNav(\''+n.id+'\')" aria-label="'+esc(n.label)+'">'+(ICONS[n.id]||'')+'<span>'+esc(n.label)+'</span></button>').join('');
 if(!needsMore)return tabs;
 let more=v296MoreMenuHtml(extra,extra.some(n=>n.id===S.view)||!!selected());
 if(group)more=more.replace('<div class="v296-more-grid">',mobileLinks()+'<div class="v296-more-grid">');
 return tabs+more;
};
function navSettings(){
 const p=prefs();return '<section class="mf414-menu-settings"><h3>Community menu</h3><p>Separate your personal Workspace from Community. Customize the nested menu without changing your Library or the Workspace navigation order.</p>'+
 '<div class="mf414-menu-switches"><label><input type="checkbox" '+(p.show?'checked':'')+' onchange="App.mf414MenuShow(this.checked)"> Show Community group</label>'+
 '<label><input type="checkbox" '+(p.expanded?'checked':'')+' onchange="App.mf414Toggle()"> Expand Community menu</label>'+
 '<button type="button" class="btn btn-sm" onclick="App.mf414MenuReset()">Reset Community menu</button></div>'+
 '<div class="mf414-menu-settings-rows">'+p.order.map((id,i)=>{
 const data=LINKS.find(x=>x[0]===id),visible=!p.hidden.includes(id);
 return '<div class="mf414-menu-setting"><span>'+svg(data[2])+esc(data[1])+'</span><div>'+
 '<button type="button" '+(i===0?'disabled':'')+' onclick="App.mf414MenuMove(\''+id+'\',-1)" aria-label="Move '+esc(data[1])+' up">↑</button>'+
 '<button type="button" '+(i===p.order.length-1?'disabled':'')+' onclick="App.mf414MenuMove(\''+id+'\',1)" aria-label="Move '+esc(data[1])+' down">↓</button>'+
 '<label><input type="checkbox" '+(visible?'checked':'')+' onchange="App.mf414MenuPage(\''+id+'\',this.checked)"> Show</label></div></div>';
 }).join('')+'</div></section>';
}
const oldSettings=v161NavigationSettingsHtml;
v161NavigationSettingsHtml=function(){return oldSettings.apply(this,arguments)+navSettings()};
function settingsRefresh(){const x=document.querySelector('.mf414-menu-settings');if(x)x.outerHTML=navSettings();}
function setShow(show){const p=prefs();p.show=!!show;savePrefs(p);navSync();settingsRefresh();render()}
function setPage(id,on){const p=prefs();if(!LINKS.some(x=>x[0]===id))return;p.hidden=p.hidden.filter(x=>x!==id);if(!on)p.hidden.push(id);savePrefs(p);navSync();settingsRefresh();render()}
function move(id,by){const p=prefs(),at=p.order.indexOf(id),to=at+by;if(at<0||to<0||to>=p.order.length)return;
 [p.order[at],p.order[to]]=[p.order[to],p.order[at]];savePrefs(p);navSync();settingsRefresh();render()}
function reset(){if(S.settings)delete S.settings.mfp414CommunityMenu;try{persistSettings()}catch(_){}navSync();settingsRefresh();render()}
async function directory(){
 const headers={apikey:SUPABASE_PUBLISHABLE_KEY};
 if(AUTH_USER&&supabase){try{const r=await supabase.auth.getSession();if(r.data?.session?.access_token)headers.authorization='Bearer '+r.data.session.access_token}catch(_){}}
 const response=await fetch(SUPABASE_URL+'/functions/v1/mfp-public-workspace?kind=discover',{headers,cache:'no-store'});
 const data=await response.json();if(!response.ok)throw Error(data?.error||'Community directory unavailable');
 return data.collections||[];
}
function collectionCards(rows){
 return rows.length?'<div class="mf414-collection-grid">'+rows.slice(0,9).map(c=>'<article><span class="mf414-item-symbol">'+svg('layers')+'</span><div><small>@'+esc(c.owner?.username||'member')+' · LIVE COLLECTION</small><h3>'+esc(c.title)+'</h3><p>'+esc(c.description||'')+'</p><button type="button" onclick="App.mf414OpenCollection(\''+esc(c.owner?.username||'')+'\',\''+esc(c.id)+'\')">Explore '+Number(c.count||0)+' titles →</button></div></article>').join('')+'</div>':
 '<div class="mf414-empty">No collections have been publicly shared yet. Original collections remain private unless their owners publish them.</div>';
}
function homeHtml(publicMode=false){
 return '<div class="mf414-home"><section class="mf414-hero"><div><small>MEDIAFLOW PLUS · COMMUNITY</small>'+
 '<h1>Your media. <em>One community.</em></h1>'+
 '<p>Discover media, creators and collections shared directly from their current workspaces. No copied libraries, ratings or public media database.</p>'+
 '<div class="mf414-hero-actions"><button class="primary" onclick="App.mf414NavigateOrLogin(\'browse\')">'+svg('compass')+' Browse titles</button>'+
 '<button onclick="App.mf414Workspace()">'+svg('layers')+' My Workspace →</button></div></div>'+
 '<div class="mf414-hero-mark">M<span>+</span><small>EXPLORE TOGETHER</small></div></section>'+
 '<div class="mf414-shortcuts">'+[['browse','Browse Titles'],['top','Top Rated'],['collections','Collections'],['people','People']].map(([id,label])=>
 '<button onclick="App.mf414NavigateOrLogin(\''+id+'\')"><b>'+esc(label)+'</b><small>Explore →</small></button>').join('')+'</div>'+
 '<section class="mf414-home-lists"><header><div><small>LIVE FROM OWNERS</small><h2>Community collections</h2></div>'+
 '<button onclick="App.mf414NavigateOrLogin(\'collections\')">View all →</button></header>'+
 '<div id="'+(publicMode?'mf414-public-cards':'mf414-private-cards')+'">'+collectionCards(G.home)+'</div></section></div>';
}
async function loadHome(publicMode){
 const target=publicMode?'mf414-public-cards':'mf414-private-cards';
 const node=document.getElementById(target);if(!node)return;
 if(Date.now()-G.homeLoaded<12000){node.innerHTML=collectionCards(G.home);return}
 const request=++G.homeRequest;node.innerHTML='<div class="mf414-empty">Loading current public collections…</div>';
 try{
  const items=await directory();if(request!==G.homeRequest||!node.isConnected)return;
  G.home=items;G.homeLoaded=Date.now();node.innerHTML=collectionCards(items);
 }catch(e){if(request===G.homeRequest&&node.isConnected)node.innerHTML='<div class="mf414-empty">Could not load Community collections. <button onclick="App.mf414ReloadHome()">Retry</button></div>';}
}
function guestRoute(){return publicTab()}
function guestMount(){
 if(!guestRoute())return;
 G.tab=guestRoute();let host=document.getElementById('mf414-guest');
 if(!host){host=document.createElement('div');host.id='mf414-guest';document.body.appendChild(host)}
 document.body.classList.add('mf414-guest-active');
 host.innerHTML='<div class="mf414-public-site"><header class="mf414-public-bar">'+
 '<button onclick="App.mf414GuestOpen(\'home\')"><strong>MediaFlow<span>+</span></strong><small>COMMUNITY</small></button>'+
 '<nav>'+[['home','Home'],['browse','Browse'],['top','Top Rated'],['collections','Collections']].map(([id,label])=>
 '<button class="'+(G.tab===id?'selected':'')+'" onclick="App.mf414GuestOpen(\''+id+'\')">'+label+'</button>').join('')+'</nav>'+
 '<button class="mf414-site-workspace" onclick="App.mf414Workspace()">My Workspace ↗</button></header>'+
 '<main id="mf414-public-main">'+(G.tab==='home'?homeHtml(true):'<div class="mf414-empty">Loading live Community '+esc(G.tab)+'…</div>')+'</main>'+
 '<footer>MediaFlow Plus · Shared data is read live from its owner <button onclick="App.mf414Workspace()">Open Workspace →</button></footer></div>';
 if(G.tab==='home')void loadHome(true);else void guestList();
}
function guestClose(){
 G.request++;document.body.classList.remove('mf414-guest-active');
 document.getElementById('mf414-guest')?.remove();
}
function guestOpen(tab){
 if(!['home','collections','browse','top'].includes(tab))tab='home';
 const hash='#/community/'+tab;
 if(location.hash!==hash)location.hash=hash;else guestMount();
}
async function guestList(){
 const tab=G.tab,req=++G.request,root=document.getElementById('mf414-public-main');if(!root)return;
 if(tab==='collections'){
  try{const rows=await directory();if(req!==G.request||!root.isConnected)return;
   root.innerHTML='<div class="mf414-page-title"><h1>Community Collections</h1><p>Live original collections from consenting owners.</p></div>'+collectionCards(rows);
  }catch(_){root.innerHTML='<div class="mf414-empty">Community collection listings are unavailable. <button onclick="App.mf414GuestOpen(\'collections\')">Retry</button></div>';}
  return;
 }
 // Guest title discovery is read from the already deployed, strictly opt-in
 // public projector. Signed-in Browse continues using v413's own authenticated API.
 try{
  const u=SUPABASE_URL+'/functions/v1/mediaflow-plus-public-workspace?type=browse&sort='+(tab==='top'?'rated':'alpha')+'&limit=25';
  const response=await fetch(u,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY},cache:'no-store'});
  const d=await response.json();
  if(!response.ok)throw Error(d?.error||'Live directory unavailable');
  if(req!==G.request||!root.isConnected)return;
  const data=(d.titles||[]).filter(x=>tab!=='top'||x.average_rating!=null);
  root.innerHTML='<div class="mf414-page-title"><h1>'+(tab==='top'?'Top Rated':'Browse Titles')+'</h1><p>Verified media from currently opted-in public libraries. '+(d.partial?'The limited live scan may be incomplete.':'')+'</p></div>'+
   (data.length?'<div class="mf414-title-grid">'+data.map(x=>'<article><div class="mf414-poster">'+(x.cover_url?'<img src="'+esc(x.cover_url)+'" alt="" loading="lazy">':'◫')+'</div><div><h3>'+esc(x.title)+'</h3><p>'+
    esc(x.key)+(x.average_rating!=null?' · ★ '+Number(x.average_rating).toFixed(2):'')+'</p>'+
    '<button onclick="App.mf414Workspace()">Add in Workspace →</button></div></article>').join('')+'</div>':
    '<div class="mf414-empty">No eligible titles are currently visible.</div>');
 }catch(_){if(req===G.request&&root.isConnected)root.innerHTML='<div class="mf414-empty">Public titles are temporarily unavailable. <button onclick="App.mf414GuestOpen(\''+tab+'\')">Retry</button></div>';}
}
function routeChanged(){if(guestRoute())guestMount();else guestClose()}
function navigateOrLogin(id){if(!AUTH_USER){if(id==='browse'||id==='top'||id==='collections')guestOpen(id);else workspace();return;}guestClose();navigate(id)}
function openCollection(username,id){if(!/^[a-z0-9_]{3,24}$/.test(username)||!/^[A-Za-z0-9_-]{1,160}$/.test(id))return;location.hash='#/collection/'+encodeURIComponent(username)+'/'+encodeURIComponent(id)}
const oldRows=mfp408RenderRows;
if(!MFP408_TABS.some(x=>x[0]==='home'))MFP408_TABS.unshift(['home','Home']);
MFP408.tab='home';
mfp408RenderRows=function(){if(MFP408.tab==='home')return homeHtml(false);return oldRows.apply(this,arguments)};
const oldCommunityRenderer=mfp408Renderer;
mfp408Renderer=function(){
 let html=oldCommunityRenderer.apply(this,arguments);
 return html.replace('</header>','<div class="mf414-internal-actions"><button onclick="App.mf414Navigate(\'home\')">Community Home</button>'+
 '<button onclick="App.mf414Workspace()">My Workspace →</button></div></header>');
};
MediaFlowRuntime.registerPageRenderer('community',mfp408Renderer);
MediaFlowRuntime.registerPageEnhancer('community',()=>{if(MFP408.tab==='home')void loadHome(false)});
const priorRender=render;
render=function(){
 const result=priorRender.apply(this,arguments);
 navSync();
 requestAnimationFrame(navSync);
 return result;
};
const priorAuth=renderAuthScreen;
renderAuthScreen=function(){
 if(guestRoute()){guestMount();return;}
 const result=priorAuth.apply(this,arguments);
 return result;
};
if(window.MediaFlowAuth)window.MediaFlowAuth.show=renderAuthScreen;
window.addEventListener('hashchange',routeChanged);
function startGuest(){
 if(guestRoute())return routeChanged();
 if(location.hash||AUTH_USER||G.loginRequested)return;
 // Default unauthenticated landing page is Community Home. Never redirect a
 // successfully restored authenticated Workspace.
 if(document.querySelector('.auth-screen')||document.querySelector('.v297-auth-card'))guestOpen('home');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(startGuest,200),{once:true});
else setTimeout(startGuest,200);
Object.assign(App,{mf414Navigate:navigate,mf414NavigateOrLogin:navigateOrLogin,mf414Workspace:workspace,
 mf414Toggle:toggle,mf414MenuShow:setShow,mf414MenuPage:setPage,mf414MenuMove:move,
 mf414MenuReset:reset,mf414GuestOpen:guestOpen,mf414OpenCollection:openCollection,
 mf414ReloadHome:()=>{G.homeLoaded=0;void loadHome(!!guestRoute())}});
})();
