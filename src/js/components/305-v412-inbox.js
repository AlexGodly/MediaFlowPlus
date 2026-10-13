/* MediaFlow Plus v412 — inbox and floating mini inbox.
 * One canonical messages table; floating and full views share the same model.
 * Never reads or writes Personal Edition or MediaFlow private workspace data.
 */
(function(){
'use strict';
const IN412={rows:[],profiles:[],thread:'',search:'',mini:false,loaded:false,loading:false,sending:false,
 last:0,channel:null,channelUser:'',error:'',epoch:0};
function in412EnsureAccount(){
 const me=String(AUTH_USER?.id||'');
 if(IN412.ownerId!==me){
  IN412.ownerId=me;IN412.rows=[];IN412.profiles=[];IN412.thread='';IN412.loaded=false;
  IN412.search='';IN412.error='';IN412.last=0;IN412.epoch++;
 }
}
const in412Esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function in412Me(){return String(AUTH_USER?.id||'');}
function in412Name(id){
 const p=IN412.profiles.find(x=>String(x.user_id)===String(id))||MFP408?.profiles?.find(x=>String(x.user_id)===String(id));
 return p?.display_name|| (p?.username?'@'+p.username : 'Community member');
}
function in412Username(id){
 const p=IN412.profiles.find(x=>String(x.user_id)===String(id))||MFP408?.profiles?.find(x=>String(x.user_id)===String(id));
 return p?.username||'';
}
function in412Partner(m){return String(m.sender_id)===in412Me()?String(m.recipient_id):String(m.sender_id);}
function in412Threads(){
 const map=new Map();
 for(const m of IN412.rows){
  const id=in412Partner(m);
  let t=map.get(id);
  if(!t){t={id,latest:m,unread:0};map.set(id,t);}
  if(String(m.recipient_id)===in412Me()&&!m.read_at)t.unread++;
 }
 return [...map.values()];
}
function in412Unread(){return in412Threads().reduce((n,t)=>n+t.unread,0);}
function in412Icon(){
 return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11.5h8M8 15h5"/></svg>';
}
function in412ThreadsHtml(mini){
 const search=IN412.search.toLocaleLowerCase().trim();
 const threads=in412Threads().filter(t=>!search||in412Name(t.id).toLocaleLowerCase().includes(search)||in412Username(t.id).includes(search));
 return '<div class="in412-search-row"><input type="search" value="'+in412Esc(IN412.search)+'" placeholder="Search conversations…" aria-label="Search conversations" oninput="App.in412Filter(this.value)"></div>'+
 (threads.length?threads.map(t=>'<button type="button" class="in412-thread '+(IN412.thread===t.id?'selected':'')+'" onclick="App.in412Select(\''+in412Esc(t.id)+'\')">'+
  '<span class="in412-avatar">'+in412Esc(in412Name(t.id).slice(0,1).toUpperCase())+'</span><span class="in412-thread-copy"><strong>'+in412Esc(in412Name(t.id))+'</strong>'+
  '<span>'+in412Esc(String(t.latest.body||'').slice(0,80))+'</span></span>'+
  (t.unread?'<span class="in412-unread">'+t.unread+'</span>':'')+'</button>').join(''):'<p class="in412-empty">'+(IN412.loaded?'No conversations yet. Start by entering a username.':'Loading conversations…')+'</p>')+
 (!mini?'<div class="in412-composer-helper"><label>Start a conversation<input id="in412-recipient" autocomplete="off" placeholder="Recipient username" maxlength="24"></label><button type="button" onclick="App.in412New()">Open chat</button></div>':'');
}
function in412MessagesHtml(mini){
 const id=IN412.thread;
 if(!id)return '<div class="in412-conversation-empty"><span class="in412-empty-icon">'+in412Icon()+'</span><h3>Your conversations</h3><p>Select a conversation or start one with a public Community username.</p></div>';
 const msgs=IN412.rows.filter(m=>in412Partner(m)===id).slice().reverse();
 return '<div class="in412-conversation-head"><strong>'+in412Esc(in412Name(id))+'</strong><span>'+in412Esc(in412Username(id)?'@'+in412Username(id):'Direct messages')+'</span></div>'+
 '<div class="in412-message-scroll" id="'+(mini?'in412-mini-scroll':'in412-full-scroll')+'">'+
 (msgs.length?msgs.map(m=>'<div class="in412-bubble-wrap '+(String(m.sender_id)===in412Me()?'mine':'theirs')+'"><div class="in412-bubble">'+in412Esc(m.body)+'</div><small>'+in412Esc(new Date(m.created_at).toLocaleString())+(String(m.sender_id)===in412Me()&&m.read_at?' · Seen':'')+'</small></div>').join(''):'<p class="in412-empty">No messages yet. Say hello.</p>')+'</div>'+
 '<form class="in412-compose" onsubmit="return App.in412Send(event)"><textarea name="body" rows="2" maxlength="2000" required placeholder="Write a message…" aria-label="Write a message"></textarea><button type="submit" '+(IN412.sending?'disabled':'')+' aria-label="Send message">Send</button></form>';
}
function in412FullRenderer(){
 in412EnsureAccount();
 return '<section class="in412-page"><header class="in412-header"><div><span class="in412-eyebrow">MEDIAFLOW PLUS · COMMUNITY</span><h1>Inbox</h1><p>Private conversations, all in one place.</p></div><button type="button" class="btn" onclick="App.in412Refresh()">Refresh</button></header>'+
 '<div class="in412-alert" id="in412-alert" role="status">'+in412Esc(IN412.error)+'</div>'+
 '<div class="in412-workspace"><aside class="in412-sidebar" aria-label="Conversations"><h2>Messages <span class="in412-count">'+in412Unread()+' unread</span></h2>'+in412ThreadsHtml(false)+'</aside>'+
 '<section class="in412-conversation" aria-label="Selected conversation">'+in412MessagesHtml(false)+'</section></div></section>';
}
function in412MiniHtml(){
 return '<div class="in412-mini-top"><strong>Inbox</strong><span>'+in412Unread()+' unread</span><button type="button" aria-label="Close mini inbox" onclick="App.in412Toggle()">×</button></div>'+
 '<div class="in412-mini-alert" role="status">'+in412Esc(IN412.error)+'</div>'+
 '<div class="in412-mini-body">'+(IN412.thread?'<button type="button" class="in412-back" onclick="App.in412Back()">← Conversations</button>'+in412MessagesHtml(true):in412ThreadsHtml(true))+'</div>'+
 '<div class="in412-mini-footer"><button type="button" onclick="App.in412Open()">Open full Inbox →</button></div>';
}
function in412MountFloat(){
 in412EnsureAccount();
 const old=document.getElementById('in412-float-wrap');
 if(!AUTH_READY||!AUTH_USER){old?.remove();return;}
 const host=old||document.createElement('div');
 if(old&&document.activeElement?.closest?.('#in412-float-wrap .in412-compose'))return;
 host.id='in412-float-wrap';host.className='in412-floating';
 host.innerHTML='<button type="button" class="in412-fab" onclick="App.in412Toggle()" aria-label="Open mini inbox" aria-expanded="'+String(IN412.mini)+'">'+in412Icon()+
 (in412Unread()?'<span class="in412-fab-badge">'+Math.min(in412Unread(),99)+'</span>':'')+'</button>'+
 (IN412.mini?'<section class="in412-mini-panel" role="dialog" aria-label="Mini inbox">'+in412MiniHtml()+'</section>':'');
 if(!old)document.body.appendChild(host);
 const scroll=host.querySelector('#in412-mini-scroll');if(scroll)scroll.scrollTop=scroll.scrollHeight;
}
function in412RefreshViews(){
 const root=document.getElementById('view-root');
 if(String(S.view||'')==='inbox'&&root){
  const current=document.activeElement;
  if(!IN412.sending&&current?.closest?.('#view-root .in412-compose')){in412MountFloat();return;}
  const focusField=current?.matches?.('.in412-search-row input')?{sel:current.selectionStart}:null;
  root.innerHTML='<div class="fade-in">'+in412FullRenderer()+'</div>';
  if(focusField){const input=root.querySelector('.in412-search-row input');input?.focus({preventScroll:true});try{input?.setSelectionRange(focusField.sel,focusField.sel)}catch(_){}}
  const scroll=root.querySelector('#in412-full-scroll');if(scroll)scroll.scrollTop=scroll.scrollHeight;
 }
 in412MountFloat();
}
async function in412MarkRead(){
 const me=in412Me(),thread=IN412.thread;
 if(!me||!thread)return;
 const unread=IN412.rows.filter(m=>String(m.recipient_id)===me&&String(m.sender_id)===thread&&!m.read_at);
 if(!unread.length)return;
 const ids=unread.map(m=>m.id);
 const now=new Date().toISOString();
 const res=await supabase.from('mfp_messages').update({read_at:now}).in('id',ids).eq('recipient_id',me);
 if(res.error){console.warn('Inbox read receipt could not save',res.error);return;}
 for(const m of unread)m.read_at=now;
 in412RefreshViews();
}
async function in412Fetch(){
 in412EnsureAccount();
 const me=in412Me();
 if(!me||!supabase){IN412.error='Please sign in to use Inbox.';IN412.loaded=true;in412RefreshViews();return;}
 if(IN412.loading)return;
 const epoch=++IN412.epoch;IN412.loading=true;
 try{
  const results=await Promise.all([
   supabase.from('mfp_messages').select('id,sender_id,recipient_id,body,created_at,read_at').or('sender_id.eq.'+me+',recipient_id.eq.'+me).order('created_at',{ascending:false}).limit(800),
   supabase.from('mfp_profiles').select('user_id,username,display_name,avatar_url').limit(300)
  ]);
  if(epoch!==IN412.epoch)return;
  for(const r of results)if(r.error)throw r.error;
  IN412.rows=results[0].data||[];IN412.profiles=results[1].data||[];IN412.error='';IN412.loaded=true;IN412.last=Date.now();
  in412RefreshViews();
  if(IN412.thread)void in412MarkRead();
 }catch(e){IN412.error='Messages could not load. Check your connection and retry.';console.error('MediaFlow Plus Inbox',e);in412RefreshViews();}
 finally{IN412.loading=false;}
}
function in412Select(id){IN412.thread=String(id||'');in412RefreshViews();void in412MarkRead();}
function in412Back(){IN412.thread='';in412RefreshViews();}
function in412Filter(term){
 IN412.search=String(term||'');
 const host=IN412.mini?document.querySelector('#in412-float-wrap'):document.querySelector('#view-root');
 const row=host?.querySelector('.in412-search-row');
 if(!row)return;
 // Replace only result rows. The actual search input stays mounted and focused.
 const parent=row.parentElement,fragment=document.createElement('div');
 fragment.innerHTML=in412ThreadsHtml(IN412.mini);
 fragment.querySelector('.in412-search-row')?.remove();
 for(const el of [...parent.children]){
  if(el!==row&&el.matches('.in412-thread,.in412-empty,.in412-composer-helper'))el.remove();
 }
 while(fragment.firstElementChild)parent.appendChild(fragment.firstElementChild);
}
function in412New(){const name=String(document.getElementById('in412-recipient')?.value||'').trim().toLowerCase();
 const p=IN412.profiles.find(x=>x.username===name);
 if(!p){IN412.error='No public Community account with that username was found.';in412RefreshViews();return;}
 if(p.user_id===in412Me()){IN412.error='You cannot message yourself.';in412RefreshViews();return;}
 IN412.error='';in412Select(p.user_id);
}
async function in412Send(e){
 e.preventDefault();if(IN412.sending||!IN412.thread||!AUTH_USER)return false;
 const body=String(new FormData(e.target).get('body')||'').trim();
 if(!body||body.length>2000)return false;
 IN412.sending=true;
 try{
  const r=await supabase.from('mfp_messages').insert({sender_id:in412Me(),recipient_id:IN412.thread,body});
  if(r.error)throw r.error;
  IN412.error='';await in412Fetch();
 }catch(err){IN412.error=String(err?.message||'Message was not sent.');in412RefreshViews();}
 finally{IN412.sending=false;}
 return false;
}
function in412Toggle(){IN412.mini=!IN412.mini;in412MountFloat();if(IN412.mini)void in412Fetch();}
function in412Open(){IN412.mini=false;S.view='inbox';render();void in412Fetch();}
function in412Refresh(){void in412Fetch();}
function in412MessageTo(id){IN412.thread=String(id||'');IN412.mini=false;S.view='inbox';render();void in412Fetch();}
function in412Subscribe(){
 const me=in412Me();
 if(!me||!supabase?.channel)return;
 if(IN412.channelUser===me&&IN412.channel)return;
 if(IN412.channel)try{supabase.removeChannel(IN412.channel)}catch(_){}
 IN412.channelUser=me;
 try{
  IN412.channel=supabase.channel('mfp412-inbox-'+me).on('postgres_changes',{event:'*',schema:'public',table:'mfp_messages'},payload=>{
   if(payload?.new?.sender_id===me||payload?.new?.recipient_id===me||payload?.old?.sender_id===me||payload?.old?.recipient_id===me)
    void in412Fetch();
  }).subscribe();
 }catch(e){console.warn('Inbox realtime unavailable; background refresh remains enabled.',e);}
}
function in412Init(){
 if(!NAV_ITEMS.some(n=>n.id==='inbox'))NAV_ITEMS.splice(Math.max(0,NAV_ITEMS.length-2),0,{id:'inbox',label:'Inbox'});
 if(!MOBILE_MORE_NAV.includes('inbox'))MOBILE_MORE_NAV.unshift('inbox');
 ICONS.inbox=in412Icon();
 if(typeof v161NormalizeNavLayout==='function')S.navLayout=v161NormalizeNavLayout(S.navLayout);
 if(Array.isArray(MFP408_TABS)){const row=MFP408_TABS.find(x=>x[0]==='messages');if(row)row[1]='Inbox';}
 const legacy=App.mfp408Tab;App.mfp408Tab=function(tab){return tab==='messages'?in412Open():legacy(tab);};
 App.mfp408MessageTo=in412MessageTo;
}
in412Init();
MediaFlowRuntime.registerPageRenderer('inbox',in412FullRenderer);
MediaFlowRuntime.registerPageEnhancer('inbox',()=>{in412Subscribe();void in412Fetch();});
Object.assign(App,{in412Select,in412Back,in412Filter,in412New,in412Send,in412Toggle,in412Open,in412Refresh,in412MessageTo});
function in412Pulse(){
 try{
  if(!AUTH_READY||!AUTH_USER){if(IN412.channel&&supabase?.removeChannel)void supabase.removeChannel(IN412.channel);IN412.channel=null;IN412.channelUser='';IN412.mini=false;in412MountFloat();return;}
  in412MountFloat();in412Subscribe();
  if((IN412.mini||String(S.view||'')==='inbox'||Date.now()-IN412.last>60000)&&document.visibilityState==='visible')void in412Fetch();
 }catch(e){console.warn('Inbox background refresh skipped',e)}
}
setInterval(in412Pulse,25000);
setInterval(()=>{try{in412MountFloat()}catch(_){}},3500);
setTimeout(in412Pulse,1000);
window.MediaFlowPlusInbox412={release:412,refresh:in412Fetch,state:()=>({loaded:IN412.loaded,unread:in412Unread(),threadCount:in412Threads().length})};
})();