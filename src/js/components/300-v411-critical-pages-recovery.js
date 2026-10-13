/* MediaFlow Plus v411 — Non-destructive critical page recovery.
 * Rendering must never silently erase Dashboard/Library, block navigation,
 * or attempt to initialize/persist an empty cloud snapshot on an error.
 */
(function(){
'use strict';
const V411_CRITICAL_VIEWS=new Set(['dashboard','library']);
const V411_PAGE_FAILURES={dashboard:0,library:0,other:0};
function v411Esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function v411MissingState(){
 return !Array.isArray(S.library)||!Array.isArray(S.categories)||!Array.isArray(S.sessions)||!S.settings||typeof S.settings!=='object';
}
function v411RecoveryMarkup(view,reason){
 const notReady=v411MissingState();
 const title=notReady?'Your workspace has not loaded':'This page could not render';
 const description=notReady
  ?'Your private MediaFlow Plus library is not ready. No data has been cleared or replaced.'
  :'An interface error interrupted this view. Your saved data has not been changed.';
 return '<div class="card mf411-recovery" role="alert" style="max-width:720px;margin:24px auto;padding:24px;border-radius:18px">'+
   '<div class="section-label">MEDIAFLOW PLUS · PAGE RECOVERY</div>'+
   '<h2 style="margin:12px 0 8px">'+title+'</h2>'+
   '<p>'+description+'</p>'+
   (reason?'<p style="opacity:.7;font-size:13px">Issue: '+v411Esc(reason)+'</p>':'')+
   '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:20px">'+
   '<button class="btn btn-primary" type="button" onclick="App.v411RetryPage()">Retry this page</button>'+
   '<button class="btn" type="button" onclick="App.setView(\'dashboard\')">Dashboard</button>'+
   '<button class="btn" type="button" onclick="App.setView(\'library\')">Library</button>'+
   '<button class="btn" type="button" onclick="App.setView(\'community\')">Community</button>'+
   (!AUTH_USER?'<button class="btn" type="button" onclick="window.MediaFlowAuth.show(\'login\')">Sign in</button>':'')+
   '</div></div>';
}
function v411ShowRecovery(view,error){
 const root=document.getElementById('view-root');
 const reason=String(error?.message||error||'The page response was empty').slice(0,250);
 if(root){root.innerHTML=v411RecoveryMarkup(view,reason);return;}
 const app=document.getElementById('app');
 if(app&&!app.querySelector('.auth-screen,.loader-wrap')){
  app.innerHTML='<main style="padding:20px;min-height:65vh">'+v411RecoveryMarkup(view,reason)+'</main>';
 }
}
function v411RetryPage(){
 if(!AUTH_USER){window.MediaFlowAuth?.show?.('login');return;}
 if(v411MissingState()){
  if(typeof window.MediaFlowRecovery?.retry==='function'){void window.MediaFlowRecovery.retry();return;}
  v411ShowRecovery(S.view,'Cloud state is not yet available');return;
 }
 render();
}
const v411RenderViewBase=renderView;
renderView=function(){
 const view=String(S.view||'');
 try{
  // A missing state is not an empty library. Wait for authenticated hydration
  // instead of executing deep render helpers with null state.
  if(V411_CRITICAL_VIEWS.has(view)&&v411MissingState()){
   v411ShowRecovery(view,'Workspace data has not finished loading');
   return;
  }
  const result=v411RenderViewBase.apply(this,arguments);
  if(V411_CRITICAL_VIEWS.has(view)){
   const root=document.getElementById('view-root');
   if(root&&!root.textContent.trim()){
    throw new Error('The renderer returned an empty page');
   }
  }
  return result;
 }catch(error){
  V411_PAGE_FAILURES[V411_CRITICAL_VIEWS.has(view)?view:'other']++;
  console.error('MediaFlow Plus: '+view+' page render failed',error);
  v411ShowRecovery(view,error);
 }
};
const v411RenderBase=render;
render=function(){
 try{return v411RenderBase.apply(this,arguments);}
 catch(error){
  const view=String(S.view||'');
  V411_PAGE_FAILURES[V411_CRITICAL_VIEWS.has(view)?view:'other']++;
  console.error('MediaFlow Plus: navigation render failed',error);
  try{
   document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',String(el.dataset?.view||'')===view));
   const mobile=document.querySelector('.mobile-tabbar');
   if(mobile&&typeof renderMobileTabs==='function')mobile.innerHTML=renderMobileTabs();
  }catch(_){}
  v411ShowRecovery(view,error);
 }
};
App.v411RetryPage=v411RetryPage;
window.MediaFlowPlusPageHealth={
 version:411,
 check(){const root=document.getElementById('view-root');return {
  currentView:String(S.view||''),
  authenticated:!!AUTH_USER,
  authReady:!!AUTH_READY,
  workspaceReady:!v411MissingState(),
  dashboardErrors:V411_PAGE_FAILURES.dashboard,
  libraryErrors:V411_PAGE_FAILURES.library,
  otherErrors:V411_PAGE_FAILURES.other,
  rootHasContent:!!root?.textContent?.trim(),
  communityLoaderVisible:String(S.view||'')==='community'&&!!document.querySelector('#mfp408-content')?.textContent?.includes('Loading community')
 };}
};
})();
