/* MediaFlow Plus v412 — membership filters, non-mutating and live.
 * v392 already renders assigned titles/collections as disabled Add rows.
 * This module filters the canonical candidate arrays without changing membership.
 */
(function(){
'use strict';
const MF412_SHOW_VALUES=new Set(['all','not','added']);
let MF412_TITLE_SHOW='all',MF412_COLLECTION_SHOW='all';
function mf412SetMembership(kind,value){
 const mode=MF412_SHOW_VALUES.has(value)?value:'all';
 if(kind==='titles'){
  MF412_TITLE_SHOW=mode;
  const ui=v140EnsureOrderPickerUI();ui.page=0;
  try{v141InvalidateOrderPickerCache()}catch(_){}
  if(typeof v141RefreshOrderPickerAll==='function')v141RefreshOrderPickerAll();
  else renderView();
 }else if(kind==='collections'){
  MF412_COLLECTION_SHOW=mode;
  const ui=v287OrderUI();ui.v359CollectionPage=0;
  if(typeof v287RefreshCollectionPicker==='function')v287RefreshCollectionPicker();
 }
}
function mf412ShowControl(kind,value){
 const collection=kind==='collections';
 return '<label class="mf412-show-control"><span>SHOW '+(collection?'COLLECTIONS':'TITLES')+'</span><select aria-label="Show '+(collection?'collections':'titles')+' by membership" onchange="App.mf412SetMembership(\''+kind+'\',this.value)">'+
 [['all',collection?'All collections':'All titles'],['not','Not added'],['added','Already added']].map(([id,label])=>'<option value="'+id+'" '+(id===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label>';
}
const mf412TitleMatchesBase=v138PickerMatches;
v138PickerMatches=function(){
 const rows=mf412TitleMatchesBase.apply(this,arguments);
 if(MF412_TITLE_SHOW==='all')return rows;
 const ids=new Set((v138EnsureOrderPlan().titleIds||[]).map(String));
 return rows.filter(x=>ids.has(String(x.id))===(MF412_TITLE_SHOW==='added'));
};
const mf412TitleToolsBase=v140OrderPickerToolsHtml;
v140OrderPickerToolsHtml=function(){
 const raw=String(mf412TitleToolsBase.apply(this,arguments));
 const holder=document.createElement('div');holder.innerHTML=raw;
 const bar=holder.querySelector('.v140-order-filterbar')||holder.firstElementChild;
 if(bar&&!bar.querySelector('.mf412-show-control'))bar.insertAdjacentHTML('afterbegin',mf412ShowControl('titles',MF412_TITLE_SHOW));
 return holder.innerHTML;
};
const mf412CollectionMatchesBase=v287CollectionMatches;
v287CollectionMatches=function(){
 const rows=mf412CollectionMatchesBase.apply(this,arguments);
 if(MF412_COLLECTION_SHOW==='all')return rows;
 const cid=String(v287OrderUI().v287CollectionCategoryId||'');
 const assigned=new Set(v287Assignments(cid).map(x=>String(x.collectionId)));
 return rows.filter(x=>assigned.has(String(x.id))===(MF412_COLLECTION_SHOW==='added'));
};
const mf412CollectionPickerHtmlBase=v287CollectionPickerHtml;
v287CollectionPickerHtml=function(){
 const raw=String(mf412CollectionPickerHtmlBase.apply(this,arguments));
 const holder=document.createElement('div');holder.innerHTML=raw;
 const filters=holder.querySelector('.mf358-collection-filters,.mf356-collection-filters,.mf287-add-collection-card')||holder.firstElementChild;
 if(filters&&!filters.querySelector('.mf412-show-control'))filters.insertAdjacentHTML('afterbegin',mf412ShowControl('collections',MF412_COLLECTION_SHOW));
 return holder.innerHTML;
};
const mf412AddOrderTitleBase=App.v392AddOrderTitle;
if(typeof mf412AddOrderTitleBase==='function')App.v392AddOrderTitle=function(){
 const output=mf412AddOrderTitleBase.apply(this,arguments);
 if(MF412_TITLE_SHOW!=='all')v141RefreshOrderPickerPageOnly();
 return output;
};
App.mf412SetMembership=mf412SetMembership;
window.MediaFlowPlusMembershipFilters={version:412,set:mf412SetMembership,get:()=>({titles:MF412_TITLE_SHOW,collections:MF412_COLLECTION_SHOW})};
})();
