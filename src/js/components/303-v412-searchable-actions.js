/* MediaFlow Plus v412 — searchable native-action adapters.
 * Existing Library/Collection actions remain canonical; the adapter only
 * supplies searchable Settings-ordered/icon-aware options and dispatches the
 * original select's change event when a member explicitly chooses an item.
 */
(function(){
'use strict';
const MF412_ACTION={active:null,menu:null,pending:false,bound:false};
const MF412_STATUS_ICONS={planned:'planToWatch',active:'watching',paused:'onHold',completed:'completedStatus',dropped:'dropped'};
const MF412_PRIORITY_ICONS={low:'priorityLow',medium:'priorityMedium',high:'priorityHigh'};
function mf412ActionKind(el){
 const cmd=String(el?.getAttribute?.('onchange')||'');
 if(!/(?:App\.batchLibrary|App\.v274BatchCollection)(?:Status|Priority|Category)/.test(cmd))return '';
 if(/(?:Status)\(/.test(cmd))return 'status';
 if(/(?:Priority)\(/.test(cmd))return 'priority';
 if(/(?:Category)\(/.test(cmd))return 'category';
 return '';
}
function mf412ActionEntries(kind,select){
 const valid=new Set([...select.options].map(o=>String(o.value)).filter(Boolean));
 const surface=kind==='category'?'setCategory':kind==='status'?'setStatus':'setPriority';
 const known=kind==='category'
  ?(S.categories||[]).filter(c=>c?.id).map(c=>String(c.id))
  :kind==='status'?['planned','active','paused','completed','dropped']:['high','medium','low'];
 let ids;
 try{ids=v230VisibleIds(surface).map(String).filter(id=>valid.has(id));}
 catch(_){ids=[];}
 for(const id of known)if(valid.has(id)&&!ids.includes(id))ids.push(id);
 const categories=new Map((S.categories||[]).filter(x=>x?.id).map(x=>[String(x.id),x]));
 return ids.map(id=>{
  if(kind==='category'){const cat=categories.get(id);return cat?{id,label:String(cat.name||'Unnamed category'),icon:typeof v144CategoryIconHtml==='function'?v144CategoryIconHtml(cat):''}:null;}
  if(kind==='status')return {id,label:typeof v199StatusLabel==='function'?v199StatusLabel(id):id,icon:V225_BUTTON_ICONS[MF412_STATUS_ICONS[id]]||''};
  return {id,label:id.slice(0,1).toUpperCase()+id.slice(1),icon:V225_BUTTON_ICONS[MF412_PRIORITY_ICONS[id]]||''};
 }).filter(Boolean);
}
function mf412CloseAction(){
 const active=MF412_ACTION.active;
 if(active?.trigger?.isConnected){active.trigger.setAttribute('aria-expanded','false');}
 MF412_ACTION.menu?.remove();
 MF412_ACTION.menu=null;MF412_ACTION.active=null;
}
function mf412OpenAction(wrapper,select,trigger,kind){
 if(MF412_ACTION.active?.select===select){mf412CloseAction();return;}
 mf412CloseAction();
 if(typeof mf397SetMenu==='function')mf397SetMenu(false);
 const menu=document.createElement('section');
 menu.className='mf412-action-menu';
 menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Search '+kind+' options');
 const field=document.createElement('input');field.type='search';
 field.placeholder='Search '+kind+'…';field.setAttribute('aria-label','Search '+kind+' options');
 const options=document.createElement('div');options.className='mf412-action-options';options.setAttribute('role','listbox');
 menu.append(field,options);
 const entries=mf412ActionEntries(kind,select);
 function fill(){
  const q=field.value.trim().toLocaleLowerCase();
  const rows=entries.filter(x=>x.label.toLocaleLowerCase().includes(q));
  options.replaceChildren();
  if(!rows.length){const empty=document.createElement('p');empty.className='mf412-action-empty';empty.textContent='No matching '+kind+' options';options.append(empty);return;}
  for(const row of rows){
   const item=document.createElement('button');item.type='button';item.className='mf412-action-option';item.setAttribute('role','option');
   item.dataset.value=row.id;
   if(row.icon){const icon=document.createElement('span');icon.className='mf412-action-icon';icon.innerHTML=row.icon;item.append(icon);}
   const label=document.createElement('span');label.textContent=row.label;item.append(label);
   item.addEventListener('click',()=>{
    if(!select.isConnected)return mf412CloseAction();
    const current=select.value;
    select.value=row.id;
    if(select.value===row.id)select.dispatchEvent(new Event('change',{bubbles:true}));
    if(select.isConnected)select.value=current||'';
    mf412CloseAction();
   });
   options.append(item);
  }
 }
 field.addEventListener('input',fill);
 field.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();mf412CloseAction();trigger.focus({preventScroll:true});}
  if(e.key==='ArrowDown'){e.preventDefault();options.querySelector('button')?.focus({preventScroll:true});}
  if(e.key==='Enter'){e.preventDefault();options.querySelector('button')?.click();}
 });
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();mf412CloseAction();trigger.focus({preventScroll:true});}});
 document.body.append(menu);
 MF412_ACTION.active={wrapper,select,trigger};MF412_ACTION.menu=menu;
 trigger.setAttribute('aria-expanded','true');
 const r=trigger.getBoundingClientRect(),width=Math.min(340,innerWidth-24);
 const left=Math.max(12,Math.min(innerWidth-width-12,r.left));
 const below=innerHeight-r.bottom,menuH=305;
 const top=below>=Math.min(menuH,innerHeight*.46)?r.bottom+6:Math.max(10,r.top-Math.min(menuH,innerHeight*.48)-6);
 menu.style.left=left+'px';menu.style.top=top+'px';menu.style.width=width+'px';menu.style.maxHeight=Math.min(menuH,innerHeight-top-12)+'px';
 fill();field.focus({preventScroll:true});
}
function mf412UpgradeActions(){
 if(!['library','collections'].includes(String(S.view||''))){mf412CloseAction();return;}
 const host=document.getElementById('view-root');if(!host)return;
 for(const select of host.querySelectorAll('select[onchange]')){
  if(select.dataset.mf412Action==='1')continue;
  const kind=mf412ActionKind(select);if(!kind)continue;
  const wrapper=document.createElement('span');wrapper.className='mf412-action-wrap';
  select.before(wrapper);wrapper.append(select);
  select.dataset.mf412Action='1';select.classList.add('mf412-native-select');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
  const trigger=document.createElement('button');trigger.type='button';trigger.className='mf412-action-trigger';
  trigger.textContent=kind==='category'?'Move to Category…':kind==='status'?'Set Status…':'Set Priority…';
  trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-label','Searchable '+trigger.textContent);
  trigger.addEventListener('click',()=>mf412OpenAction(wrapper,select,trigger,kind));
  wrapper.append(trigger);
 }
 if(MF412_ACTION.active&&!MF412_ACTION.active.select.isConnected)mf412CloseAction();
}
function mf412ActionSchedule(){
 if(MF412_ACTION.pending)return;MF412_ACTION.pending=true;
 queueMicrotask(()=>{MF412_ACTION.pending=false;try{mf412UpgradeActions();}catch(e){console.error('MediaFlow Plus action picker',e)}});
}
const mf412ActionRenderBase=renderView;
renderView=function(){const result=mf412ActionRenderBase.apply(this,arguments);mf412ActionSchedule();return result;};
const mf412ActionPageBase=render;
render=function(){const result=mf412ActionPageBase.apply(this,arguments);mf412ActionSchedule();return result;};
if(!MF412_ACTION.bound){
 MF412_ACTION.bound=true;
 document.addEventListener('pointerdown',e=>{
  if(MF412_ACTION.active&&!MF412_ACTION.menu?.contains(e.target)&&!MF412_ACTION.active.trigger?.contains(e.target))mf412CloseAction();
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&MF412_ACTION.active)mf412CloseAction();});
 window.addEventListener('scroll',()=>{if(MF412_ACTION.active)mf412CloseAction();},true);
 window.addEventListener('resize',()=>{if(MF412_ACTION.active)mf412CloseAction();},{passive:true});
}
MediaFlowRuntime.version=412;
window.MediaFlowPlusSearchableActions={version:412,refresh:mf412ActionSchedule};
})();
