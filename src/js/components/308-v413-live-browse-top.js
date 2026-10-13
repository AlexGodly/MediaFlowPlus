/* MediaFlow Plus — v329-inspired live Browse & Top Ratings, no public copies.
 * All media comes directly from consenting owners' current cloud states via
 * the Plus Edge allowlist. Quick Add writes ONLY to the current viewer Library.
 */
(function(){
'use strict';
const LB413={scope:'titles',search:'',rows:[],error:'',loading:false,partial:true,
total:0,offset:0,next:null,coverage:0,requestId:0,debounce:0,selected:null};
const lbEsc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&quot;',"'":'&#39;'}[c]));
// Attribute escaping is the same as text escaping, including double quotes.
function lbSafe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const LB_FIELD={mal:'malId',simkl:'simklId',anilist:'anilistId',tmdb:'tmdbId',imdb:'imdbId',kitsu:'kitsuId'};
function lbCatalogLink(scope,search,offset){
 const q=new URLSearchParams({kind:'catalog',scope,search,offset:String(offset),limit:'25'});
 return SUPABASE_URL+'/functions/v1/mfp-public-workspace?'+q;
}
function lbHeader(){
 return '<div class="lb413-top"><div><span class="lb413-eyebrow">MEDIAFLOW PLUS · COMMUNITY</span><h1>Browse</h1><p>Discover media from members’ real shared libraries — no duplicate catalog database.</p></div><button type="button" class="btn" onclick="App.lb413Refresh()">Refresh</button></div>';
}
function lbPage(){
 return '<section class="lb413-page">'+lbHeader()+
  '<div class="lb413-toolbar"><div class="lb413-tabs" role="tablist" aria-label="Community browse modes">'+
  [['titles','Titles'],['top','Top Rated']].map(([id,title])=>'<button type="button" role="tab" aria-selected="'+String(LB413.scope===id)+'" onclick="App.lb413Tab(\''+id+'\')">'+title+'</button>').join('')+'</div>'+
  '<label class="lb413-search">Find a title<input type="search" value="'+lbSafe(LB413.search)+'" placeholder="Search title names…" autocomplete="off" oninput="App.lb413Search(this.value)"></label></div>'+
  '<div id="lb413-result-area" aria-live="polite">'+lbResults()+'</div></section>';
}
function lbResults(){
 if(LB413.loading)return '<div class="lb413-placeholder">Loading live Community results…</div>';
 if(LB413.error)return '<div class="lb413-placeholder" role="alert"><h3>Browse unavailable</h3><p>'+lbSafe(LB413.error)+'</p><button class="btn" onclick="App.lb413Refresh()">Retry</button></div>';
 const notice=LB413.partial?'Limited live coverage: only a bounded set of opted-in Community accounts was checked. These are not comprehensive worldwide rankings.':'Live results from all currently eligible opted-in accounts in this directory.';
 const lead='<div class="lb413-result-meta"><span>'+Number(LB413.total||0).toLocaleString()+' titles · '+Number(LB413.coverage||0).toLocaleString()+' creators scanned</span><span>'+lbSafe(notice)+'</span></div>';
 if(!LB413.rows.length)return lead+'<div class="lb413-placeholder"><h3>No matching public titles</h3><p>MediaFlow Plus only includes titles with provider IDs from people who explicitly share '+(LB413.scope==='top'?'their ratings':'their Library')+'.</p></div>';
 const cards=LB413.rows.map((x,i)=>'<article class="lb413-item">'+
 (x.cover_url?'<img src="'+lbSafe(x.cover_url)+'" loading="lazy" alt="" referrerpolicy="no-referrer">':'<div class="lb413-cover">◫</div>')+
 '<div class="lb413-copy"><div class="lb413-title">'+(LB413.scope==='top'?'<span class="lb413-rank">'+(LB413.offset+i+1)+'.</span>':'')+'<strong>'+lbSafe(x.title)+'</strong></div>'+
 '<div class="lb413-meta"><span>'+lbSafe(x.media_key)+'</span><span>'+Number(x.users_count||0)+' libraries</span>'+
 (x.average_rating==null?'':'<span>★ '+Number(x.average_rating).toFixed(2)+'/10 · '+Number(x.ratings_count||0)+' ratings</span>')+'</div></div>'+
 '<button type="button" class="btn btn-sm" onclick="App.lb413StartAdd(\''+lbSafe(x.media_key)+'\')">+ Add</button></article>').join('');
 const before=LB413.offset>0,after=LB413.next!==null;
 const pager=before||after?'<div class="lb413-pager">'+(before?'<button class="btn" onclick="App.lb413Page(-1)">← Previous</button>':'')+
 '<span>'+Number(LB413.offset+1).toLocaleString()+'–'+Number(LB413.offset+LB413.rows.length).toLocaleString()+'</span>'+
 (after?'<button class="btn" onclick="App.lb413Page(1)">Next →</button>':'')+'</div>':'';
 return lead+'<div class="lb413-items">'+cards+'</div>'+pager;
}
function lbDraw(){
 const root=document.getElementById('lb413-result-area');
 if(root&&S.view==='browse')root.innerHTML=lbResults();
}
async function lbLoad(){
 const me=AUTH_USER?.id,token=++LB413.requestId;
 if(!me||!supabase){LB413.loading=false;LB413.error='Sign in to browse members’ shared media.';lbDraw();return;}
 LB413.loading=true;LB413.error='';lbDraw();
 try{
  const session=await supabase.auth.getSession();
  if(!session.data?.session?.access_token)throw Error('Your session expired. Sign in again.');
  const result=await fetch(lbCatalogLink(LB413.scope,LB413.search,LB413.offset),{
   headers:{apikey:SUPABASE_PUBLISHABLE_KEY,authorization:'Bearer '+session.data.session.access_token},cache:'no-store'
  });
  const data=await result.json().catch(()=>({error:'Invalid Community response'}));
  if(!result.ok)throw Error(data.error||'Browse could not load.');
  if(data.source!=='current_owner_workspace'||data.stored_public_copy!==false)throw Error('Unexpected Community data source.');
  if(token!==LB413.requestId)return;
  LB413.rows=data.items||[];LB413.total=Number(data.total||0);LB413.partial=data.partial===true;
  LB413.coverage=Number(data.scanned_profiles||0);LB413.next=data.next_offset;LB413.error='';
 }catch(e){if(token!==LB413.requestId)return;LB413.error=String(e?.message||e);LB413.rows=[];}
 finally{if(token===LB413.requestId){LB413.loading=false;lbDraw();}}
}
function lbTab(tab){if(!['titles','top'].includes(tab))return;LB413.scope=tab;LB413.offset=0;S.view='browse';render();void lbLoad();}
function lbSearch(value){LB413.search=String(value||'');LB413.offset=0;clearTimeout(LB413.debounce);LB413.debounce=setTimeout(lbLoad,280);}
function lbPage(direction){LB413.offset=direction>0?LB413.next??LB413.offset:Math.max(0,LB413.offset-25);void lbLoad();}
function lbRefresh(){void lbLoad();}
function lbStartAdd(key){
 if(!AUTH_USER||!S.library){showToast('Sign in to your MediaFlow Plus workspace before importing.');return;}
 const row=LB413.rows.find(x=>x.media_key===key),[source,id]=String(key).split(':');
 if(!row||!LB_FIELD[source]||!/^[a-zA-Z0-9_-]{1,90}$/.test(id||''))return;
 if((S.library||[]).some(t=>String(t[LB_FIELD[source]]||'')===id)){
  showToast('This title is already linked in your Library.');return;
 }
 const catIds=typeof v230VisibleIds==='function'?v230VisibleIds('setCategory'):[];
 const cats=[...(S.categories||[])].filter(x=>x?.id).sort((a,b)=>{
  const ai=catIds.indexOf(String(a.id)),bi=catIds.indexOf(String(b.id));
  return (ai<0?10000:ai)-(bi<0?10000:bi);
 });
 if(!cats.length){showToast('Create at least one category before adding a title.');return;}
 LB413.selected=row;
 document.getElementById('lb413-add-overlay')?.remove();
 const overlay=document.createElement('div');overlay.id='lb413-add-overlay';overlay.className='modal-overlay lb413-overlay';
 overlay.innerHTML='<div class="modal lb413-add-dialog" role="dialog" aria-modal="true" aria-label="Choose destination category">'+
 '<h2>Add to your Library</h2><p><strong>'+lbSafe(row.title)+'</strong></p><p>Select your category. The title will be independent in your own workspace.</p>'+
 '<div class="lb413-category-list">'+cats.map(x=>'<button type="button" onclick="App.lb413CommitAdd(\''+lbSafe(key)+'\',\''+lbSafe(x.id)+'\')">'+
 (typeof v144CategoryIconHtml==='function'?v144CategoryIconHtml(x):'▦')+'<span>'+lbSafe(x.name)+'</span></button>').join('')+'</div>'+
 '<button type="button" class="btn" onclick="App.lb413CloseAdd()">Cancel</button></div>';
 overlay.addEventListener('click',e=>{if(e.target===overlay)lbCloseAdd()});
 document.body.appendChild(overlay);
 overlay.querySelector('button')?.focus({preventScroll:true});
}
function lbCloseAdd(){document.getElementById('lb413-add-overlay')?.remove();LB413.selected=null;}
async function lbCommitAdd(key,categoryId){
 if(!AUTH_USER||!S.library||!S.categories)return;
 const row=LB413.rows.find(x=>x.media_key===key),[source,id]=String(key).split(':');
 if(!row||!LB_FIELD[source]||!S.categories.some(c=>String(c.id)===String(categoryId)))return;
 if(S.library.some(t=>String(t[LB_FIELD[source]]||'')===id)){showToast('Title already present.');lbCloseAdd();return;}
 const item={id:uid(),title:String(row.title||'').trim(),categoryId:String(categoryId),
  coverUrl:String(row.cover_url||''),status:'planned',priority:'medium',progress:0,
  total:0,createdAt:Date.now(),modifiedAt:Date.now()};
 item[LB_FIELD[source]]=id;
 const cleaned=sanitizeLibrary([item]);
 if(!cleaned.length){showToast('Could not validate title metadata.');return;}
 const button=document.querySelector('#lb413-add-overlay .lb413-category-list button');if(button)button.disabled=true;
 try{
  S.library.push(...cleaned);
  if(typeof v53InvalidateLibraryCache==='function')v53InvalidateLibraryCache();
  await saveState();
  lbCloseAdd();showToast(lastSaveFailed?'Added locally. Verify cloud sync.':'Added to your Library ✓');
 }catch(e){
  showToast('Title added locally, but cloud sync failed. Retry Sync Now and do not clear local data.');
  lbCloseAdd();console.warn('Quick Add sync failed',e);
 }
}
if(!NAV_ITEMS.some(x=>x.id==='browse')){
 const i=NAV_ITEMS.findIndex(x=>x.id==='community');
 NAV_ITEMS.splice(i<0?Math.max(0,NAV_ITEMS.length-2):i+1,0,{id:'browse',label:'Browse'});
}
if(!MOBILE_MORE_NAV.includes('browse'))MOBILE_MORE_NAV.unshift('browse');
ICONS.browse='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/><path d="M7 10.5h7"/></svg>';
if(typeof v161NormalizeNavLayout==='function')S.navLayout=v161NormalizeNavLayout(S.navLayout);
if(typeof MFP408_TABS!=='undefined'&&Array.isArray(MFP408_TABS)){
 const x=MFP408_TABS.find(([id])=>id==='reviews');if(x)x[1]='Top';
 if(!MFP408_TABS.some(([id])=>id==='browse'))MFP408_TABS.splice(1,0,['browse','Browse']);
}
const lbOldCommunityTab=App.mfp408Tab;
App.mfp408Tab=function(tab){
 if(tab==='browse'||tab==='reviews'){LB413.scope=tab==='reviews'?'top':'titles';LB413.offset=0;S.view='browse';render();void lbLoad();return;}
 return lbOldCommunityTab(tab);
};
MediaFlowRuntime.registerPageRenderer('browse',lbPage);
MediaFlowRuntime.registerPageEnhancer('browse',()=>{if(!LB413.loading)void lbLoad();});
Object.assign(App,{lb413Tab:lbTab,lb413Search:lbSearch,lb413Page:lbPage,lb413Refresh:lbRefresh,
 lb413StartAdd:lbStartAdd,lb413CommitAdd:lbCommitAdd,lb413CloseAdd:lbCloseAdd});
window.MediaFlowPlusLiveBrowse413={release:413,canonical:true,refresh:lbLoad,scope:()=>LB413.scope};
})();
