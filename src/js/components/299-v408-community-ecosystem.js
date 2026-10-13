/* MediaFlow Plus v408 — Community Ecosystem. No personal library data is published automatically. */
const MFP408={tab:'feed',busy:false,profile:null,rows:[],profiles:[],likes:new Set(),comments:{},target:null,search:'',page:0,limit:12,unread:0};
const MFP408_TABS=[['feed','Feed'],['people','People'],['collections','Collections'],['reviews','Reviews & Top'],['messages','Messages'],['notifications','Alerts'],['profile','My profile']];
const mfp408Esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mfp408Name=id=>{let p=MFP408.profiles.find(x=>x.user_id===id);return p?('@'+p.username):'Community member'};
const mfp408Error=e=>{console.error('MediaFlow Plus Community',e);mfp408Notice(e?.message||String(e),true)};
function mfp408Notice(msg,error=false){const el=document.getElementById('mfp408-notice');if(el){el.textContent=msg;el.classList.toggle('error',error);}}
function mfp408SafeURL(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:''}catch(_){return ''}}
function mfp408Nav(){
 if(!NAV_ITEMS.some(n=>n.id==='community'))NAV_ITEMS.splice(Math.max(0,NAV_ITEMS.length-2),0,{id:'community',label:'Community'});
 if(!MOBILE_MORE_NAV.includes('community'))MOBILE_MORE_NAV.unshift('community');
 // Re-normalize the persisted navigation layout so existing accounts can see the new page.
 if(typeof v161NormalizeNavLayout==='function')S.navLayout=v161NormalizeNavLayout(S.navLayout);
 ICONS.community='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20v-2a6 6 0 0 1 12 0v2M15 15a5 5 0 0 1 7 5"/></svg>';
}
mfp408Nav();
function mfp408Renderer(){
 return '<div class="mfp408"><header class="mfp408-hero"><div><span class="mfp408-kicker">MEDIAFLOW PLUS</span><h1>Community</h1><p>Discover people, share what you love, and find your next favorite.</p></div><span class="mfp408-pill">Public edition</span></header><nav class="mfp408-tabs" aria-label="Community sections">'+MFP408_TABS.map(([k,n])=>'<button type="button" class="'+(MFP408.tab===k?'selected':'')+'" onclick="App.mfp408Tab(\''+k+'\')">'+n+'</button>').join('')+'</nav><div id="mfp408-notice" role="status" aria-live="polite"></div><main id="mfp408-content" aria-live="polite"><p class="mfp408-muted">Loading community…</p></main></div>';
}
function mfp408RenderRows(){
 const r=MFP408.rows,me=AUTH_USER?.id,esc=mfp408Esc;
 const top='<div class="mfp408-heading"><h2>'+({'feed':'Community feed','people':'Discover people','collections':'Shared collections','reviews':'Reviews and community ratings','messages':'Direct messages','notifications':'Notifications','profile':'Public profile'}[MFP408.tab]||'Community')+'</h2><span>'+r.length+' results</span></div>';
 let html='';
 if(MFP408.tab==='profile'){
  const p=MFP408.profile;
  html='<div class="mfp408-card"><h3>Your community identity</h3><p class="mfp408-muted">Your library stays private. Only what you explicitly share appears here.</p><form onsubmit="return App.mfp408SaveProfile(event)"><label>Username<input name="username" required minlength="3" maxlength="24" pattern="[a-z0-9_]+" placeholder="username" value="'+esc(p?.username||'')+'"></label><label>Display name<input name="display_name" maxlength="100" value="'+esc(p?.display_name||'')+'"></label><label>Bio<textarea name="bio" maxlength="500">'+esc(p?.bio||'')+'</textarea></label><label>Avatar URL (HTTPS)<input name="avatar_url" type="url" placeholder="https://…" value="'+esc(p?.avatar_url||'')+'"></label><label class="mfp408-check"><input name="is_public" type="checkbox" '+(p?.is_public!==false?'checked':'')+'> Public profile</label><button type="submit">Save profile</button></form></div>';
 }else if(!MFP408.profile){
  html='<div class="mfp408-card"><h3>Create your community identity</h3><p>Choose a unique username in My profile before posting, following, reviewing or messaging.</p><button onclick="App.mfp408Tab(\'profile\')">Set up profile</button></div>';
 }else if(MFP408.tab==='feed'){
  html='<div class="mfp408-card"><h3>Share an update</h3><form onsubmit="return App.mfp408Post(event)"><label>What are you watching, reading or recommending?<textarea name="body" maxlength="3000" required placeholder="Share a thought with the community…"></textarea></label><label>Related title (optional)<input name="title_name" maxlength="250" placeholder="Title name"></label><button type="submit">Publish post</button></form></div>';
  html+=r.map(x=>'<article class="mfp408-card"><div class="mfp408-meta">'+esc(mfp408Name(x.user_id))+' · '+new Date(x.created_at).toLocaleDateString()+'</div>'+(x.title_name?'<strong>'+esc(x.title_name)+'</strong>':'')+'<p class="mfp408-body">'+esc(x.body)+'</p><div class="mfp408-actions"><button onclick="App.mfp408Like(\''+x.id+'\')">'+(MFP408.likes.has(x.id)?'♥ Liked':'♡ Like')+'</button><button onclick="App.mfp408Comments(\''+x.id+'\')">Comments</button>'+(x.user_id===me?'<button onclick="App.mfp408Delete(\'mfp_posts\',\''+x.id+'\')">Delete</button>':'<button onclick="App.mfp408Report(\'post\',\''+x.id+'\')">Report</button>')+'</div><div id="mfp408-comments-'+x.id+'"></div></article>').join('');
 }else if(MFP408.tab==='people'){
  html='<div class="mfp408-card"><label>Find usernames<input id="mfp408-search" placeholder="Search public profiles" maxlength="40" value="'+esc(MFP408.search)+'" oninput="App.mfp408Search(this.value)"></label></div>';
  html+=r.filter(x=>x.user_id!==me).map(x=>'<article class="mfp408-card mfp408-person"><div><h3>@'+esc(x.username)+'</h3><strong>'+esc(x.display_name)+'</strong><p>'+esc(x.bio)+'</p></div><div class="mfp408-actions"><button onclick="App.mfp408Follow(\''+x.user_id+'\')">Follow / Unfollow</button><button onclick="App.mfp408MessageTo(\''+x.user_id+'\')">Message</button><button onclick="App.mfp408Report(\'profile\',\''+x.user_id+'\')">Report</button></div></article>').join('');
 }else if(MFP408.tab==='collections'){
  html='<div class="mfp408-card"><h3>Publish a curated collection</h3><p class="mfp408-muted">Enter title names manually. Your private library is never uploaded.</p><form onsubmit="return App.mfp408Collection(event)"><label>Collection name<input name="title" maxlength="120" required></label><label>Description<textarea name="description" maxlength="1000"></textarea></label><label>Titles (one per line, up to 300)<textarea name="titles" rows="4" required></textarea></label><button type="submit">Publish collection</button></form></div>';
  html+=r.map(x=>'<article class="mfp408-card"><div class="mfp408-meta">'+esc(mfp408Name(x.user_id))+'</div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><div class="mfp408-chips">'+(Array.isArray(x.titles)?x.titles:[]).slice(0,30).map(t=>'<span>'+esc(t)+'</span>').join('')+'</div><div class="mfp408-actions">'+(x.user_id===me?'<button onclick="App.mfp408Delete(\'mfp_collections\',\''+x.id+'\')">Delete</button>':'<button onclick="App.mfp408Report(\'collection\',\''+x.id+'\')">Report</button>')+'</div></article>').join('');
 }else if(MFP408.tab==='reviews'){
  const groups=new Map();for(const x of r){let k=x.media_key;let z=groups.get(k)||{name:x.title_name,sum:0,count:0};z.sum+=Number(x.rating);z.count++;groups.set(k,z)}
  html='<div class="mfp408-card"><h3>Rate a title</h3><form onsubmit="return App.mfp408Review(event)"><label>Title<input name="title_name" required maxlength="250"></label><label>Media ID (MAL, SIMKL or a unique title key)<input name="media_key" required maxlength="200" placeholder="mal:12345"></label><label>Rating / 10<input name="rating" type="number" min="0" max="10" step="0.5" required></label><label>Review<textarea name="body" maxlength="3000"></textarea></label><button type="submit">Publish review</button></form></div>';
  html+='<div class="mfp408-card"><h3>Top community ratings</h3>'+[...groups.values()].sort((a,b)=>b.sum/b.count-a.sum/a.count).slice(0,15).map(x=>'<p>'+esc(x.name)+' · <b>'+(x.sum/x.count).toFixed(1)+'/10</b> ('+x.count+' ratings)</p>').join('')+'</div>';
  html+=r.map(x=>'<article class="mfp408-card"><div class="mfp408-meta">'+esc(mfp408Name(x.user_id))+'</div><h3>'+esc(x.title_name)+' · '+Number(x.rating).toFixed(1)+'/10</h3><p>'+esc(x.body)+'</p>'+(x.user_id===me?'<button onclick="App.mfp408Delete(\'mfp_reviews\',\''+x.id+'\')">Delete</button>':'<button onclick="App.mfp408Report(\'review\',\''+x.id+'\')">Report</button>')+'</article>').join('');
 }else if(MFP408.tab==='messages'){
  html='<div class="mfp408-card"><h3>Send a message</h3><form onsubmit="return App.mfp408Message(event)"><label>Recipient username<input name="username" required value="'+esc(MFP408.target||'')+'" placeholder="username"></label><label>Message<textarea name="body" required maxlength="2000"></textarea></label><button type="submit">Send message</button></form></div>';
  html+=r.map(x=>'<article class="mfp408-card"><div class="mfp408-meta">'+esc(x.sender_id===me?'You → '+mfp408Name(x.recipient_id):mfp408Name(x.sender_id)+' → You')+' · '+new Date(x.created_at).toLocaleString()+'</div><p>'+esc(x.body)+'</p>'+(x.sender_id!==me?'<button onclick="App.mfp408MessageTo(\''+x.sender_id+'\')">Reply</button>':'')+'</article>').join('');
 }else if(MFP408.tab==='notifications'){
  html=r.map(x=>'<article class="mfp408-card"><div class="mfp408-meta">'+new Date(x.created_at).toLocaleString()+'</div><p>'+esc(mfp408Name(x.actor_id))+' · '+esc(x.kind)+'</p>'+(x.is_read?'':'<button onclick="App.mfp408Read(\''+x.id+'\')">Mark read</button>')+'</article>').join('');
 }
 if(!r.length&&MFP408.tab!=='profile'&&MFP408.profile)html+='<p class="mfp408-muted">Nothing here yet. Be the first to contribute.</p>';
 if(r.length>=MFP408.limit&&MFP408.tab!=='profile')html+='<button class="mfp408-more" onclick="App.mfp408More()">Load more</button>';
 return top+html;
}
async function mfp408Fetch(){
 const tab=MFP408.tab,me=AUTH_USER?.id,client=supabase;
 if(!client||!me)return;
 try{
  let p=await client.from('mfp_profiles').select('*').eq('user_id',me).maybeSingle();if(p.error)throw p.error;MFP408.profile=p.data;
  let q=client.from('mfp_profiles').select('user_id,username,display_name,bio,is_public').limit(150);let people=await q;if(people.error)throw people.error;MFP408.profiles=people.data||[];
  let res={data:[],error:null};
  if(tab==='feed')res=await client.from('mfp_posts').select('*').order('created_at',{ascending:false}).range(0,MFP408.limit-1);
  if(tab==='people')res=await client.from('mfp_profiles').select('*').eq('is_public',true).ilike('username','%'+MFP408.search.replace(/[%_,]/g,'')+'%').order('username').range(0,MFP408.limit-1);
  if(tab==='collections')res=await client.from('mfp_collections').select('*').order('created_at',{ascending:false}).range(0,MFP408.limit-1);
  if(tab==='reviews')res=await client.from('mfp_reviews').select('*').order('created_at',{ascending:false}).range(0,MFP408.limit-1);
  if(tab==='messages')res=await client.from('mfp_messages').select('*').or('sender_id.eq.'+me+',recipient_id.eq.'+me).order('created_at',{ascending:false}).range(0,MFP408.limit-1);
  if(tab==='notifications')res=await client.from('mfp_notifications').select('*').order('created_at',{ascending:false}).range(0,MFP408.limit-1);
  if(res.error)throw res.error;
  MFP408.rows=res.data||[];
  if(tab==='feed'&&MFP408.rows.length){let likes=await client.from('mfp_likes').select('post_id').eq('user_id',me).in('post_id',MFP408.rows.map(x=>x.id));if(!likes.error)MFP408.likes=new Set((likes.data||[]).map(x=>x.post_id));}
  if(S.view==='community'){let root=document.getElementById('mfp408-content');if(root)root.innerHTML=mfp408RenderRows();}
 }catch(e){mfp408Error(e);const el=document.getElementById('mfp408-content');if(el)el.textContent='Community could not load. Check your connection and retry.'}
}
async function mfp408Mutation(table,method,payload,filter){
 if(MFP408.busy)return;MFP408.busy=true;
 try{let q=supabase.from(table);let result=method==='insert'?await q.insert(payload):method==='upsert'?await q.upsert(payload):method==='delete'?await q.delete().eq('id',filter):await q.update(payload).eq('id',filter);if(result.error)throw result.error;await mfp408Fetch();mfp408Notice('Saved successfully.');}
 catch(e){mfp408Error(e)}finally{MFP408.busy=false}
}
async function mfp408SaveProfile(event){
 event.preventDefault();let f=new FormData(event.target),username=String(f.get('username')||'').toLowerCase().trim(),avatar=String(f.get('avatar_url')||'').trim();
 if(!/^[a-z0-9_]{3,24}$/.test(username))return mfp408Notice('Use 3–24 lowercase letters, numbers or underscores.',true);
 if(avatar&&!mfp408SafeURL(avatar))return mfp408Notice('Avatar must be an HTTPS URL.',true);
 await mfp408Mutation('mfp_profiles','upsert',{user_id:AUTH_USER.id,username,display_name:String(f.get('display_name')||'').slice(0,100),bio:String(f.get('bio')||'').slice(0,500),avatar_url:avatar||null,is_public:f.has('is_public')});
}
async function mfp408Post(e){e.preventDefault();let f=new FormData(e.target);await mfp408Mutation('mfp_posts','insert',{user_id:AUTH_USER.id,body:String(f.get('body')||'').trim(),title_name:String(f.get('title_name')||'').trim()||null});}
async function mfp408Collection(e){e.preventDefault();let f=new FormData(e.target),titles=String(f.get('titles')||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,300);await mfp408Mutation('mfp_collections','insert',{user_id:AUTH_USER.id,title:String(f.get('title')||'').trim(),description:String(f.get('description')||'').trim(),titles});}
async function mfp408Review(e){e.preventDefault();let f=new FormData(e.target);if(MFP408.busy)return;MFP408.busy=true;try{const record={user_id:AUTH_USER.id,media_key:String(f.get('media_key')||'').trim(),title_name:String(f.get('title_name')||'').trim(),rating:Number(f.get('rating')),body:String(f.get('body')||'').trim()};let res=await supabase.from('mfp_reviews').upsert(record,{onConflict:'user_id,media_key'});if(res.error)throw res.error;await mfp408Fetch();mfp408Notice('Review saved.')}catch(err){mfp408Error(err)}finally{MFP408.busy=false}}
async function mfp408Like(id){try{let q=supabase.from('mfp_likes');let res=MFP408.likes.has(id)?await q.delete().eq('user_id',AUTH_USER.id).eq('post_id',id):await q.insert({user_id:AUTH_USER.id,post_id:id});if(res.error)throw res.error;await mfp408Fetch()}catch(e){mfp408Error(e)}}
async function mfp408Comments(id){
 let el=document.getElementById('mfp408-comments-'+id);if(!el)return;
 if(el.dataset.open){el.replaceChildren();delete el.dataset.open;return}
 try{let r=await supabase.from('mfp_comments').select('*').eq('post_id',id).order('created_at',{ascending:true}).limit(40);if(r.error)throw r.error;el.dataset.open='1';el.innerHTML='<div class="mfp408-comments">'+(r.data||[]).map(x=>'<p><b>'+mfp408Esc(mfp408Name(x.user_id))+'</b> '+mfp408Esc(x.body)+'</p>').join('')+'<form onsubmit="return App.mfp408Comment(event,\''+id+'\')"><input name="body" required maxlength="1200" placeholder="Write a comment…"><button>Reply</button></form></div>'}catch(e){mfp408Error(e)}
}
async function mfp408Comment(e,id){e.preventDefault();let body=String(new FormData(e.target).get('body')||'').trim();try{let r=await supabase.from('mfp_comments').insert({post_id:id,user_id:AUTH_USER.id,body});if(r.error)throw r.error;let el=document.getElementById('mfp408-comments-'+id);if(el){delete el.dataset.open;await mfp408Comments(id)}}catch(e){mfp408Error(e)}}
async function mfp408Block(id){if(!confirm('Block this member? Their posts will be hidden and they cannot follow or message you.'))return;try{let r=await supabase.from('mfp_blocks').insert({blocker_id:AUTH_USER.id,blocked_id:id});if(r.error)throw r.error;await mfp408Fetch();mfp408Notice('Member blocked.')}catch(e){mfp408Error(e)}}
async function mfp408Follow(id){try{let q=await supabase.from('mfp_follows').select('follower_id').eq('follower_id',AUTH_USER.id).eq('following_id',id).maybeSingle();if(q.error)throw q.error;let r=q.data?await supabase.from('mfp_follows').delete().eq('follower_id',AUTH_USER.id).eq('following_id',id):await supabase.from('mfp_follows').insert({follower_id:AUTH_USER.id,following_id:id});if(r.error)throw r.error;mfp408Notice(q.data?'Unfollowed.':'Following.')}catch(e){mfp408Error(e)}}
function mfp408MessageTo(id){let p=MFP408.profiles.find(x=>x.user_id===id);MFP408.target=p?.username||'';mfp408Tab('messages')}
async function mfp408Message(e){e.preventDefault();let f=new FormData(e.target),username=String(f.get('username')||'').trim().toLowerCase();try{let q=await supabase.from('mfp_profiles').select('user_id').eq('username',username).eq('is_public',true).single();if(q.error)throw q.error;let r=await supabase.from('mfp_messages').insert({sender_id:AUTH_USER.id,recipient_id:q.data.user_id,body:String(f.get('body')||'').trim()});if(r.error)throw r.error;MFP408.target='';await mfp408Fetch();mfp408Notice('Message sent.')}catch(err){mfp408Error(err)}}
async function mfp408Read(id){await mfp408Mutation('mfp_notifications','update',{is_read:true},id)}
async function mfp408Delete(table,id){if(!confirm('Delete this item permanently?'))return;await mfp408Mutation(table,'delete',null,id)}
async function mfp408Report(kind,id){let reason=prompt('Report reason (at least 5 characters):');if(!reason)return;if(reason.trim().length<5)return mfp408Notice('Please explain the issue.',true);await mfp408Mutation('mfp_reports','insert',{reporter_id:AUTH_USER.id,target_kind:kind,target_id:id,reason:reason.trim().slice(0,500)})}
function mfp408Tab(tab){if(!MFP408_TABS.some(x=>x[0]===tab))return;MFP408.tab=tab;MFP408.limit=12;renderView();}
function mfp408More(){MFP408.limit=Math.min(120,MFP408.limit+12);mfp408Fetch()}
let mfp408SearchTimer=null;function mfp408Search(s){MFP408.search=s;clearTimeout(mfp408SearchTimer);mfp408SearchTimer=setTimeout(()=>{mfp408Fetch().then(()=>{let next=document.getElementById('mfp408-search');if(next){next.focus();next.setSelectionRange(s.length,s.length)}})},250)}
MediaFlowRuntime.registerPageRenderer('community',mfp408Renderer);
MediaFlowRuntime.registerPageEnhancer('community',mfp408Fetch);
Object.assign(App,{mfp408Tab,mfp408SaveProfile,mfp408Post,mfp408Collection,mfp408Review,mfp408Like,mfp408Comments,mfp408Comment,mfp408Follow,mfp408Block,mfp408MessageTo,mfp408Message,mfp408Read,mfp408Delete,mfp408Report,mfp408More,mfp408Search});
