const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const site=fs.readFileSync('src/js/components/307-v412-public-community-home.js','utf8');
new vm.Script(site,{filename:'307-v412-public-community-home.js'});
assert(JSON.parse(fs.readFileSync('src/js/runtime-order.json')).includes('components/307-v412-public-community-home.js'));
assert(fs.readFileSync('index.html','utf8').includes('305-v412-public-community-home.css'));
for(const s of ['#/community/','mf412GuestFrame','mf412GuestWorkspace','mf412GuestRoute',
 'mf412GuestLoad','mf412AuthExploreLink','mfp412PublicApi','type:\\x27directory\\x27',
 'type:\\x27browse\\x27',"App.setView('dashboard')"])
 assert(site.includes(s),'Expected Public Home routing behavior: '+s);
assert(!site.includes('S.library'),'Guest homepage must never read raw user Library');
const share=fs.readFileSync('src/js/components/303-v412-live-community.js','utf8');
assert(share.includes("hash.startsWith('#/community')"),'Other hashchange router must leave Community guest route intact');
console.log('v412 public Community Home / private Workspace navigation contracts passed');
