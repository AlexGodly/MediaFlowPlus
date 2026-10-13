/* MediaFlow Plus v412 — canonical Inbox and floating mini inbox.
 * Messages stay in existing mfp_messages; this module creates no message copies.
 */
(function(){
'use strict';
const MF412={open:false,loading:false,peer:'',messages:[],profiles:[],error:'',query:'',epoch:0,channel:null,session:'',refreshTimer:0};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svg='<svg viewBox="0 0 24 24" aria-hidden="true" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z"/><path d="M8 10h9M8 14h6"/></svg>';
if(!NAV_ITEMS.some(x=>x.id==='inbox'))NAV_ITEMS.splice(Math.max(0,NAV_ITEMS.length-2),0,{id:'inbox',label:'Inbox'});
if(!MOBILE_MORE_NAV.includes('inbox'))MOBILE_MORE_NAV.unshift('inbox');
ICONS.inbox=svg;
if(typeof v161NormalizeNavLayout==='function')S.navLayout=v161NormalizeNavLayout(S.navLayout);
function mf412Peer(id){return MF412.profiles.find(p=>p.user_id===id);}
function mf412Display(id){const p=mf412Peer(id);return p?.display_name|| (p?.username?'@'+p.username:'Member');}
function mf412Groups(){
 const me=AUTH_USER?.id,groups=new Map();
 for(const m of MF412.messages){
  const peer=m.sender_id===me?m.recipient_id:m.sender_id;
  const group=groups.get(peer)||{id:peer,latest:m,unread:0};
  if(!group.latest||new Date(m.created_at)>new Date(group.latest.created_at))group.latest=m;
  if(m.recipient_id===me&&!m.read_at)group.unread++;
  groups.set(peer,group);
 }
 return [...groups.values()].sort((a,b)=>new Date(b.latest.created_at)-new Date(a.latest.created_at));
}
function mf412Shell(mini=false){
 const groups=mf412Groups(),me=AUTH_USER?.id,peer=MF412.peer;
 const chats=groups.filter(g=>mf412Display(g.id).toLocaleLowerCase().includes(MF412.query.toLocaleLowerCase()));
 const list='<div class="mf412-list"><label class="mf412-search"><span>Find conversations</span><input type="search" value="'+esc(MF412.query)+'" placeholder="Search people" oninput="App.mf412Search(this.value)"></label>'+
   (chats.map(g=>'<button type="button" class="mf412-conversation '+(g.id===peer?'active':'')+'" onclick="App.mf412Peer(\''+g.id+'\')"><span class="mf412-avatar">'+esc(mf412Display(g.id).slice(0,1).toUpperCase())+'</span><span class="mf412-contact"><strong>'+esc(mf412Display(g.id))+'</strong><small>'+esc(g.latest.body)+'</small></span>'+(g.unread?'<b class="mf412-unread">'+g.unread+'</b>':'')+'</button>').join('')||'<p class="mf412-muted">No conversations yet. Start one using a username.</p>')+'</div>';
 const msg=MF412.messages.filter(m=>m.sender_id===peer&&m.recipient_id===me||m.recipient_id===peer&&m.sender_id===me).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
 const history=peer?'<div class="mf412-messages">'+(msg.map(m=>'<div class="mf412-bubble '+(m.sender_id===me?'mine':'theirs')+'"><p>'+esc(m.body)+'</p><small>'+new Date(m.created_at).toLocaleString()+'</small></div>').join('')||'<p class="mf412-muted">Say hello to start the conversation.</p>')+'</div>':'<div class="mf412-empty"><h3>Your conversations</h3><p>Choose a person or enter their username below to start chatting.</p></div>';
 const form='<form class="mf412-compose" onsubmit="return App.mf412Send(event)">'+(!peer?'<label>Recipient username<input name="username" required maxlength="24" placeholder="username" autocomplete="off"></label>':'<div class="mf412-to">Chatting with <b>'+esc(mf412Display(peer))+'</b> <button type="button" onclick="App.mf412Peer(\'\')">New chat</button></div>')+'<label class="mf412-message-input">Message<textarea name="body" required maxlength="2000" placeholder="Write a message…" rows="2"></textarea></label><button type="submit" class="btn btn-primary">Send</button></form>';
 const banner=MF412.error?'<div class="mf412-error" role="alert">'+esc(MF412.error)+' <button onclick="App.mf412Load()">Retry</button></div>':'';
 return '<section class="mf412-layout '+(mini?'mini':'full')+'" aria-label="Inbox">'+banner+list+'<section class="mf412-thread"><header><b>'+esc(peer?mf412Display(peer):'Messages')+'</b></header>'+history+form+'</section></section>';
}
function mf412Page(){return '<section class="mf412-page"><header class="mf412-page-header"><h1>Inbox</h1><p>Private conversations with the MediaFlow Plus community.</p></header><div id="mf412-page-content">'+mf412Shell(false)+'</div></section>';}
function mf412Render(){
 const wrap=document.getElementById('mf412-page-content');if(wrap)wrap.innerHTML=mf412Shell(false);
 const mini=document.getElementById('mf412-mini-content');if(mini)mini.innerHTML=mf412Shell(true);
 const badge=document.getElementById('mf412-unread-badge');
 const count=mf412Groups().reduce((n,g)=>n+g.unread,0);
 if(badge){badge.textContent=count>99?'99+':String(count);badge.hidden=!count;}
}
function mf412EnsureFloating(){
 if(!AUTH_USER||!document.querySelector('#app .sidebar')){
  document.getElementById('mf412-float')?.remove();return;
 }
 if(document.getElementById('mf412-float'))return;
 document.body.insertAdjacentHTML('beforeend','<aside id="mf412-float" class="mf412-float"><button id="mf412-toggle" type="button" class="mf412-fab" onclick="App.mf412Toggle()" title="Inbox" aria-label="Open mini inbox" aria-expanded="false">'+svg+'<span id="mf412-unread-badge" hidden></span></button><section id="mf412-mini" class="mf412-mini" role="dialog" aria-label="Mini inbox" hidden><header><b>Inbox</b><div><button onclick="App.mf412OpenPage()">Open full inbox</button><button onclick="App.mf412Toggle(false)" aria-label="Close inbox">×</button></div></header><div id="mf412-mini-content"></div></section></aside>');
 mf412Render();
}
function mf412Toggle(force){
 mf412EnsureFloating();
 MF412.open=typeof force==='boolean'?force:!MF412.open;
 const panel=document.getElementById('mf412-mini'),btn=document.getElementById('mf412-toggle');
 if(panel)panel.hidden=!MF412.open;
 if(btn)btn.setAttribute('aria-expanded',String(MF412.open));
 if(MF412.open){if(typeof mf397SetMenu==='function')mf397SetMenu(false);void mf412Load();}
}
function mf412OpenPage(){mf412Toggle(false);App.setView('inbox');}
async function mf412Load(){
 if(!AUTH_USER||!supabase){MF412.error='Sign in to view your Inbox.';mf412Render();return;}
 const epoch=++MF412.epoch,me=AUTH_USER.id;
 MF412.loading=true;MF412.error='';
 try{
  // RLS restricts the result to the current participant. Only the latest 500
  // messages are fetched; future paging can expand long-lived conversations.
  const [msgs,people]=await Promise.all([
   supabase.from('mfp_messages').select('id,sender_id,recipient_id,body,created_at,read_at').or('sender_id.eq.'+me+',recipient_id.eq.'+me).order('created_at',{ascending:false}).limit(500),
   supabase.from('mfp_profiles').select('user_id,username,display_name').limit(500)
  ]);
  if(msgs.error)throw msgs.error;
  if(people.error)throw people.error;
  if(epoch!==MF412.epoch||AUTH_USER?.id!==me)return;
  MF412.messages=msgs.data||[];MF412.profiles=people.data||[];
  if(MF412.peer)void mf412MarkRead();
 }catch(e){if(epoch===MF412.epoch)MF412.error=e?.message||'Could not load your messages.';console.error('MediaFlow Plus Inbox',e)}
 finally{if(epoch===MF412.epoch){MF412.loading=false;mf412Render();}}
}
async function mf412MarkRead(){
 const peer=MF412.peer,me=AUTH_USER?.id;if(!peer||!me)return;
 const unread=MF412.messages.filter(m=>m.sender_id===peer&&m.recipient_id===me&&!m.read_at);
 if(!unread.length)return;
 // Only the recipient may update the read receipt under RLS.
 const ids=unread.map(m=>m.id),readAt=new Date().toISOString();
 const r=await supabase.from('mfp_messages').update({read_at:readAt}).eq('recipient_id',me).in('id',ids);
 if(!r.error){for(const m of unread)m.read_at=readAt;mf412Render();}
}
function mf412Peer(id){MF412.peer=String(id||'');mf412Render();void mf412MarkRead();}
function mf412Search(q){MF412.query=String(q||'');const input=document.activeElement;const at=input?.selectionStart;mf412Render();const next=document.querySelector('#mf412-'+(MF412.open?'mini-content':'page-content')+' .mf412-search input');if(next&&input){next.focus();try{next.setSelectionRange(at,at)}catch(_){}}}
async function mf412Send(event){
 event.preventDefault();if(!AUTH_USER||!supabase)return false;
 const button=event.target.querySelector('[type=submit]');if(button?.disabled)return false;
 button.disabled=true;const fd=new FormData(event.target),body=String(fd.get('body')||'').trim();
 try{
  if(!body)throw new Error('Enter a message.');
  let to=MF412.peer;
  if(!to){const username=String(fd.get('username')||'').trim().toLowerCase();if(!username)throw new Error('Enter a username.');const result=await supabase.from('mfp_profiles').select('user_id').eq('username',username).eq('is_public',true).single();if(result.error)throw result.error;to=result.data.user_id;}
  if(to===AUTH_USER.id)throw new Error('You cannot message yourself.');
  const res=await supabase.from('mfp_messages').insert({sender_id:AUTH_USER.id,recipient_id:to,body});
  if(res.error)throw res.error;
  MF412.peer=to;await mf412Load();
 }catch(e){MF412.error=e?.message||'Message failed to send.';mf412Render();}
 finally{button.disabled=false;}
 return false;
}
function mf412Subscribe(){
 const id=AUTH_USER?.id;if(!id||!supabase||MF412.session===id)return;
 try{MF412.channel?.unsubscribe?.();}catch(_){}
 MF412.session=id;
 void mf412Load();
 if(typeof supabase.channel==='function'){
  MF412.channel=supabase.channel('mfplus-inbox-'+id)
   .on('postgres_changes',{event:'*',schema:'public',table:'mfp_messages',filter:'recipient_id=eq.'+id},()=>void mf412Load())
   .on('postgres_changes',{event:'*',schema:'public',table:'mfp_messages',filter:'sender_id=eq.'+id},()=>void mf412Load())
   .subscribe();
 }
}
function mf412Tick(){
 if(!AUTH_USER||!document.querySelector('#app .sidebar')){
  document.getElementById('mf412-float')?.remove();
  if(MF412.session){MF412.channel?.unsubscribe?.();MF412.channel=null;MF412.session='';MF412.messages=[];}
  return;
 }
 mf412EnsureFloating();mf412Subscribe();
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&MF412.open)mf412Toggle(false);});
setInterval(mf412Tick,4000);
setInterval(()=>{if(AUTH_USER)void mf412Load();},45000);
MediaFlowRuntime.registerPageRenderer('inbox',mf412Page);
MediaFlowRuntime.registerPageEnhancer('inbox',()=>{mf412EnsureFloating();mf412Render();void mf412Load();});
const oldMessages=App.mfp408MessageTo;
App.mfp408MessageTo=function(id){MF412.peer=id;mf412OpenPage();};
Object.assign(App,{mf412Toggle,mf412OpenPage,mf412Load,mf412Peer,mf412Search,mf412Send});
window.MediaFlowPlusInbox={version:412,refresh:mf412Load,open:mf412OpenPage};
})();
