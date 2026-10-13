/* MediaFlow Plus v412 (WIP) — one canonical Inbox for full-page + floating mini views.
 * Messages are always read from mfp_messages. No cloned chat state.
 */
const MFP412_INBOX={
  items:[],people:[],selected:'',search:'',mini:false,loading:false,ready:false,
  error:'',lastFetch:0,requested:0,activeFetch:null,channel:null,timer:null,ownerId:''
};
const mfp412Escape=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mfp412InboxNav(){
 if(!NAV_ITEMS.some(n=>n.id==='inbox')){
  const idx=NAV_ITEMS.findIndex(n=>n.id==='community');
  NAV_ITEMS.splice(idx>=0?idx:NAV_ITEMS.length,0,{id:'inbox',label:'Inbox'});
 }
 if(!MOBILE_MORE_NAV.includes('inbox'))MOBILE_MORE_NAV.unshift('inbox');
 ICONS.inbox='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 13h5l2 3h4l2-3h5"/></svg>';
 if(typeof v161NormalizeNavLayout==='function') S.navLayout=v161NormalizeNavLayout(S.navLayout);
}
mfp412InboxNav();
function mfp412InboxMe(){return String(AUTH_USER?.id||'');}
function mfp412InboxUser(id){
 const p=MFP412_INBOX.people.find(x=>x.user_id===id);
 return p ? (p.display_name||('@'+p.username)) : 'Community member';
}
function mfp412InboxUnread(){
 const me=mfp412InboxMe();
 return MFP412_INBOX.items.filter(x=>x.recipient_id===me&&!x.read_at).length;
}
function mfp412InboxPeers(){
 const me=mfp412InboxMe(),byId=new Map();
 for(const m of MFP412_INBOX.items){
  const id=m.sender_id===me?m.recipient_id:m.sender_id;
  if(!id||id===me)continue;
  let t=byId.get(id);
  if(!t){t={id,last:m,unread:0};byId.set(id,t);}
  if(m.recipient_id===me&&!m.read_at)t.unread++;
 }
 return [...byId.values()].sort((a,b)=>new Date(b.last.created_at)-new Date(a.last.created_at));
}
function mfp412InboxTime(raw){
 try{return new Date(raw).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
 catch(_){return '';}
}
function mfp412InboxThreadsHtml(){
 const q=MFP412_INBOX.search.trim().toLowerCase();
 const rows=mfp412InboxPeers().filter(x=>!q||mfp412InboxUser(x.id).toLowerCase().includes(q));
 return rows.map(x=>{
  const selected=x.id===MFP412_INBOX.selected?' selected':'';
  const preview=mfp412Escape(String(x.last.body||'').slice(0,85));
  return '<button type="button" class="mfp412-conversation'+selected+'" onclick="App.mfp412Pick(\''+mfp412Escape(x.id)+'\')">'+
   '<span class="mfp412-peer-avatar" aria-hidden="true">'+mfp412Escape(mfp412InboxUser(x.id).slice(0,1).toUpperCase())+'</span>'+
   '<span class="mfp412-peer-copy"><b>'+mfp412Escape(mfp412InboxUser(x.id))+'</b><small>'+preview+'</small></span>'+
   (x.unread?'<em class="mfp412-count">'+x.unread+'</em>':'')+'</button>';
 }).join('')||'<p class="mfp412-muted mfp412-empty">No conversations yet. Search for someone to message.</p>';
}
function mfp412InboxDetailHtml(mini){
 const id=MFP412_INBOX.selected;
 if(!id)return '<div class="mfp412-welcome"><span class="mfp412-welcome-icon">✉</span><h3>Stay connected</h3><p>Select a conversation or find someone to start messaging.</p></div>';
 const me=mfp412InboxMe();
 const messages=MFP412_INBOX.items.filter(m=>(m.sender_id===me&&m.recipient_id===id)||(m.sender_id===id&&m.recipient_id===me)).slice().reverse();
 const thread=messages.map(m=>'<div class="mfp412-bubble '+(m.sender_id===me?'outgoing':'incoming')+'"><p>'+mfp412Escape(m.body)+'</p><small>'+mfp412InboxTime(m.created_at)+(m.sender_id===me&&m.read_at?' · Read':'')+'</small></div>').join('');
 return '<div class="mfp412-chat-head">'+(mini?'<button class="mfp412-back" type="button" onclick="App.mfp412MiniBack()" aria-label="Back to conversations">←</button>':'')+
  '<span class="mfp412-peer-avatar" aria-hidden="true">'+mfp412Escape(mfp412InboxUser(id).slice(0,1).toUpperCase())+'</span><strong>'+mfp412Escape(mfp412InboxUser(id))+'</strong>'+
  '<button class="mfp412-ghost" type="button" onclick="App.mfp412OpenFull()">Open full Inbox</button></div>'+
  '<div class="mfp412-chat-scroll" role="log" aria-label="Conversation">'+(thread||'<p class="mfp412-muted">Start your conversation.</p>')+'</div>'+
  '<form class="mfp412-composer" onsubmit="return App.mfp412Send(event)"><textarea name="body" required maxlength="2000" rows="2" aria-label="Message" placeholder="Write a message…" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();this.form.requestSubmit()}"></textarea><button type="submit">Send</button></form>';
}
function mfp412InboxPage(){
 return '<div class="mfp412-inbox"><header class="mfp412-header"><div><span class="mfp412-eyebrow">MEDIAFLOW PLUS / SOCIAL</span><h1>Inbox</h1><p>Private conversations, in one place.</p></div><span class="mfp412-header-count" id="mfp412-page-count">'+mfp412InboxUnread()+' unread</span></header>'+
  '<div id="mfp412-alert" class="mfp412-alert" role="status" aria-live="polite"></div>'+
  '<div class="mfp412-main"><aside class="mfp412-left"><label class="mfp412-field">Find a person<input id="mfp412-find" type="search" autocomplete="off" maxlength="40" placeholder="Search public usernames" oninput="App.mfp412Find(this.value)"></label>'+
  '<div id="mfp412-found" class="mfp412-found"></div>'+
  '<label class="mfp412-field">Conversations<input type="search" maxlength="50" placeholder="Filter conversations" value="'+mfp412Escape(MFP412_INBOX.search)+'" oninput="App.mfp412Filter(this.value)"></label>'+
  '<div id="mfp412-thread-list" class="mfp412-thread-list">'+mfp412InboxThreadsHtml()+'</div></aside>'+
  '<section class="mfp412-right" id="mfp412-detail">'+mfp412InboxDetailHtml(false)+'</section></div></div>';
}
function mfp412InboxWidget(){
 let el=document.getElementById('mfp412-inbox-widget');
 if(!el){
  el=document.createElement('div');el.id='mfp412-inbox-widget';el.className='mfp412-widget';
  el.innerHTML='<button type="button" class="mfp412-fab" aria-label="Open mini Inbox" aria-expanded="false" onclick="App.mfp412ToggleMini()">'+
   '<span aria-hidden="true">✉</span><em id="mfp412-fab-count" class="mfp412-fab-count"></em></button>'+
   '<section class="mfp412-mini" id="mfp412-mini" role="dialog" aria-label="Mini Inbox" hidden></section>';
  document.body.appendChild(el);
 }
 return el;
}
function mfp412InboxDrawMini(){
 const mini=document.getElementById('mfp412-mini');if(!mini)return;
 if(!MFP412_INBOX.mini){mini.hidden=true;return;}
 mini.hidden=false;
 mini.innerHTML='<div class="mfp412-mini-head"><div><strong>Inbox</strong><small>'+mfp412InboxUnread()+' unread</small></div>'+
  '<button type="button" class="mfp412-ghost" onclick="App.mfp412OpenFull()">Full Inbox</button>'+
  '<button type="button" class="mfp412-ghost" onclick="App.mfp412ToggleMini()" aria-label="Close mini Inbox">✕</button></div>'+
  (MFP412_INBOX.selected?'<div class="mfp412-mini-detail">'+mfp412InboxDetailHtml(true)+'</div>':
    '<div class="mfp412-mini-list">'+mfp412InboxThreadsHtml()+'<button class="mfp412-mini-link" type="button" onclick="App.mfp412OpenFull()">Find people & open full Inbox →</button></div>');
}
function mfp412InboxSyncWidget(){
 const host=mfp412InboxWidget();
 const visible=!!AUTH_USER&&!!AUTH_READY&&!document.querySelector('.auth-screen')&&!document.querySelector('.loader-wrap');
 host.hidden=!visible;
 if(!visible){MFP412_INBOX.mini=false;const panel=document.getElementById('mfp412-mini');if(panel)panel.hidden=true;return;}
 const count=mfp412InboxUnread(),badge=document.getElementById('mfp412-fab-count');
 if(badge){badge.textContent=count?String(Math.min(count,99))+(count>99?'+':''):'';badge.hidden=count===0;}
 host.querySelector('.mfp412-fab')?.setAttribute('aria-expanded',String(MFP412_INBOX.mini));
 const page=document.getElementById('mfp412-page-count');
 if(page)page.textContent=count+' unread';
 mfp412InboxDrawMini();
}
function mfp412InboxPaint(){
 const list=document.getElementById('mfp412-thread-list');
 if(list)list.innerHTML=mfp412InboxThreadsHtml();
 const detail=document.getElementById('mfp412-detail');
 if(detail){detail.innerHTML=mfp412InboxDetailHtml(false);mfp412InboxScroll(detail);}
 mfp412InboxSyncWidget();
 const mini=document.getElementById('mfp412-mini');
 if(mini&&!mini.hidden)mfp412InboxScroll(mini);
}
function mfp412InboxScroll(host){
 const el=host.querySelector('.mfp412-chat-scroll');if(el)el.scrollTop=el.scrollHeight;
}
async function mfp412InboxLoad(force=false){
 if(!AUTH_USER||!supabase){MFP412_INBOX.error='Sign in to open your Inbox';mfp412InboxPaint();return;}
 if(MFP412_INBOX.activeFetch)return MFP412_INBOX.activeFetch;
 if(!force&&Date.now()-MFP412_INBOX.lastFetch<9000)return;
 const myId=mfp412InboxMe();MFP412_INBOX.loading=true;
 MFP412_INBOX.activeFetch=(async()=>{
  try{
   const msgs=await supabase.from('mfp_messages').select('id,sender_id,recipient_id,body,created_at,read_at')
    .or('sender_id.eq.'+myId+',recipient_id.eq.'+myId).order('created_at',{ascending:false}).limit(400);
   if(msgs.error)throw msgs.error;
   const people=await supabase.from('mfp_profiles').select('user_id,username,display_name,is_public').eq('is_public',true).limit(200);
   if(people.error)throw people.error;
   if(mfp412InboxMe()!==myId)return;
   MFP412_INBOX.items=msgs.data||[];MFP412_INBOX.people=people.data||[];
   MFP412_INBOX.ready=true;MFP412_INBOX.error='';MFP412_INBOX.lastFetch=Date.now();
   const p=MFP412_INBOX.selected;
   if(p)void mfp412InboxMarkRead(p);
  }catch(error){
   console.error('MediaFlow Plus Inbox refresh',error);
   MFP412_INBOX.error=String(error?.message||'Inbox is temporarily unavailable');
   const notice=document.getElementById('mfp412-alert');
   if(notice)notice.textContent='Could not load conversations. '+MFP412_INBOX.error;
  }finally{
   MFP412_INBOX.loading=false;MFP412_INBOX.activeFetch=null;mfp412InboxPaint();
  }
 })();
 return MFP412_INBOX.activeFetch;
}
async function mfp412InboxMarkRead(peer){
 const me=mfp412InboxMe();
 if(!me)return;
 const ids=MFP412_INBOX.items.filter(m=>m.sender_id===peer&&m.recipient_id===me&&!m.read_at).map(x=>x.id);
 if(!ids.length)return;
 const when=new Date().toISOString();
 const result=await supabase.from('mfp_messages').update({read_at:when}).eq('recipient_id',me).in('id',ids);
 if(result.error){console.warn('Inbox read receipts unavailable',result.error);return;}
 const set=new Set(ids);
 for(const x of MFP412_INBOX.items)if(set.has(x.id))x.read_at=when;
 mfp412InboxPaint();
}
function mfp412Pick(id){
 MFP412_INBOX.selected=String(id||'');
 mfp412InboxPaint();
 void mfp412InboxMarkRead(MFP412_INBOX.selected);
}
function mfp412ToggleMini(){
 if(AUTH_USER)mfp412InboxStart();
 MFP412_INBOX.mini=!MFP412_INBOX.mini;
 if(MFP412_INBOX.mini){MFP412_INBOX.selected='';void mfp412InboxLoad(true);}
 mfp412InboxSyncWidget();
}
function mfp412MiniBack(){MFP412_INBOX.selected='';mfp412InboxPaint();}
function mfp412OpenFull(){
 MFP412_INBOX.mini=false;MFP412_INBOX.selected=MFP412_INBOX.selected||mfp412InboxPeers()[0]?.id||'';
 App.setView('inbox');
}
function mfp412Filter(value){MFP412_INBOX.search=String(value||'');const el=document.getElementById('mfp412-thread-list');if(el)el.innerHTML=mfp412InboxThreadsHtml();}
let MFP412_FIND_TIMER=null;
function mfp412Find(value){
 clearTimeout(MFP412_FIND_TIMER);
 const term=String(value||'').trim().toLowerCase();
 const host=document.getElementById('mfp412-found');if(!host)return;
 if(term.length<2){host.replaceChildren();return;}
 MFP412_FIND_TIMER=setTimeout(async()=>{
  try{
   const safe=term.replace(/[%_,]/g,'').slice(0,40);
   const res=await supabase.from('mfp_profiles').select('user_id,username,display_name').eq('is_public',true).ilike('username','%'+safe+'%').limit(12);
   if(res.error)throw res.error;
   if(document.getElementById('mfp412-find')?.value.trim().toLowerCase()!==term)return;
   host.innerHTML=(res.data||[]).filter(p=>p.user_id!==mfp412InboxMe()).map(p=>
    '<button type="button" onclick="App.mfp412Pick(\''+mfp412Escape(p.user_id)+'\')">@'+mfp412Escape(p.username)+' <small>'+mfp412Escape(p.display_name||'')+'</small></button>').join('')||'<p class="mfp412-muted">No matching public profiles</p>';
   for(const p of res.data||[])if(!MFP412_INBOX.people.some(x=>x.user_id===p.user_id))MFP412_INBOX.people.push(p);
  }catch(e){if(host)host.textContent='Search unavailable';}
 },250);
}
async function mfp412Send(event){
 event.preventDefault();
 const textarea=event.target.querySelector('[name="body"]'),message=textarea?.value.trim(),recipient=MFP412_INBOX.selected;
 if(!message||!recipient||!AUTH_USER)return false;
 if(message.length>2000)return false;
 const button=event.target.querySelector('[type="submit"]');
 if(button?.disabled)return false;
 if(button)button.disabled=true;
 try{
  const result=await supabase.from('mfp_messages').insert({sender_id:mfp412InboxMe(),recipient_id:recipient,body:message});
  if(result.error)throw result.error;
  if(textarea)textarea.value='';
  MFP412_INBOX.lastFetch=0;
  await mfp412InboxLoad(true);
 }catch(error){const notice=document.getElementById('mfp412-alert');if(notice)notice.textContent='Message not sent: '+String(error?.message||error);}
 finally{if(button?.isConnected)button.disabled=false;}
 return false;
}
function mfp412InboxStart(){
 const current=mfp412InboxMe();
 if(MFP412_INBOX.ownerId!==current){
  if(MFP412_INBOX.channel&&supabase?.removeChannel)void supabase.removeChannel(MFP412_INBOX.channel);
  MFP412_INBOX.channel=null;MFP412_INBOX.ownerId=current;MFP412_INBOX.items=[];MFP412_INBOX.people=[];MFP412_INBOX.selected='';MFP412_INBOX.lastFetch=0;MFP412_INBOX.ready=false;
 }
 mfp412InboxSyncWidget();
 if(!MFP412_INBOX.timer)MFP412_INBOX.timer=setInterval(()=>{
  if(AUTH_READY&&AUTH_USER&&document.visibilityState==='visible')void mfp412InboxLoad(true);
 },45000);
 if(!MFP412_INBOX.channel&&supabase?.channel&&AUTH_USER){
  const id=mfp412InboxMe();
  const channel=supabase.channel('mfp412-inbox-'+id).on('postgres_changes',{event:'*',schema:'public',table:'mfp_messages'},payload=>{
   if(payload?.new?.sender_id===id||payload?.new?.recipient_id===id||payload?.old?.sender_id===id||payload?.old?.recipient_id===id){
    MFP412_INBOX.lastFetch=0;
    void mfp412InboxLoad(true);
   }
  }).subscribe();
  MFP412_INBOX.channel=channel;
 }
 void mfp412InboxLoad();
}
const mfp412RenderBase=render;
render=function(){const result=mfp412RenderBase.apply(this,arguments);requestAnimationFrame(mfp412InboxSyncWidget);return result;};
const mfp412RenderShellBase=renderShell;
renderShell=function(){const result=mfp412RenderShellBase.apply(this,arguments);requestAnimationFrame(()=>{mfp412InboxSyncWidget();if(AUTH_USER)mfp412InboxStart();});return result;};
// Existing Community messages open the canonical Inbox rather than a second thread list.
const mfp412CommunityTabBase=App.mfp408Tab;
App.mfp408Tab=function(tab){if(tab==='messages'){mfp412OpenFull();return;}return mfp412CommunityTabBase.apply(this,arguments);};
App.mfp408MessageTo=function(id){MFP412_INBOX.selected=String(id||'');mfp412OpenFull();};
const mfp412AuthScreenBase=renderAuthScreen;
renderAuthScreen=function(){const result=mfp412AuthScreenBase.apply(this,arguments);mfp412InboxStart();return result;};
MediaFlowRuntime.registerPageRenderer('inbox',mfp412InboxPage);
MediaFlowRuntime.registerPageEnhancer('inbox',mfp412InboxStart);
Object.assign(App,{mfp412Pick,mfp412ToggleMini,mfp412MiniBack,mfp412OpenFull,mfp412Filter,mfp412Find,mfp412Send});
window.MediaFlowPlusInbox={version:412,refresh:()=>mfp412InboxLoad(true),open:mfp412OpenFull,audit:()=>({
 messages:MFP412_INBOX.items.length,conversations:mfp412InboxPeers().length,unread:mfp412InboxUnread(),
 lastFetch:MFP412_INBOX.lastFetch,error:MFP412_INBOX.error
})};
