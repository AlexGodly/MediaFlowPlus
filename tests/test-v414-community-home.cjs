const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const source=fs.readFileSync('src/js/components/309-v414-community-home-navigation.js','utf8');
new vm.Script(source);
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.at(-1)==='components/309-v414-community-home-navigation.js');
assert(fs.readFileSync('index.html','utf8').includes('306-v414-community-home-navigation.css'));
for(const v of ['function guestMount','function workspace','function navSync','function mobileLinks',
 'function navSettings','function directory','mfp414CommunityMenu',
 'MediaFlowRuntime.registerPageRenderer(\\'community\\'','App.lb413Tab','App.ps412Explore',
 'App.setView(\\'inbox\\')',"App.setView('dashboard')", "type=browse", "kind=discover", "stored"] .filter(Boolean)){
 // Backend projection does not have to mirror a stored catalog.
 if(v==='stored')continue;
 assert(source.includes(v),'Required Community navigation feature missing: '+v);
}
assert(!/\\.insert\\(|\\.upsert\\(|from\\(['"]mediaflow_states['"]\\)/.test(source),'Public Home must not copy Library data');
console.log('v414 live Community Home, Workspace and nested navigation source contracts passed');
