/* MediaFlow Plus v412: Community Home, live verified-title Browse and Friends.
 * Canonical workspace is always read live. No imported/shadow Community catalog.
 */
const MF412_PORTAL={home:null,browse:null,friends:null,query:'',sort:'alpha',offset:0,request:0,timer:0,selected:null};
for(const [key,label] of [['home','Home'],['browse','Browse titles'],['friends','Friends']]){
 if(!MFP408_TABS.some(x=>x[0]===key))MFP408_TABS.splice(key==='home'?0:key==='browse'?2:4,0,[key,label]);
}
MFP408.tab='home';
function mf412Active(){return S.view==='community'&&['home','browse','friends'].includes(MFP408.tab);}
function mf412CollectionCard(c){
 const e=mfp408Esc;
 return '<article class="mf412c-card"><div class="mf412c-cover">'+(c.cover_url?'<img loading="lazy" alt="" src="'+e(c.cover_url)+'">':'<span>▤</span>')+'</div>'+
  '<div><small>LIVE COLLECTION · @'+e(c.username||'member')+'</small><h3>'+e(c.title)+'</h3><p>'+e(c.description||'A collection from this member’s workspace.')+'</p>'+
  '<span>'+Number(c.total||0).toLocaleString()+' live titles</span><div><button type="button" onclick="App.mfp412OpenPublicCollection(\''+e(c.owner_id)+'\',\''+e(c.id)+'\')">Explore collection →</button></div></div></article>';
}
function mf412HomeHtml(){
 const d=MF412_PORTAL.home||{collections:[],posts:[]},e=mfp408Esc;
 const cards=[['browse','Browse Titles','Discover verified titles'],['people','People','Explore public profiles'],['collections','Collections','Explore shared collections'],
  ['reviews','Ratings','Community recommendations'],['friends','Friends','Followers and mutuals'],['messages','Inbox','Message community members']];
 return '<section class="mf412c-home"><div class="mf412c-hero"><div><span class="mf412c-kicker">WELCOME TO THE COMMUNITY</span>'+
  '<h2>A world of stories, <em>shared together.</em></h2><p>Discover people, titles and collections from live MediaFlow Plus workspaces. Your personal Library remains yours.</p>'+
  '<div class="mf412c-actions"><button onclick="App.mfp408Tab(\'browse\')">Browse titles</button><button onclick="App.mfp408Tab(\'people\')">Explore people</button></div></div>'+
  '<div class="mf412c-hero-art"><span>MEDIAFLOW</span><b>COMMUNITY</b><small>LIVE EXPERIENCE</small></div></div>'+
  '<div class="mf412c-shortcuts">'+cards.map(c=>'<button onclick="App.mfp408Tab(\''+c[0]+'\')"><strong>'+c[1]+'</strong><small>'+c[2]+'</small></button>').join('')+'</div>'+
  '<div class="mf412c-split"><section><header><h3>Shared collections</h3><button onclick="App.mfp408Tab(\'collections\')">View more →</button></header>'+
  ((d.collections||[]).length?'<div class="mf412c-collection-list">'+d.collections.slice(0,6).map(mf412CollectionCard).join('')+'</div>':'<p class="mf412c-empty">No public collections yet. Enable Community sharing and publish one of your existing collections.</p>')+'</section>'+
  '<section><header><h3>Community updates</h3><button onclick="App.mfp408Tab(\'feed\')">Open feed →</button></header>'+
  ((d.posts||[]).length?(d.posts||[]).map(p=>'<article class="mf412c-post"><small>'+e(mfp408Name(p.user_id))+'</small><p>'+e(p.body)+'</p></article>').join(''):'<p class="mf412c-empty">No Community posts yet.</p>')+
  '</section></div></section>';
}
function mf412BrowseResults(d){
 const e=mfp408Esc,r=d?.titles||[],total=Number(d?.total||0);
 return '<p class="mf412c-subtext">'+total.toLocaleString()+' verified title results'+(d?.partial?' · Results are incomplete because the live scan reached its safety limit':'')+'</p>'+
  (r.length?'<div class="mf412c-titles">'+r.map(t=>'<article><div class="mf412c-poster">'+(t.cover_url?'<img loading="lazy" src="'+e(t.cover_url)+'" alt="">':'<span>MF+</span>')+'</div>'+
  '<div><h3>'+e(t.title)+'</h3><small>'+e(t.key)+'</small><p>In '+Number(t.owners_count)+' public '+(t.owners_count===1?'library':'libraries')+
  (t.average_rating!=null?' · ★ '+Number(t.average_rating).toFixed(2)+'/10':'')+'</p>'+
  '<div class="mf412c-actions"><button onclick="App.mf412QuickAdd(\''+e(t.key)+'\')">Quick add</button><button onclick="App.mfp412OpenPublicProfile(\''+e(t.username)+'\')">Creator</button></div></div></article>').join('')+'</div>':
  '<p class="mf412c-empty">No matching verified titles are currently shared. A public profile and explicit Library Browse opt-in are required.</p>')+
  '<div class="mf412c-actions">'+(MF412_PORTAL.offset>0?'<button onclick="App.mf412BrowsePage(-1)">← Previous</button>':'')+
  (total>MF412_PORTAL.offset+24?'<button onclick="App.mf412BrowsePage(1)">Next →</button>':'')+'</div>';
}
function mf412BrowseHtml(){
 const e=mfp408Esc;
 return '<section class="mf412c-page"><header class="mf412c-pagehead"><span class="mf412c-kicker">LIVE TITLE DISCOVERY</span><h2>Browse titles</h2>'+
  '<p>Explore verified MAL/SIMKL IDs from workspaces whose owners opted in. No copied title catalog.</p></header>'+
  '<div class="mf412c-filters"><label>Search<input type="search" id="mf412c-query" maxlength="120" placeholder="Search titles" value="'+e(MF412_PORTAL.query)+'" oninput="App.mf412BrowseSearch(this.value)"></label>'+
  '<label>Sort<select onchange="App.mf412BrowseSort(this.value)"><option value="alpha"'+(MF412_PORTAL.sort==='alpha'?' selected':'')+'>Alphabetical</option>'+
  '<option value="rated"'+(MF412_PORTAL.sort==='rated'?' selected':'')+'>Highest rated (live)</option></select></label></div>'+
  '<div id="mf412c-results">'+mf412BrowseResults(MF412_PORTAL.browse)+'</div></section>';
}
function mf412FriendsHtml(){
 const d=MF412_PORTAL.friends||{},e=mfp408Esc,tab=d.tab||'following',rows=d[tab]||[];
 return '<section class="mf412c-page"><header class="mf412c-pagehead"><span class="mf412c-kicker">YOUR COMMUNITY</span><h2>Friends</h2>'+
  '<p>Followers, following and mutuals — direct references, not profile copies.</p></header>'+
  '<nav class="mf412c-friendtabs">'+['following','followers','mutuals'].map(x=>'<button class="'+(tab===x?'selected':'')+'" onclick="App.mf412FriendsTab(\''+x+'\')">'+x+' ('+(d[x]||[]).length+')</button>').join('')+'</nav>'+
  (rows.length?'<div class="mf412c-friends">'+rows.map(p=>'<article><div class="mf412c-avatar">'+e((p.display_name||p.username||'?').slice(0,1).toUpperCase())+'</div>'+
  '<div><h3>'+e(p.display_name||p.username)+'</h3><small>@'+e(p.username)+'</small><p>'+e(p.bio||'')+'</p></div>'+
  '<div class="mf412c-actions"><button onclick="App.mfp412OpenPublicProfile(\''+e(p.username)+'\')">Profile</button>'+
  '<button onclick="App.mfp408MessageTo(\''+e(p.user_id)+'\')">Message</button></div></article>').join('')+'</div>':
  '<p class="mf412c-empty">No '+e(tab)+' connections to show.</p>')+
  '<div class="mf412c-actions"><button onclick="App.mfp408Tab(\'people\')">Discover people</button></div></section>';
}
const mf412OldRows=mfp408RenderRows;
mfp408RenderRows=function(){
 if(MFP408.tab==='home')return mf412HomeHtml();
 if(MFP408.tab==='browse')return mf412BrowseHtml();
 if(MFP408.tab==='friends')return mf412FriendsHtml();
 let html=mf412OldRows.apply(this,arguments);
 if(MFP408.tab==='profile')html+='<section class="mfp408-card mf412c-optin"><h3>Community Browse visibility</h3>'+
  '<p>Optional: share verified title names, covers and media IDs from your current Library. Your Library is never copied to a Community catalog. Requires an enabled public showcase. Ratings appear only with separate ratings permission.</p>'+
  '<label><input id="mf412c-optin" type="checkbox" '+(MFP408.profile?.show_library===true?'checked':'')+'> Let Community Browse read verified titles from my live Library</label>'+
  '<button onclick="App.mf412SaveBrowseVisibility()">Save visibility</button></section>';
 if(MFP408.tab==='collections')html+='<section class="mfp408-card"><h3>Published live workspace collections</h3><p>Only collections published by their owners appear below. No duplicated titles.</p>'+
  ((MF412_PORTAL.home?.collections||[]).length?(MF412_PORTAL.home.collections.map(mf412CollectionCard).join('')):'<p id="mf412c-collections-msg">Loading current shares…</p>')+'</section>';
 return html;
};
async function mf412Load(){
 if(S.view!=='community')return;
 const tab=MFP408.tab,id=++MF412_PORTAL.request;
 try{
  if(tab==='home'||tab==='collections'){
   const [directory,posts]=await Promise.all([
    mfp412PublicApi({type:'directory'}),
    tab==='home'?supabase.from('mfp_posts').select('user_id,body').order('created_at',{ascending:false}).limit(5):Promise.resolve({data:[],error:null})
   ]);
   if(posts.error)throw posts.error;
   MF412_PORTAL.home={collections:directory.collections||[],posts:posts.data||[]};
  }else if(tab==='browse'){
   MF412_PORTAL.browse=await mfp412PublicApi({type:'browse',query:MF412_PORTAL.query,sort:MF412_PORTAL.sort,offset:MF412_PORTAL.offset,limit:24});
  }else if(tab==='friends'){
   if(!AUTH_USER)throw Error('Sign in to see friends');
   const idUser=AUTH_USER.id;
   const [o,i]=await Promise.all([
    supabase.from('mfp_follows').select('following_id').eq('follower_id',idUser).limit(500),
    supabase.from('mfp_follows').select('follower_id').eq('following_id',idUser).limit(500)
   ]);
   if(o.error||i.error)throw o.error||i.error;
   const following=new Set((o.data||[]).map(x=>x.following_id)),followers=new Set((i.data||[]).map(x=>x.follower_id));
   const ids=[...new Set([...following,...followers])];
   let profiles=[];
   if(ids.length){
    const r=await supabase.from('mfp_profiles').select('user_id,username,display_name,bio').in('user_id',ids).eq('is_public',true).limit(500);
    if(r.error)throw r.error;profiles=r.data||[];
   }
   MF412_PORTAL.friends={tab:MF412_PORTAL.friends?.tab||'following',
    following:profiles.filter(x=>following.has(x.user_id)),
    followers:profiles.filter(x=>followers.has(x.user_id)),
    mutuals:profiles.filter(x=>following.has(x.user_id)&&followers.has(x.user_id))};
  }else return;
  if(id!==MF412_PORTAL.request||S.view!=='community'||tab!==MFP408.tab)return;
  const root=document.getElementById('mfp408-content');if(root)root.innerHTML=mfp408RenderRows();
 }catch(err){
  if(id!==MF412_PORTAL.request||tab!==MFP408.tab)return;
  const root=document.getElementById('mfp408-content');
  if(root)root.innerHTML='<div class="mfp408-card" role="alert"><h3>Community unavailable</h3><p>'+mfp408Esc(err?.message||'Could not load')+
   '</p><button onclick="App.mf412Load()">Retry</button></div>';
 }
}
function mf412BrowseSearch(q){
 MF412_PORTAL.query=String(q||'').slice(0,120);MF412_PORTAL.offset=0;
 clearTimeout(MF412_PORTAL.timer);
 MF412_PORTAL.timer=setTimeout(()=>{const input=document.getElementById('mf412c-query'),pos=input?.selectionStart;
  void mf412Load().then(()=>{const next=document.getElementById('mf412c-query');if(next){next.focus();try{next.setSelectionRange(pos,pos);}catch(_){}}});
 },350);
}
function mf412BrowseSort(s){MF412_PORTAL.sort=s==='rated'?'rated':'alpha';MF412_PORTAL.offset=0;void mf412Load();}
function mf412BrowsePage(delta){MF412_PORTAL.offset=Math.max(0,MF412_PORTAL.offset+delta*24);void mf412Load();}
function mf412FriendsTab(t){if(!['following','followers','mutuals'].includes(t)||!MF412_PORTAL.friends)return;MF412_PORTAL.friends.tab=t;
 const root=document.getElementById('mfp408-content');if(root)root.innerHTML=mf412FriendsHtml();}
async function mf412SaveBrowseVisibility(){
 if(!AUTH_USER)return showToast('Please sign in.');
 const el=document.getElementById('mf412c-optin');if(!el)return;
 const visible=!!el.checked;
 if(visible&&!confirm('Make your verified-ID Library title names and covers publicly visible in Community Browse?')){el.checked=false;return;}
 const r=await supabase.from('mfp_profiles').update({show_library:visible}).eq('user_id',AUTH_USER.id);
 if(r.error)return showToast('Could not update visibility: '+r.error.message);
 if(MFP408.profile)MFP408.profile.show_library=visible;
 showToast(visible?'Live Browse enabled ✓':'Live Browse disabled ✓');
}
function mf412QuickAdd(key){
 if(!AUTH_USER)return showToast('Sign in first.');
 const t=(MF412_PORTAL.browse?.titles||[]).find(x=>x.key===key),cats=(S.categories||[]).filter(x=>x?.id);
 if(!t||!cats.length)return showToast('Create a Library category first.');
 const e=mfp408Esc;MF412_PORTAL.selected=t;
 document.getElementById('mf412c-add')?.remove();
 const div=document.createElement('div');div.className='mf412-share-dialog';div.id='mf412c-add';
 div.innerHTML='<section class="mf412-public-panel"><button class="mf412-public-close" onclick="document.getElementById(\'mf412c-add\').remove()">Close ×</button>'+
  '<h2>Quick add</h2><p>'+e(t.title)+'</p><p>Create a new title in your own Library? The original owner’s data stays untouched.</p>'+
  '<label>Category<select id="mf412c-cat">'+cats.map(x=>'<option value="'+e(x.id)+'">'+e(x.name)+'</option>').join('')+'</select></label>'+
  '<button onclick="App.mf412ConfirmAdd()">Add to my Library</button></section>';document.body.append(div);
}
async function mf412ConfirmAdd(){
 const t=MF412_PORTAL.selected,c=document.getElementById('mf412c-cat')?.value;
 if(!t||!AUTH_USER||!(S.categories||[]).some(x=>String(x.id)===c))return;
 if((S.library||[]).some(x=>String(x.title||'').toLowerCase()===t.title.toLowerCase()||
   (t.mal_id&&String(x.malId||'')===t.mal_id)||(t.simkl_id&&String(x.simklId||'')===t.simkl_id)))
  return showToast('Already in your Library.');
 const now=Date.now(),record={id:uid(),title:t.title,categoryId:c,coverUrl:t.cover_url||'',malId:t.mal_id||null,simklId:t.simkl_id||null,
  status:'planned',priority:'medium',progress:0,total:null,createdAt:now,modifiedAt:now};
 S.library.push(record);
 try{await saveState();if(typeof v53InvalidateLibraryCache==='function')v53InvalidateLibraryCache();
  document.getElementById('mf412c-add')?.remove();MF412_PORTAL.selected=null;showToast('Added to your Library ✓');
 }catch(err){S.library=S.library.filter(x=>x!==record);showToast('Save failed: '+(err?.message||err));}
}
MediaFlowRuntime.registerPageEnhancer('community',()=>{if(['home','browse','friends','collections'].includes(MFP408.tab))void mf412Load();});
Object.assign(App,{mf412Load,mf412BrowseSearch,mf412BrowseSort,mf412BrowsePage,mf412FriendsTab,mf412SaveBrowseVisibility,mf412QuickAdd,mf412ConfirmAdd});
