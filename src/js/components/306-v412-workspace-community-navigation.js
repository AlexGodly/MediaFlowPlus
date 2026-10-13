/* MediaFlow Plus v412 — true Workspace / Community navigation restoration.
 * Preserves the canonical v161 Workspace navigation order/visibility.
 * Community subsections are routed into the existing live Community renderer,
 * not separate data stores, snapshots, or fake pages.
 */
const MFP412_NAV_LINKS=[
 ['home','Home','Home','home'],['browse','Browse Titles','Browse titles','compass'],
 ['collections','Community Collections','Public collections','layers'],
 ['top','Top Titles','Ranked titles','star'],['people','People','Find members','users'],
 ['feed','Feed','Community updates','rss'],['friends','Friends','Connections','user-round-check'],
 ['messages','Inbox','Messages','mail'],['notifications','Notifications','Activity alerts','bell'],
 ['reviews','Reviews','Community reviews','message-square'],['profile','Public Profile','Sharing and profile','user-round']
];
const MFP412_NAV_KEYS=MFP412_NAV_LINKS.map(x=>x[0]);
const MFP412_NAV_ICONS={
 home:'<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m16.5 7.5-3 6-6 3 3-6z"/>',
 layers:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
 star:'<path d="m12 2 3.1 6.4 7.1 1-5.1 5 .9 7-6-3.3-6 3.3.9-7-5.1-5 7.1-1z"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 7a3 3 0 0 1 0 6M19 16a5 5 0 0 1 3 5"/>',
 rss:'<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.5"/>',
 'user-round-check':'<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 12l2 2 4-4"/>',
 mail:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 7 9 7 9-7"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 'message-square':'<path d="M21 12a9 9 0 0 1-9 9c-2 0-4-.6-5.5-1.8L3 20l.9-4A9 9 0 1 1 21 12z"/>',
 'user-round':'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
};
function mfp412MenuIcon(key){
 return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(MFP412_NAV_ICONS[key]||MFP412_NAV_ICONS.home)+'</svg>';
}
function mfp412NavPrefs(){
 const src=S.settings?.mfp412CommunityNav||S.settings?.mf315CommunityNav||{};
 const known=new Set(MFP412_NAV_KEYS);
 const order=[...new Set((Array.isArray(src.order)?src.order:[]).filter(x=>known.has(x)))];
 for(const id of MFP412_NAV_KEYS)if(!order.includes(id))order.push(id);
 // In v315 "community" meant Home; do not silently hide the entire group when that old Home item was hidden.
 const hidden=[...new Set((Array.isArray(src.hidden)?src.hidden:[]).filter(x=>known.has(x)))];
 return {visible:src.visible!==false,expanded:src.expanded!==false,order,hidden};
}
function mfp412NavSave(next){
 S.settings=S.settings||{};
 S.settings.mfp412CommunityNav=next;
 try{if(typeof persistSettings==='function')persistSettings();else if(typeof saveState==='function')void saveState();}
 catch(error){console.warn('Community navigation preferences could not be saved',error);}
}
function mfp412GroupAvailable(){
 return mfp412NavPrefs().visible && typeof v161VisibleNavItems==='function'
  &&v161VisibleNavItems().some(x=>x.id==='community');
}
function mfp412NavItems(){
 const p=mfp412NavPrefs(), byId=new Map(MFP412_NAV_LINKS.map(x=>[x[0],x]));
 return p.order.filter(x=>!p.hidden.includes(x)).map(x=>byId.get(x)).filter(Boolean);
}
function mfp412CurrentTab(){return S.view==='inbox'?'messages':S.view==='community'?String(MFP408.tab||'home'):'';}
function mfp412MenuDesktop(){
 const p=mfp412NavPrefs(),active=mfp412CurrentTab(),items=mfp412NavItems();
 return '<section class="mf412n-community" aria-label="Community navigation">'+
  '<button type="button" class="mf412n-group-head '+(active?'mf412n-active':'')+'" onclick="App.mfp412ToggleCommunity()" aria-expanded="'+p.expanded+'" aria-controls="mf412n-community-children" title="'+(p.expanded?'Collapse':'Expand')+' Community menu">'+
  '<span class="mf412n-group-symbol">'+(ICONS.community||mfp412MenuIcon('users'))+'</span><span class="mf412n-group-title">Community</span>'+
  '<span class="mf412n-chevron" aria-hidden="true">⌄</span></button>'+
  '<div class="mf412n-children" id="mf412n-community-children"'+(p.expanded?'':' hidden')+'>'+
  items.map(([id,label,_,icon])=>'<button type="button" class="mf412n-link '+(active===id?'active':'')+'" '+
    'data-mf412-destination="'+id+'" title="'+label+'" '+(active===id?'aria-current="page" ':'')+
    'onclick="App.mfp412Navigate(\''+id+'\')"><span class="mf412n-link-icon">'+mfp412MenuIcon(icon)+'</span>'+
    '<span class="mf412n-link-label">'+label+'</span></button>').join('')+
  '</div></section>';
}
function mfp412WorkspaceNavHtml(){
 return '<div class="mf412n-workspace-top"><button type="button" onclick="App.mfp412GoWorkspace()" title="Return to your personal workspace" aria-label="Open my Workspace">'+
  '<span class="mf412n-workspace-mark">'+mfp412MenuIcon('layers')+'</span><span>Workspace</span>'+
  '<span class="mf412n-workspace-arrow" aria-hidden="true">↗</span></button></div>';
}
function mfp412NavSync(){
 if(!AUTH_USER)return;
 const nav=document.querySelector('#app .sidebar .nav');if(!nav)return;
 // This label is only a navigation landmark; Workspace itself stays the real
 // Dashboard/Library/History app, with the user's v161 order & visibility.
 let marker=nav.querySelector(':scope > .mf412n-workspace-top');
 if(!marker){nav.insertAdjacentHTML('afterbegin',mfp412WorkspaceNavHtml());marker=nav.firstElementChild;}
 const visible=mfp412GroupAvailable();
 const nativeCommunity=nav.querySelector(':scope > .nav-item[data-view="community"]');
 const nativeInbox=nav.querySelector(':scope > .nav-item[data-view="inbox"]');
 let group=nav.querySelector(':scope > .mf412n-community');
 if(!visible){
  group?.remove();if(nativeCommunity)nativeCommunity.style.display='';
  if(nativeInbox)nativeInbox.style.display='';
  return;
 }
 // Keep the old core entries for v161 Navigation Settings and data compatibility,
 // but show one collapsible Community subtree instead of duplicate flat entries.
 const source=nativeCommunity||nativeInbox;
 if(!group){
  const host=document.createElement('div');host.innerHTML=mfp412MenuDesktop();group=host.firstElementChild;
  if(source)nav.insertBefore(group,source);else nav.appendChild(group);
 }
 const markup=mfp412MenuDesktop();
 // Only redraw if state changed, preserving keyboard focus on unrelated items.
 if(group.dataset.mf412Markup!==markup){
  const isGroupFocused=group.contains(document.activeElement);
  group.innerHTML=markup.replace(/^<section[^>]*>/,'').replace(/<\/section>$/,'');
  group.dataset.mf412Markup=markup;
  if(isGroupFocused)group.querySelector('[aria-current="page"]')?.focus({preventScroll:true});
 }
 if(nativeCommunity){nativeCommunity.hidden=true;nativeCommunity.style.display='none';}
 if(nativeInbox){nativeInbox.hidden=true;nativeInbox.style.display='none';}
 nav.classList.add('mf412n-has-community');
}
function mfp412ToggleCommunity(){
 if(typeof v265SidebarCollapsed==='function'&&v265SidebarCollapsed()){
  App.v265ToggleSidebar?.();
 }
 const next=mfp412NavPrefs();next.expanded=!next.expanded;
 mfp412NavSave(next);mfp412NavSync();
 const menu=document.getElementById('mobile-more-menu');
 if(menu){const body=menu.querySelector('.mf412n-mobile-body');
  if(body)body.hidden=!next.expanded;
  const header=menu.querySelector('.mf412n-mobile-head');if(header)header.setAttribute('aria-expanded',String(next.expanded));}
}
function mfp412SetCommunityVisible(on){
 const next=mfp412NavPrefs();next.visible=!!on;
 mfp412NavSave(next);mfp412NavSync();mfp412RefreshMenuSettings();render();
}
function mfp412SetCommunityPage(id,on){
 if(!MFP412_NAV_KEYS.includes(id))return;
 const next=mfp412NavPrefs();
 next.hidden=next.hidden.filter(x=>x!==id);
 if(!on)next.hidden.push(id);
 mfp412NavSave(next);mfp412NavSync();mfp412RefreshMenuSettings();render();
}
function mfp412MoveCommunityPage(id,delta){
 const next=mfp412NavPrefs(),at=next.order.indexOf(id),target=at+Number(delta);
 if(at<0||target<0||target>=next.order.length)return;
 [next.order[at],next.order[target]]=[next.order[target],next.order[at]];
 mfp412NavSave(next);mfp412NavSync();mfp412RefreshMenuSettings();render();
}
function mfp412ResetCommunityNav(){
 S.settings=S.settings||{};delete S.settings.mfp412CommunityNav;
 try{persistSettings();}catch(_){}
 mfp412NavSync();mfp412RefreshMenuSettings();render();
}
function mfp412RefreshMenuSettings(){
 const node=document.querySelector('.mf412n-nav-settings');if(node)node.outerHTML=mfp412NavSettings();
}
function mfp412NavSettings(){
 const prefs=mfp412NavPrefs(),byId=new Map(MFP412_NAV_LINKS.map(x=>[x[0],x]));
 return '<section class="mf412n-nav-settings" aria-label="Community menu settings">'+
  '<header><div><h3>Community menu</h3><p>A collapsible Community section alongside your personal Workspace menu. Reorder or hide destinations without changing the original Workspace navigation.</p></div>'+
  '<button type="button" class="btn btn-sm" onclick="App.mfp412ResetCommunityNav()">Restore defaults</button></header>'+
  '<div class="mf412n-nav-switches"><label><input type="checkbox" '+(prefs.visible?'checked':'')+
    ' onchange="App.mfp412SetCommunityVisible(this.checked)"> Show Community group in sidebar</label>'+
  '<label><input type="checkbox" '+(prefs.expanded?'checked':'')+
    ' onchange="App.mfp412ToggleCommunity()"> Expand Community links</label></div>'+
  '<div class="mf412n-nav-rows">'+prefs.order.map((id,i)=>{
   const row=byId.get(id),on=!prefs.hidden.includes(id);
   return '<div class="mf412n-nav-row"><span>'+mfp412MenuIcon(row[3])+' '+row[1]+'</span>'+
    '<div class="mf412n-nav-actions"><button type="button" title="Move up" '+(i?'':'disabled')+
      ' onclick="App.mfp412MoveCommunityPage(\''+id+'\',-1)">↑</button>'+
    '<button type="button" title="Move down" '+(i===prefs.order.length-1?'disabled':'')+
      ' onclick="App.mfp412MoveCommunityPage(\''+id+'\',1)">↓</button>'+
    '<label><input type="checkbox" '+(on?'checked':'')+' onchange="App.mfp412SetCommunityPage(\''+id+'\',this.checked)"> Show</label></div></div>';
  }).join('')+'</div></section>';
}
const mfp412OriginalNavSettings=v161NavigationSettingsHtml;
v161NavigationSettingsHtml=function(){return mfp412OriginalNavSettings.apply(this,arguments)+mfp412NavSettings();};
function mfp412GoWorkspace(){
 // Unlike the public profile, Workspace is always the original personal state.
 if(!AUTH_USER){window.MediaFlowAuth?.show?.('login');return;}
 App.setView('dashboard');
 mfp412NavSync();
}
function mfp412Navigate(page){
 if(!MFP412_NAV_KEYS.includes(page))return;
 if(!AUTH_USER){window.MediaFlowAuth?.show?.('login');return;}
 if(page==='messages'){
  App.setView('inbox');mfp412NavSync();return;
 }
 MFP408.tab=page;MFP408.limit=12;
 if(S.view!=='community')App.setView('community');
 else renderView();
 // Community's individual page is real app navigation, not only a tab in
 // an unrelated top bar; update desktop active and mobile "More" state.
 mfp412NavSync();
 const bar=document.querySelector('.mobile-tabbar');if(bar)bar.innerHTML=renderMobileTabs();
 const menu=document.getElementById('mobile-more-menu');menu?.classList.add('hide');
 try{window.scrollTo({top:0,left:0,behavior:'auto'});}catch(_){}
}
function mfp412MobileCommunity(){
 const p=mfp412NavPrefs(),current=mfp412CurrentTab();
 const rows=mfp412NavItems();
 return '<section class="mf412n-mobile-group" aria-label="Community pages">'+
  '<button type="button" class="mf412n-mobile-head '+(current?'active':'')+
   '" onclick="App.mfp412ToggleCommunity()" aria-expanded="'+p.expanded+'" aria-controls="mf412n-mobile-pages">'+
  mfp412MenuIcon('users')+'<strong>Community</strong><span aria-hidden="true">⌄</span></button>'+
  '<div id="mf412n-mobile-pages" class="mf412n-mobile-body"'+(p.expanded?'':' hidden')+'>'+
  rows.map(([id,label,_,icon])=>
    '<button type="button" class="mf412n-mobile-page '+(current===id?'active':'')+
    '" onclick="App.mfp412Navigate(\''+id+'\')" '+(current===id?'aria-current="page" ':'')+'>'+
    mfp412MenuIcon(icon)+'<span>'+label+'</span></button>').join('')+
  '</div></section>';
}
const mfp412MobileNavBase=renderMobileTabs;
renderMobileTabs=function(){
 if(typeof v161VisibleNavItems!=='function'||typeof v296MoreMenuHtml!=='function')
  return mfp412MobileNavBase.apply(this,arguments);
 const visible=v161VisibleNavItems();
 // Core Workspace tabs obey v161 ordering. Community/Inbox are grouped in More
 // even if users moved them into the first five positions.
 const workspace=visible.filter(x=>x.id!=='community'&&x.id!=='inbox');
 const slots=typeof v276MobileNavSlotCount==='function'?v276MobileNavSlotCount():7;
 const group=mfp412GroupAvailable(),needMore=workspace.length>slots||group;
 const count=needMore?Math.max(1,slots-1):Math.min(slots,workspace.length);
 const primary=workspace.slice(0,count),extra=workspace.slice(count);
 const tabs=primary.map(n=>'<button type="button" class="mtab '+(S.view===n.id?'active':'')+
   '" onclick="App.mobileNav(\''+n.id+'\')" aria-label="'+escapeHtml(n.label)+'">'+
   (ICONS[n.id]||'')+'<span>'+escapeHtml(n.label)+'</span></button>').join('');
 if(!needMore)return tabs;
 const moreActive=extra.some(n=>n.id===S.view)||!!mfp412CurrentTab();
 let html=v296MoreMenuHtml(extra,moreActive);
 if(group)html=html.replace('<div class="v296-more-grid">',
  '<div class="mf412n-more-content">'+mfp412MobileCommunity()+'</div><div class="v296-more-grid">');
 return tabs+html;
};
// Enrich the actual Community page with distinct navigation back to personal
// Workspace rather than confusing Community Home with Dashboard.
const mfp412CommunityRenderer=mfp408Renderer;
mfp408Renderer=function(){
 const result=mfp412CommunityRenderer.apply(this,arguments);
 return result.replace('</header>','<div class="mf412n-header-actions">'+
  '<button type="button" onclick="App.mfp412Navigate(\'home\')">'+mfp412MenuIcon('home')+' Community Home</button>'+
  '<button type="button" class="mf412n-go-workspace" onclick="App.mfp412GoWorkspace()">'+
   mfp412MenuIcon('layers')+' My Workspace →</button></div></header>');
};
// Modern sidebar navigation is the source of truth; remove duplicate 11-button
// horizontal tab strip, which broke intermediate/mobile layouts.
const mfp412CommunityOldTab=App.mfp408Tab;
App.mfp408Tab=function(tab){
 if(!MFP412_NAV_KEYS.includes(tab))return mfp412CommunityOldTab.apply(this,arguments);
 return mfp412Navigate(tab);
};
const mfp412NavRenderBase=render;
render=function(){
 const out=mfp412NavRenderBase.apply(this,arguments);
 mfp412NavSync();
 return out;
};
const mfp412SidebarRefreshBase=v265RefreshSidebarNav;
v265RefreshSidebarNav=function(){
 const out=mfp412SidebarRefreshBase.apply(this,arguments);
 mfp412NavSync();
 return out;
};
MediaFlowRuntime.registerPageEnhancer('community',mfp412NavSync);
MediaFlowRuntime.registerPageEnhancer('inbox',mfp412NavSync);
MediaFlowRuntime.registerPageEnhancer('settings',mfp412NavSync);
Object.assign(App,{mfp412Navigate,mfp412GoWorkspace,mfp412ToggleCommunity,mfp412SetCommunityVisible,
 mfp412SetCommunityPage,mfp412MoveCommunityPage,mfp412ResetCommunityNav});
