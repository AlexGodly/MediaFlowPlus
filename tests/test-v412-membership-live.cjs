/* MediaFlow Plus v412: live destination-membership regression.
 * Uses the actual production component with synthetic, isolated account state.
 * No network, database, DOM, or user data is required.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/js/components/301-v412-membership-filters.js','utf8');
const picker={page:4,v412Show:'all'};
const S={
 orderPlannerUI:picker,
 orderPlan:{titleIds:['a','c']},
 logDraft:{entries:[{libraryId:'b'}]},
 library:[{id:'a'},{id:'b'},{id:'c'}]
};
let assignments=[{collectionId:'c1'}];
const collections=[{id:'c1'},{id:'c2'},{id:'c3'}];
const titles=[{id:'a'},{id:'b'},{id:'c'}];
let pickerRenders=0,collectionRenders=0,logRenders=0;
const context=vm.createContext({
 S,V89_LOG:{page:5},window:{},document:{querySelector:()=>null},
 App:{
  v224LogClearFilters(){return true;},
  v354OpenSheet(){return true;}
 },
 v287Assignments:()=>assignments,
 v287CollectionMatches:()=>collections,
 v358CollectionControlsHtml:()=>'<div class="mf354-collection-picker-controls mf358-filters-grid"></div>',
 logTitleCandidates:()=>titles,
 v224LogToolsHtml:()=>'<div class="v224-log-tools"></div>',
 v140EnsureOrderPickerUI:()=>picker,
 v138RefreshPickerDOM:()=>{pickerRenders++;},
 v287RefreshCollectionPicker:()=>{collectionRenders++;},
 renderLogSuggestions:()=>{logRenders++;}
});
new vm.Script(source,{filename:'301-v412-membership-filters.js'}).runInContext(context);
const plain=rows=>Array.from(rows,x=>x.id);
const snapshot=JSON.stringify(S);
const collectionSnapshot=JSON.stringify(collections);
const titleSnapshot=JSON.stringify(titles);
const api=context.window.MediaFlowPlusMembershipFilters;
assert.deepEqual(Array.from(api.modes),['all','not-added','already-added']);

context.App.v412SetMembership('collections','already-added');
assert.deepEqual(plain(context.v287CollectionMatches()),['c1']);
context.App.v412SetMembership('collections','not-added');
assert.deepEqual(plain(context.v287CollectionMatches()),['c2','c3']);
assignments.push({collectionId:'c3'});
assert.deepEqual(plain(context.v287CollectionMatches()),['c2'],
 'Collection membership must reflect changes without stale snapshots');
context.App.v412SetMembership('collections','unexpected');
assert.deepEqual(plain(context.v287CollectionMatches()),['c1','c2','c3'],
 'Invalid filter modes must safely fall back to All');

context.App.v412SetMembership('logging','already-added');
assert.deepEqual(plain(context.logTitleCandidates('')),['b'],
 'Logging membership is the active draft, not the main Library');
S.logDraft.entries.push({libraryId:'c'});
assert.deepEqual(plain(context.logTitleCandidates('')),['b','c'],
 'Logging membership must update live');
context.App.v412SetMembership('logging','not-added');
assert.deepEqual(plain(context.logTitleCandidates('')),['a']);
context.App.v224LogClearFilters();
assert.equal(api.get('logging'),'all');
assert.equal(context.V89_LOG.page,0);

context.App.v412SetMembership('titles','already-added');
assert.equal(picker.v412Show,'already-added');
assert.equal(picker.page,0);
assert.equal(api.membershipCount('titles'),2);
assert.equal(api.membershipCount('collections'),2);
assert.equal(api.membershipCount('logging'),2);
assert.ok(pickerRenders>0&&collectionRenders>0&&logRenders>0);

assert.equal(JSON.stringify(S.orderPlan),JSON.stringify({titleIds:['a','c']}));
assert.equal(JSON.stringify(S.library),JSON.stringify([{id:'a'},{id:'b'},{id:'c'}]));
assert.equal(JSON.stringify(collections),collectionSnapshot);
assert.equal(JSON.stringify(titles),titleSnapshot);
assert.notEqual(JSON.stringify(S),snapshot,'Synthetic membership additions should change draft only');

const large=Array.from({length:100000},(_,id)=>({id:String(id)}));
const selected=new Set(['0','50000','99999']);
const matches=vm.runInContext('mfp412FilterByMembership',context)(large,'already-added',selected);
assert.deepEqual(plain(matches),['0','50000','99999']);
assert.equal(vm.runInContext('mfp412FilterByMembership',context)(large,'not-added',selected).length,99997);
assert.equal(large.length,100000,'Filtering must never remove or mutate source titles');
console.log('v412 membership: Personal Order, Collections, Logging, live changes, invalid modes, nonmutation, 100k rows — PASSED');
