const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const ui=fs.readFileSync('src/js/components/305-v412-live-public-pages.js','utf8');
const edge=fs.readFileSync('supabase/functions/mediaflow-plus-public-workspace/index.ts','utf8');
new vm.Script(ui);
new vm.Script(edge.replace(/^import .*;$/gm,''));
assert(JSON.parse(fs.readFileSync('src/js/runtime-order.json')).includes('components/305-v412-live-public-pages.js'));
for(const key of ['show_library','show_history','show_personal_order','show_old_system','show_statistics','show_ratings','show_levels'])
 assert(edge.includes(key),'Missing explicit privacy flag '+key);
assert(edge.includes('if(!v.data||p.data[flag]!==true)'));
assert(edge.includes('source:"live_owner_workspace",stored_public_copy:false'));
for(const key of ['mf412PublicTab','mf412SaveSections','mf412TopLoad','mf412TopHtml'])assert(ui.includes(key));
console.log('v412 live profile sections and Top source/permission contracts passed');
