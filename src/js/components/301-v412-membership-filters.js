/* MediaFlow Plus v412 — membership-only organization filters.
 * All three scopes are presentation filters, not mutation operations.
 * Membership is always read from the destination's current canonical state.
 */
const MFP412_SHOW_OPTIONS=new Set(['all','not-added','already-added']);
const MFP412_FILTER_STATE={collections:'all',logging:'all'};
function mfp412Mode(value){return MFP412_SHOW_OPTIONS.has(value)?value:'all';}
function mfp412FilterHtml(scope,value){
 const type=scope==='collections'?'collections':'titles';
 return '<label class="mf412-show-filter" data-mf412-scope="'+scope+'">'+
  '<span>Show '+type+'</span><select aria-label="Show '+type+' by membership" onchange="App.v412SetMembership(\''+scope+'\',this.value)">'+
  '<option value="all"'+(value==='all'?' selected':'')+'>All '+type+'</option>'+
  '<option value="not-added"'+(value==='not-added'?' selected':'')+'>Not added</option>'+
  '<option value="already-added"'+(value==='already-added'?' selected':'')+'>Already added</option>'+
  '</select></label>';
}
function mfp412LogMembership(){
 // An unsaved logging draft is the destination. Never interpret the main
 // Library's existence as membership in this logging list.
 return new Set((S.logDraft?.entries||[]).map(e=>String(e?.libraryId||'')).filter(Boolean));
}
function mfp412CollectionMembership(){
 // A Collection assigned under ANY task category already belongs to
 // Personal Order; simply existing in My Collections does not count.
 return new Set((v287Assignments()||[]).map(a=>String(a?.collectionId||'')).filter(Boolean));
}
function mfp412FilterByMembership(rows,mode,ids){
 if(mode==='all')return rows;
 const already=mode==='already-added';
 return rows.filter(row=>ids.has(String(row?.id||''))===already);
}
function v412SetMembership(scope,raw){
 const value=mfp412Mode(raw);
 if(scope==='titles'){
  const ui=v140EnsureOrderPickerUI();
  ui.v412Show=value;ui.page=0;
  v138RefreshPickerDOM();
 }else if(scope==='collections'){
  MFP412_FILTER_STATE.collections=value;
  v287RefreshCollectionPicker();
 }else if(scope==='logging'){
  MFP412_FILTER_STATE.logging=value;
  V89_LOG.page=0;
  renderLogSuggestions();
 }
}
const mfp412CollectionsBase=v287CollectionMatches;
v287CollectionMatches=function(){
 const rows=mfp412CollectionsBase.apply(this,arguments);
 if(MFP412_FILTER_STATE.collections==='all')return rows;
 return mfp412FilterByMembership(rows,MFP412_FILTER_STATE.collections,mfp412CollectionMembership());
};
const mfp412CollectionsToolsBase=v358CollectionControlsHtml;
v358CollectionControlsHtml=function(){
 const markup=mfp412CollectionsToolsBase.apply(this,arguments);
 const anchor='<div class="mf354-collection-picker-controls mf358-filters-grid">';
 return markup.replace(anchor,anchor+mfp412FilterHtml('collections',MFP412_FILTER_STATE.collections));
};
const mfp412LogCandidatesBase=logTitleCandidates;
logTitleCandidates=function(query){
 const rows=mfp412LogCandidatesBase.apply(this,arguments);
 if(MFP412_FILTER_STATE.logging==='all'||!Array.isArray(rows))return rows;
 return mfp412FilterByMembership(rows,MFP412_FILTER_STATE.logging,mfp412LogMembership());
};
const mfp412LogToolsBase=v224LogToolsHtml;
v224LogToolsHtml=function(){
 const markup=String(mfp412LogToolsBase.apply(this,arguments)||'');
 return markup.replace(/(<div class="[^"]*v224-log-tools[^"]*"[^>]*>)/,
  (_,head)=>head+mfp412FilterHtml('logging',MFP412_FILTER_STATE.logging));
};
const mfp412LogClearBase=App.v224LogClearFilters;
App.v224LogClearFilters=function(){
 MFP412_FILTER_STATE.logging='all';
 return mfp412LogClearBase.apply(this,arguments);
};
const mfp412OpenSheetBase=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
 // Fresh picker sessions start on All. Do not reset picks, assignments or draft.
 if(kind==='title')v140EnsureOrderPickerUI().v412Show='all';
 if(kind==='collection')MFP412_FILTER_STATE.collections='all';
 const result=mfp412OpenSheetBase.apply(this,arguments);
 if(kind==='title'){
  const select=document.querySelector('.mf354-sheet-backdrop .mf412-show-filter select');
  if(select)select.value='all';
  v138RefreshPickerDOM();
 }
 if(kind==='collection'){
  const select=document.querySelector('.mf354-sheet-backdrop .mf412-show-filter select');
  if(select)select.value='all';
  v287RefreshCollectionPicker();
 }
 return result;
};
App.v412SetMembership=v412SetMembership;
window.MediaFlowPlusMembershipFilters={
 modes:['all','not-added','already-added'],
 get(scope){return scope==='titles'?mfp412Mode(S.orderPlannerUI?.v412Show):MFP412_FILTER_STATE[scope]||'all';},
 membershipCount(scope){return scope==='titles'?new Set((S.orderPlan?.titleIds||[]).map(String)).size:
  scope==='collections'?mfp412CollectionMembership().size:mfp412LogMembership().size;}
};
