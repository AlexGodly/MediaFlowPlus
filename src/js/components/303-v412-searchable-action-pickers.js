/* MediaFlow Plus v412 (WIP) — searchable, settings-ordered action pickers.
 * The original <select> and its canonical onchange handler remain the only
 * mutation path. Searching only filters options; it never assigns values.
 */
const MFP412_ACTION={host:null,menu:null,search:null,kind:'',bound:false};
function mfp412ActionKind(select){
 const first=(select?.options?.[0]?.textContent||'').trim().toLowerCase();
 if(/^(move to category|move to|set category)/.test(first))return 'category';
 if(/^set status/.test(first))return 'status';
 if(/^set priority/.test(first))return 'priority';
 return '';
}
function mfp412ActionOptions(kind){
 if(typeof v230VisibleIds!=='function')return [];
 const surfaces={category:'setCategory',status:'setStatus',priority:'setPriority'};
 const ids=v230VisibleIds(surfaces[kind])||[];
 const cats=new Map((S.categories||[]).filter(Boolean).map(c=>[String(c.id),c]));
 return ids.map(id=>{
  if(kind==='category'){
   const c=cats.get(String(id));
   if(!c)return null;
   return {id:String(id),label:String(c.name||'Untitled Category'),icon:typeof v144CategoryIconHtml==='function'?v144CategoryIconHtml(c):'◇'};
  }
  if(kind==='status')return {id:String(id),label:typeof v199StatusLabel==='function'?v199StatusLabel(id):String(id),icon:typeof v230StatusIcon==='function'?v230StatusIcon(id):'◉'};
  const name=String(id);return {id:name,label:name.slice(0,1).toUpperCase()+name.slice(1),icon:typeof v230PriorityIcon==='function'?v230PriorityIcon(id):'◇'};
 }).filter(Boolean);
}
function mfp412ActionClose(){
 const menu=MFP412_ACTION.menu;
 if(menu){menu.remove();MFP412_ACTION.menu=null;}
 MFP412_ACTION.host?.querySelector('.mfp412-action-trigger')?.setAttribute('aria-expanded','false');
 MFP412_ACTION.host=null;MFP412_ACTION.kind='';MFP412_ACTION.search=null;
}
function mfp412ActionFilter(value){
 const menu=MFP412_ACTION.menu;if(!menu)return;
 const q=String(value||'').trim().toLocaleLowerCase();
 let count=0;
 menu.querySelectorAll('.mfp412-action-option').forEach(btn=>{
  const matches=!q||String(btn.dataset.label||'').includes(q);
  btn.hidden=!matches;if(matches)count++;
 });
 const empty=menu.querySelector('.mfp412-action-empty');
 if(empty)empty.hidden=count!==0;
}
function mfp412ActionSelect(value){
 const host=MFP412_ACTION.host;
 const select=host?.querySelector('select');
 if(!host||!select)return mfp412ActionClose();
 // The original action remains canonical. Never modify state directly here.
 const option=[...select.options].find(x=>x.value===value);
 if(!option||!value)return mfp412ActionClose();
 select.value=value;
 select.dispatchEvent(new Event('change',{bubbles:true}));
 // Canonical bulk controls reset to the placeholder. Even if a handler leaves
 // the selected value in place, preserve the existing "Set..." affordance.
 if(select.isConnected)select.value='';
 mfp412ActionClose();
}
function mfp412ActionOpen(host){
 if(MFP412_ACTION.host===host){mfp412ActionClose();return;}
 mfp412ActionClose();
 const select=host.querySelector('select');
 const kind=mfp412ActionKind(select);if(!kind)return;
 const rows=mfp412ActionOptions(kind);
 const btn=host.querySelector('.mfp412-action-trigger');
 const menu=document.createElement('section');
 menu.className='mfp412-action-menu';menu.setAttribute('role','dialog');
 menu.setAttribute('aria-label','Search '+kind+' options');
 const heading=kind==='category'?'Move to category':kind==='status'?'Set status':'Set priority';
 const all=rows.map(x=>'<button type="button" class="mfp412-action-option" data-id="'+escapeHtml(x.id)+'" data-label="'+escapeHtml(x.label.toLocaleLowerCase())+'"><span aria-hidden="true" class="mfp412-action-icon">'+x.icon+'</span><span>'+escapeHtml(x.label)+'</span></button>').join('');
 menu.innerHTML='<label class="mfp412-action-search"><span>'+heading+'</span><input type="search" placeholder="Search '+kind+'…" aria-label="Search '+kind+' options" autocomplete="off"></label><div class="mfp412-action-options" role="listbox">'+all+'</div><p class="mfp412-action-empty" hidden>No matching options</p>';
 document.body.append(menu);
 const bounds=btn.getBoundingClientRect();
 const width=Math.min(300,window.innerWidth-20);
 const x=Math.max(10,Math.min(window.innerWidth-width-10,bounds.left));
 const available=window.innerHeight-bounds.bottom;
 menu.style.left=x+'px';
 menu.style.width=width+'px';
 menu.style.top=(available>=270?bounds.bottom+6:Math.max(10,bounds.top-Math.min(340,window.innerHeight*.52)-6))+'px';
 MFP412_ACTION.host=host;MFP412_ACTION.menu=menu;MFP412_ACTION.kind=kind;
 btn.setAttribute('aria-expanded','true');
 const input=menu.querySelector('input');
 MFP412_ACTION.search=input;
 input.addEventListener('input',()=>mfp412ActionFilter(input.value));
 menu.querySelectorAll('.mfp412-action-option').forEach(item=>{
  item.addEventListener('click',()=>mfp412ActionSelect(item.dataset.id));
 });
 input.focus({preventScroll:true});
}
function mfp412ActionScan(){
 // Upgrades only actual assignment dropdowns. Existing search/sort/filter
 // selectors elsewhere in MediaFlow are not replaced.
 document.querySelectorAll('#view-root select').forEach(select=>{
  const kind=mfp412ActionKind(select);
  if(!kind||select.dataset.mfp412Action==='1')return;
  // These controls apply immediate status/priority/category actions, not
  // Settings selectors. The placeholder and empty value are required.
  if(select.options[0]?.value!=='')return;
  const wrap=document.createElement('span');wrap.className='mfp412-action-wrap';
  select.before(wrap);wrap.append(select);select.dataset.mfp412Action='1';
  const button=document.createElement('button');
  button.type='button';button.className='mfp412-action-trigger';
  button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
  button.textContent=select.options[0]?.textContent||kind;
  wrap.append(button);
  button.addEventListener('click',()=>mfp412ActionOpen(wrap));
  select.classList.add('mfp412-original-select');
 });
 if(!MFP412_ACTION.bound){
  MFP412_ACTION.bound=true;
  document.addEventListener('pointerdown',event=>{
   if(!MFP412_ACTION.menu)return;
   if(MFP412_ACTION.menu.contains(event.target)||MFP412_ACTION.host?.contains(event.target))return;
   mfp412ActionClose();
  });
  document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&MFP412_ACTION.menu){event.stopPropagation();mfp412ActionClose();}
  });
  document.addEventListener('scroll',event=>{
   if(!MFP412_ACTION.menu)return;
   if(MFP412_ACTION.menu.contains(event.target))return;
   mfp412ActionClose();
  },true);
  window.addEventListener('resize',mfp412ActionClose);
 }
}
const mfp412ActionRenderBase=render;
render=function(){mfp412ActionClose();const result=mfp412ActionRenderBase.apply(this,arguments);requestAnimationFrame(mfp412ActionScan);return result;};
const mfp412ActionRenderViewBase=renderView;
renderView=function(){const result=mfp412ActionRenderViewBase.apply(this,arguments);requestAnimationFrame(mfp412ActionScan);return result;};
window.MediaFlowPlusActionPickers={version:412,scan:mfp412ActionScan,inspect:()=>({upgraded:document.querySelectorAll('.mfp412-action-wrap').length,menuOpen:!!MFP412_ACTION.menu})};
