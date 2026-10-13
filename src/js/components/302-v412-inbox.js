/* MediaFlow Plus v412 — Inbox and floating mini Inbox.
 * One canonical Supabase mfp_messages table and one in-memory conversation store.
 * No shadow message table, no publication of private Library data.
 */
const MFP412_INBOX={messages:[],profiles:new Map(),active:'',search:'',mini:false,loading:false,ready:false,error:'',draft:'',busy:false,lastFetch:0,channel:null};
const mfp412Esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mfp412Who=id=>{
 const p=MFP412_INBOX.profiles.get(String(id||''));
 return p?String(p.display_name||p.username||'Community member'):'Community member';
};
const mfp412InboxMe=()=>String(AUTH_USER?.id||'');
function mfp412InboxThreads(){
 const me=mfp412InboxMe(),threads=new Map();
 for(const m of MFP412_INBOX.messages){
  const other=String(m.sender_id===me?m.recipient_id:m.sender_id);
  if(!other||other===me)continue;
  let t=threads.get(other);
  if(!t){t={id:other,last:m,unread:0};threads.set(other,t);}
  if(m.recipient_id===me&&!m.read_at)t.unread++;
 }
 if(MFP412_INBOX.active&&!threads.has(MFP412_INBOX.active))
  threads.set(MFP412_INBOX.active,{id:MFP412_INBOX.active,last:null,unread:0});
 return [...threads.values()].sort((a,b)=>{
  const ta=Date.parse(a.last?.created_at||'')||0,tb=Date.parse(b.last?.created_at||'')||0;
  return tb-ta;
 });
}
function mfp412InboxUnread(){return mfp412InboxThreads().reduce((n,t)=>n+t.unread,0);}
function mfp412InboxThreadHtml(t){
 const m=t.last;
 const name=mfp412Who(t.id);
 const active=MFP412_INBOX.active===t.id;
 return '<button type="button" class="mf412-thread '+(active?'active':'')+'" onclick="App.mfp412SelectThread(\''+mfp412Esc(t.id)+'\')" aria-current="'+(active?'true':'false')+'">'+
  '<span class="mf412-thread-avatar" aria-hidden="true">'+mfp412Esc(name.charAt(0).toUpperCase())+'</span>'+
  '<span class="mf412-thread-copy"><b>'+mfp412Esc(name)+'</b><small>'+mfp412Esc((m?.body||'Start a conversation').slice(0,75))+'</small></span>'+
  (t.unread?'<span class="mf412-unread">'+t.unread+'</span>':'')+'</button>';
}
function mfp412InboxView(mode){
 const all=mfp412InboxThreads(),q=MFP412_INBOX.search.toLowerCase();
 const threads=q?all.filter(t=>mfp412Who(t.id).toLowerCase().includes(q)||String(t.last?.body||'').toLowerCase().includes(q)):all;
 const active=MFP412_INBOX.active,me=mfp412InboxMe();
 const msgs=MFP412_INBOX.messages.filter(m=>(m.sender_id===me&&m.recipient_id===active)||(m.recipient_id===me&&m.sender_id===active)).reverse();
 const name=mfp412Who(active);
 const compact=mode==='mini';
 return '<section class="mf412-inbox '+(compact?'mf412-inbox-mini':'mf412-inbox-page')+'" aria-label="MediaFlow Plus Inbox">'+
  '<header class="mf412-inbox-heading"><div><span class="mf412-kicker">MEDIAFLOW PLUS</span><h2>Inbox</h2><p>Private conversations and real-time messages</p></div>'+
  (compact?'<button type="button" class="mf412-icon-btn" aria-label="Close mini inbox" onclick="App.mfp412ToggleMini(false)">✕</button>':
  '<button type="button" class="btn btn-sm" onclick="App.mfp412InboxRefresh()">Refresh</button>')+'</header>'+
  (MFP412_INBOX.error?'<div class="mf412-inbox-error" role="alert">'+mfp412Esc(MFP412_INBOX.error)+' <button onclick="App.mfp412InboxRefresh()">Retry</button></div>':'')+
  '<div class="mf412-inbox-grid '+(active?'mf412-has-thread':'')+'">'+
  '<aside class="mf412-inbox-sidebar"><label class="mf412-inbox-search"><span>Find conversations</span><input type="search" placeholder="Search people or messages" value="'+mfp412Esc(MFP412_INBOX.search)+'" oninput="App.mfp412InboxSearch(this.value)" aria-label="Search Inbox"></label>'+
  '<div class="mf412-thread-list">'+(threads.length?threads.map(mfp412InboxThreadHtml).join(''):'<p class="mf412-empty">No conversations yet.</p>')+'</div>'+
  '<form class="mf412-new-chat" onsubmit="return App.mfp412NewChat(event)"><label>New conversation <input name="username" required maxlength="24" placeholder="Enter a public username"></label><button type="submit">Start chat</button></form>'+
  '</aside>'+
  '<main class="mf412-inbox-conversation">'+
  (active?'<div class="mf412-chat-title"><button type="button" class="mf412-back" onclick="App.mfp412SelectThread(\'\')" aria-label="Back to conversations">←</button><strong>'+mfp412Esc(name)+'</strong><span class="mf412-chat-sub">@'+mfp412Esc(MFP412_INBOX.profiles.get(active)?.username||'member')+'</span></div>'+
  '<div class="mf412-chat-scroll" id="mf412-chat-scroll" role="log" aria-live="polite">'+(msgs.length?msgs.map(m=>'<div class="mf412-msg '+(m.sender_id===me?'mine':'theirs')+'"><p>'+mfp412Esc(m.body)+'</p><time>'+mfp412Esc(new Date(m.created_at).toLocaleString())+(m.sender_id===me&&m.read_at?' · Read':'')+'</time></div>').join(''):'<p class="mf412-empty">Say hello to start your conversation.</p>')+'</div>'+
  '<form class="mf412-chat-compose" onsubmit="return App.mfp412Send(event)"><textarea name="body" maxlength="2000" required aria-label="Write a private message" placeholder="Write a message…">'+mfp412Esc(MFP412_INBOX.draft)+'</textarea><button type="submit" '+(MFP412_INBOX.busy?'disabled':'')+'>Send</button></form>':
  '<div class="mf412-chat-placeholder"><span aria-hidden="true">✉</span><strong>Your messages</strong><p>Select a conversation or start one with a public username.</p></div>')+'</main></div>'+
  (compact?'<footer class="mf412-mini-footer"><button type="button" onclick="App.mfp412OpenFull()">Open full Inbox ↗</button></footer>':'')+
  '</section>';
}
function mfp412DrawInbox(){
 const root=document.getElementById('mf412-inbox-body');
 const mini=document.getElementById('mf412-mini-panel');
 // Preserve an in-progress draft across an async refresh or realtime event.
 const active=document.activeElement;
 const composing=active?.closest?.('.mf412-chat-compose');
 if(composing)MFP412_INBOX.draft=composing.querySelector('textarea')?.value||'';
 if(root&&S.view==='inbox')root.innerHTML=mfp412InboxView('full');
 if(mini&&MFP412_INBOX.mini)mini.innerHTML=mfp412InboxView('mini');
 const btn=document.getElementById('mf412-inbox-fab');
 if(btn){const n=mfp412InboxUnread();btn.innerHTML='<span aria-hidden="true">✉</span>'+(n?'<span class="mf412-fab-unread">'+(n>99?'99+':n)+'</span>':'');btn.setAttribute('aria-label','Open mini Inbox'+(n?' · '+n+' unread messages':''));btn.setAttribute('aria-expanded',String(MFP412_INBOX.mini));}
 for(const scroll of document.querySelectorAll('#mf412-chat-scroll'))scroll.scrollTop=scroll.scrollHeight;
}
function mfp412InboxRenderer(){
 return '<div class="mf412-inbox-route"><div id="mf412-inbox-body">'+mfp412InboxView('full')+'</div></div>';
}
function mfp412InboxEnsureFloating(){
 if(!document.body)return;
 let fab=document.getElementById('mf412-inbox-fab');
 const showing=!!AUTH_USER&&!!AUTH_READY&&!!document.querySelector('.sidebar');
 if(!fab){
  fab=document.createElement('button');fab.id='mf412-inbox-fab';fab.type='button';
  fab.setAttribute('aria-haspopup','dialog');fab.setAttribute('aria-controls','mf412-mini-panel');
  fab.addEventListener('click',()=>mfp412ToggleMini(!MFP412_INBOX.mini));
  document.body.append(fab);
 }
 fab.hidden=!showing;
 let mini=document.getElementById('mf412-mini-panel');
 if(!mini){
  mini=document.createElement('div');mini.id='mf412-mini-panel';mini.className='mf412-mini-panel';mini.setAttribute('role','dialog');mini.setAttribute('aria-modal','false');mini.setAttribute('aria-label','Mini Inbox');document.body.append(mini);
 }
 mini.hidden=!showing||!MFP412_INBOX.mini;
 if(!showing)MFP412_INBOX.mini=false;
 mfp412DrawInbox();
}
function mfp412ToggleMini(open){
 MFP412_INBOX.mini=!!open&&!!AUTH_USER;
 mfp412InboxEnsureFloating();
 if(MFP412_INBOX.mini){void mfp412InboxRefresh();document.querySelector('#mf412-mini-panel input[type="search"]')?.focus({preventScroll:true});}
}
function mfp412OpenFull(){MFP412_INBOX.mini=false;mfp412InboxEnsureFloating();App.setView('inbox');}
function mfp412InboxSearch(query){MFP412_INBOX.search=String(query||'').slice(0,120);mfp412DrawInbox();}
function mfp412SelectThread(id){
 MFP412_INBOX.active=String(id||'');MFP412_INBOX.draft='';
 mfp412DrawInbox();
 if(id)void mfp412MarkRead();
}
async function mfp412InboxRefresh(){
 if(MFP412_INBOX.loading||!AUTH_USER||!supabase)return;
 const me=mfp412InboxMe();MFP412_INBOX.loading=true;
 try{
  const [messages,profiles]=await Promise.all([
   supabase.from('mfp_messages').select('id,sender_id,recipient_id,body,read_at,created_at').or('sender_id.eq.'+me+',recipient_id.eq.'+me).order('created_at',{ascending:false}).limit(500),
   supabase.from('mfp_profiles').select('user_id,username,display_name,avatar_url').limit(300)
  ]);
  if(messages.error)throw messages.error;
  if(profiles.error)throw profiles.error;
  if(me!==mfp412InboxMe())return; // an account switch must never show another user's messages
  MFP412_INBOX.messages=messages.data||[];
  MFP412_INBOX.profiles=new Map((profiles.data||[]).map(p=>[String(p.user_id),p]));
  MFP412_INBOX.error='';MFP412_INBOX.ready=true;MFP412_INBOX.lastFetch=Date.now();
  mfp412DrawInbox();
  if(MFP412_INBOX.active)void mfp412MarkRead();
 }catch(e){MFP412_INBOX.error=String(e?.message||'Could not load messages. Please retry.');console.warn('MediaFlow Plus Inbox',e);mfp412DrawInbox();}
 finally{MFP412_INBOX.loading=false;}
}
async function mfp412MarkRead(){
 if(!MFP412_INBOX.active||!AUTH_USER||!supabase)return;
 const id=MFP412_INBOX.active,me=mfp412InboxMe();
 const unread=MFP412_INBOX.messages.filter(m=>m.recipient_id===me&&m.sender_id===id&&!m.read_at);
 if(!unread.length)return;
 try{
  const now=new Date().toISOString();
  const r=await supabase.from('mfp_messages').update({read_at:now}).eq('recipient_id',me).eq('sender_id',id).is('read_at',null);
  if(r.error)throw r.error;
  unread.forEach(m=>{m.read_at=now;});mfp412DrawInbox();
 }catch(e){console.warn('MediaFlow Plus Inbox read receipts:',e);}
}
async function mfp412NewChat(event){
 event.preventDefault();
 const username=String(new FormData(event.target).get('username')||'').trim().toLowerCase();
 if(!/^[a-z0-9_]{3,24}$/.test(username))return;
 try{
  const r=await supabase.from('mfp_profiles').select('user_id,username,display_name').eq('username',username).eq('is_public',true).single();
  if(r.error)throw r.error;
  if(r.data.user_id===mfp412InboxMe())throw new Error('Choose another member.');
  MFP412_INBOX.profiles.set(String(r.data.user_id),r.data);
  mfp412SelectThread(r.data.user_id);
 }catch(e){MFP412_INBOX.error=e?.message||'Could not find that username.';mfp412DrawInbox();}
}
async function mfp412Send(event){
 event.preventDefault();
 if(MFP412_INBOX.busy||!AUTH_USER||!MFP412_INBOX.active)return;
 const body=String(new FormData(event.target).get('body')||'').trim().slice(0,2000);
 if(!body)return;
 const recipient=MFP412_INBOX.active,me=mfp412InboxMe();
 MFP412_INBOX.busy=true;
 try{
  const r=await supabase.from('mfp_messages').insert({sender_id:me,recipient_id:recipient,body});
  if(r.error)throw r.error;
  MFP412_INBOX.draft='';MFP412_INBOX.error='';
  await mfp412InboxRefresh();
 }catch(e){MFP412_INBOX.draft=body;MFP412_INBOX.error=e?.message||'Message could not be sent.';}
 finally{MFP412_INBOX.busy=false;mfp412DrawInbox();}
}
function mfp412StartChat(id){
 MFP412_INBOX.active=String(id||'');MFP412_INBOX.mini=false;
 App.setView('inbox');void mfp412InboxRefresh();
}
function mfp412InboxRealtime(){
 try{
  if(MFP412_INBOX.channel||!AUTH_USER||!supabase?.channel)return;
  MFP412_INBOX.channel=supabase.channel('mfplus-inbox-'+mfp412InboxMe())
   .on('postgres_changes',{event:'*',schema:'public',table:'mfp_messages'},()=>{void mfp412InboxRefresh();})
   .subscribe();
 }catch(e){console.warn('Inbox realtime unavailable; polling remains enabled.',e);}
}
function mfp412InboxOnView(){
 mfp412InboxEnsureFloating();
 if(AUTH_USER){mfp412InboxRealtime();void mfp412InboxRefresh();}
}
const mfp412RenderBase=render;
render=function(){
 const result=mfp412RenderBase.apply(this,arguments);
 queueMicrotask(mfp412InboxEnsureFloating);
 return result;
};
MediaFlowRuntime.registerPageRenderer('inbox',mfp412InboxRenderer);
MediaFlowRuntime.registerPageEnhancer('inbox',mfp412InboxOnView);
if(!NAV_ITEMS.some(n=>n.id==='inbox')){
 const pos=NAV_ITEMS.findIndex(n=>n.id==='community');
 NAV_ITEMS.splice(pos>=0?pos+1:NAV_ITEMS.length,0,{id:'inbox',label:'Inbox'});
}
if(!MOBILE_MORE_NAV.includes('inbox'))MOBILE_MORE_NAV.unshift('inbox');
ICONS.inbox='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 14h5l2 3h4l2-3h5"/></svg>';
if(typeof v161NormalizeNavLayout==='function')S.navLayout=v161NormalizeNavLayout(S.navLayout);
const mfp412CommunityTabBase=App.mfp408Tab;
App.mfp408Tab=function(tab){
 if(tab==='messages')return mfp412OpenFull();
 return mfp412CommunityTabBase.apply(this,arguments);
};
App.mfp408MessageTo=mfp412StartChat;
Object.assign(App,{mfp412InboxRefresh,mfp412ToggleMini,mfp412OpenFull,mfp412InboxSearch,mfp412SelectThread,mfp412NewChat,mfp412Send,mfp412StartChat});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&MFP412_INBOX.mini)mfp412ToggleMini(false);});
setInterval(()=>{
 if(!AUTH_USER){if(MFP412_INBOX.channel&&supabase?.removeChannel)void supabase.removeChannel(MFP412_INBOX.channel);MFP412_INBOX.channel=null;MFP412_INBOX.messages=[];MFP412_INBOX.profiles.clear();}
 if(document.visibilityState!=='visible')return;
 mfp412InboxEnsureFloating();
 if(AUTH_USER&&Date.now()-MFP412_INBOX.lastFetch>=30000)void mfp412InboxRefresh();
},30000);
setTimeout(mfp412InboxEnsureFloating,0);
