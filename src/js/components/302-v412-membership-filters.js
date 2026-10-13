/* MediaFlow Plus v412 (WIP) — consistent per-target Show membership filters.
 * Filtering is ephemeral; Personal Order, Collections and Logging draft are
 * never mutated by switching the Show value.
 */
const MFP412_SHOW={titles:'all',collections:'all',logging:'all'};
function mfp412ShowField(kind,label){
 const current=MFP412_SHOW[kind]||'all';
 const name=label==='collections'?'collections':'titles';
 const options=[['all','All '+name],['notadded','Not added'],['added','Already added']];
 return '<label class="mfp412-show-field"><span>Show</span><select aria-label="Show '+name+' by membership" onchange="App.mfp412Membership(\''+kind+'\',this.value)">'+
   options.map(([value,text])=>'<option value="'+value+'" '+(current===value?'selected':'')+'>'+text+'</option>').join('')+
   '</select></label>';
}
function mfp412Membership(kind,value){
 if(!Object.prototype.hasOwnProperty.call(MFP412_SHOW,kind))return;
 const v=['all','notadded','added'].includes(value)?value:'all';
 MFP412_SHOW[kind]=v;
 if(kind==='titles'){
  v140EnsureOrderPickerUI().v412Show=v;
  const ui=v140EnsureOrderPickerUI();ui.page=0;
  if(typeof v141InvalidateOrderPickerCache==='function')v141InvalidateOrderPickerCache();
  v138RefreshPickerDOM();
 }else if(kind==='collections'){
  const ui=v287OrderUI();ui.v287CollectionPage=0;
  v287RefreshCollectionPicker();
 }else{
  V89_LOG.page=0;
  renderLogSuggestions();
 }
}
// Late interception: earlier releases replace the Personal Order candidate
// function, so ensure membership is applied after *all* legacy overrides.
const mfp412OrderCandidatesBase=v138PickerMatches;
v138PickerMatches=function(){
 const rows=mfp412OrderCandidatesBase.apply(this,arguments);
 const mode=v140EnsureOrderPickerUI().v412Show||MFP412_SHOW.titles;
 if(mode==='all')return rows;
 const assigned=new Set(v138EnsureOrderPlan().titleIds.map(String));
 return rows.filter(i=>mode==='added'?assigned.has(String(i.id)):!assigned.has(String(i.id)));
};
const mfp412OrderToolsBase=v140OrderPickerToolsHtml;
v140OrderPickerToolsHtml=function(){
 const html=String(mfp412OrderToolsBase.apply(this,arguments)||'');
 if(html.includes('mfp412-show-field'))return html;
 return html.replace('<div class="v140-order-filterbar">','<div class="v140-order-filterbar">'+mfp412ShowField('titles','titles'));
};
const mfp412CollectionMatchesBase=v287CollectionMatches;
v287CollectionMatches=function(){
 const rows=mfp412CollectionMatchesBase.apply(this,arguments);
 const mode=MFP412_SHOW.collections;
 if(mode==='all')return rows;
 // Personal Order membership is global across queue categories, never merely
 // the current category's membership.
 const assigned=new Set(v287Assignments().map(a=>String(a.collectionId)));
 return rows.filter(c=>mode==='added'?assigned.has(String(c.id)):!assigned.has(String(c.id)));
};
const mfp412CollectionToolsBase=v358CollectionControlsHtml;
v358CollectionControlsHtml=function(){
 const html=String(mfp412CollectionToolsBase.apply(this,arguments)||'');
 if(html.includes('mfp412-show-field'))return html;
 const anchor='<div class="mf354-collection-picker-controls mf358-filters-grid">';
 return html.replace(anchor,anchor+mfp412ShowField('collections','collections'));
};
const mfp412LogCandidatesBase=logTitleCandidates;
logTitleCandidates=function(){
 const rows=mfp412LogCandidatesBase.apply(this,arguments);
 const mode=MFP412_SHOW.logging;
 if(mode==='all')return rows;
 const assigned=v378AddedIds(); // current Logging draft's Library IDs, not main Library.
 return rows.filter(item=>mode==='added'?assigned.has(String(item.id)):!assigned.has(String(item.id)));
};
const mfp412LogToolsBase=v224LogToolsHtml;
v224LogToolsHtml=function(){
 const html=String(mfp412LogToolsBase.apply(this,arguments)||'');
 if(html.includes('mfp412-show-field'))return html;
 const idx=html.indexOf('>');
 return idx>=0?html.slice(0,idx+1)+mfp412ShowField('logging','titles')+html.slice(idx+1):html;
};
// Reset the Show control when opening each picker, not the user's selections.
const mfp412SheetBase=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
 if(kind==='title'||kind==='collection'){
  MFP412_SHOW[kind==='title'?'titles':'collections']='all';
  if(kind==='title')v140EnsureOrderPickerUI().v412Show='all';
 }
 return mfp412SheetBase.apply(this,arguments);
};
const mfp412OpenLoggingBase=App.openLogForm;
App.openLogForm=function(){
 MFP412_SHOW.logging='all';
 return mfp412OpenLoggingBase.apply(this,arguments);
};
Object.assign(App,{mfp412Membership});
window.MediaFlowPlusShowFilters={
 version:412,
 get:()=>({...MFP412_SHOW}),
 counts:()=>{
  const orderIds=new Set((S.orderPlan?.titleIds||[]).map(String));
  const assigned=new Set(v287Assignments().map(x=>String(x.collectionId)));
  const log=v378AddedIds();
  return {titles:{all:(S.library||[]).length,added:orderIds.size},
   collections:{all:v287Collections().length,added:assigned.size},
   logging:{all:(S.library||[]).length,added:log.size}};
 }
};
