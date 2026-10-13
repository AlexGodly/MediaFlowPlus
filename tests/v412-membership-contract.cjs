/* v412 membership filters — synthetic, no live account or database. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('src/js/components/301-v412-membership-filters.js','utf8');
const rows=[{id:'a'},{id:'b'},{id:'c'}];
const calls={picker:0,collections:0,logging:0};
const ctx={
 Set,console,
 S:{logDraft:{entries:[{libraryId:'b'}]},orderPlan:{titleIds:['a']},orderPlannerUI:{v412Show:'all'}},
 V89_LOG:{page:4},
 App:{v224LogClearFilters(){},v354OpenSheet(){return 'opened';}},
 v287Assignments:()=>[{collectionId:'c'}],
 v287CollectionMatches:()=>rows,
 v358CollectionControlsHtml:()=>'<div class="mf354-collection-picker-controls mf358-filters-grid"></div>',
 logTitleCandidates:()=>rows,
 v224LogToolsHtml:()=>'<div class="v224-log-tools"></div>',
 v140EnsureOrderPickerUI:()=>ctx.S.orderPlannerUI,
 v138RefreshPickerDOM:()=>{calls.picker++},
 v287RefreshCollectionPicker:()=>{calls.collections++},
 renderLogSuggestions:()=>{calls.logging++},
 document:{querySelector:()=>null},
 window:{}
};
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:'301-v412-membership-filters.js'});
const ids=a=>Array.from(a,x=>x.id).join(',');
assert.equal(ids(ctx.mfp412FilterByMembership(rows,'all',new Set(['b']))),'a,b,c');
assert.equal(ids(ctx.mfp412FilterByMembership(rows,'already-added',new Set(['b']))),'b');
assert.equal(ids(ctx.mfp412FilterByMembership(rows,'not-added',new Set(['b']))),'a,c');
assert.equal(ctx.mfp412Mode('bogus'),'all');
ctx.App.v412SetMembership('collections','already-added');
assert.equal(ids(ctx.v287CollectionMatches()),'c');
ctx.App.v412SetMembership('collections','not-added');
assert.equal(ids(ctx.v287CollectionMatches()),'a,b');
ctx.App.v412SetMembership('logging','already-added');
assert.equal(ids(ctx.logTitleCandidates('')),'b');
assert.equal(ctx.V89_LOG.page,0);
ctx.S.logDraft.entries.push({libraryId:'a'});
assert.equal(ids(ctx.logTitleCandidates('')),'a,b','logging membership must update from live draft');
ctx.App.v412SetMembership('logging','not-added');
assert.equal(ids(ctx.logTitleCandidates('')),'c');
assert.equal(ctx.window.MediaFlowPlusMembershipFilters.membershipCount('titles'),1);
assert.equal(ctx.window.MediaFlowPlusMembershipFilters.membershipCount('collections'),1);
assert.equal(ctx.window.MediaFlowPlusMembershipFilters.membershipCount('logging'),2);
ctx.App.v224LogClearFilters();
assert.equal(ctx.window.MediaFlowPlusMembershipFilters.get('logging'),'all');
assert.equal(rows.length,3,'filtering must never mutate the canonical rows');
assert.equal(ctx.S.logDraft.entries.length,2,'filtering must never mutate logging drafts');
assert(calls.collections>=2&&calls.logging>=2);
const many=Array.from({length:100000},(_,i)=>({id:String(i)}));
const members=new Set(['0','99999']);
assert.equal(ctx.mfp412FilterByMembership(many,'already-added',members).length,2);
assert.equal(ctx.mfp412FilterByMembership(many,'not-added',members).length,99998);
console.log('v412 membership filters: canonical membership, live draft, picker scopes, nonmutation, 100k rows PASS');
