/* v412: menu contract and route integrity; synthetic, no backend credentials. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const source=fs.readFileSync('src/js/components/306-v412-workspace-community-navigation.js','utf8');
new vm.Script(source,{filename:'306-v412-workspace-community-navigation.js'});
const runtime=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(runtime.includes('components/306-v412-workspace-community-navigation.js'));
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('304-v412-workspace-community-navigation.css'));
for(const fragment of ["['home','Home'","['browse','Browse Titles'","['collections','Community Collections'","['top','Top Titles'","['people','People'",
 "['friends','Friends'","['messages','Inbox'","['notifications','Notifications'","['profile','Public Profile'",
 'mfp412GoWorkspace','mfp412Navigate','mfp412NavSync','mfp412ToggleCommunity','mfp412MobileCommunity',
 'mfp412NavSettings','v161NavigationSettingsHtml','v265RefreshSidebarNav','renderMobileTabs=function']){
 assert(source.includes(fragment),'Missing nav feature '+fragment);
}
assert(source.includes("if(page==='messages')"),'Inbox destination must use canonical Inbox');
assert(source.includes("App.setView('dashboard')"),'Workspace destination must point at personal Dashboard');
assert(source.includes("renderView()"),'Community destinations must render the selected page');
assert(!source.includes('mfp412CopyCollection('),'Menu must not duplicate data');
console.log('v412 Workspace/Community grouped desktop/mobile navigation contracts passed');
