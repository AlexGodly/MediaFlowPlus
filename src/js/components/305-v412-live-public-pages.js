/* MediaFlow Plus v412: public profile pages and live Top rankings.
 * All workspace sections are read-only, projected on request after opt-in.
 */
const MF412_PUBLIC={tab:'library',offset:0,request:0,top:null,section:null};
const MF412_PUBLIC_SECTIONS=[
 ['library','Library'],['history','History'],['order','Personal Order'],['old','Old System'],
 ['statistics','Statistics'],['ratings','Ratings'],['levels','Level']];
if(!MFP408_TABS.some(x=>x[0]==='top'))MFP408_TABS.splice(4,0,['top','Top titles']);
const mf412PublicBase=mfp412PublicProfileView;
mfp412PublicProfileView=function(profile){
 const html=mf412PublicBase.apply(this,arguments);
 const enabled=MF412_PUBLIC_SECTIONS.filter(([id])=>profile.visible_sections?.[id]);
 if(!enabled.length)return html;
 if(!enabled.some(([id])=>id===MF412_PUBLIC.tab))MF412_PUBLIC.tab=enabled[0][0];
 const tabs='<section class="mf412s-workspace"><h2>Public workspace</h2>'+
  '<p>These pages read the creator’s current MediaFlow Plus state. Only sections they expressly share are visible.</p>'+
  '<div class="mf412s-tabs">'+enabled.map(([id,name])=>
   '<button type="button" class="'+(MF412_PUBLIC.tab===id?'selected':'')+'" onclick="App.mf412PublicTab(\''+id+'\')">'+name+'</button>').join('')+'</div>'+
  '<div id="mf412s-content"><p class="mf412c-empty">Loading live workspace…</p></div></section>';
 // append inside the existing public profile panel, not into a separate dialog.
 return html.replace(/<\/section>$/,tabs+'</section>');
};
const mf412ProfileOldSave=App.mfp408SaveProfile;
// Existing saving does not reset per-section visibility, because it upserts
// only name/bio/avatar/public fields into the same user-owned profile row.
function mf412PublicSettings(){
 const flags=MF412_PUBLIC_SECTIONS.filter(([id])=>id!=='levels'||true);
 return '<section class="mfp408-card mf412s-sharing"><h3>Public workspace pages</h3>'+
  '<p>Choose exactly which pages others can view from your live workspace. Each permission is independent, off by default, and requires a public Community profile with its public showcase enabled.</p>'+
  '<div class="mf412s-settings">'+flags.map(([id,title])=>{
   const field=id==='order'?'show_personal_order':id==='old'?'show_old_system':'show_'+id;
   const on=MFP408.profile?.[field]===true;
   return '<label><input type="checkbox" data-mf412s-field="'+field+'" '+(on?'checked':'')+'>'+title+'</label>';
  }).join('')+'</div>'+
  '<button onclick="App.mf412SaveSections()">Save public pages</button></section>';
}
const mf412ProfileRowsBase=mfp408RenderRows;
mfp408RenderRows=function(){
 if(MFP408.tab==='top')return mf412TopHtml();
 let html=mf412ProfileRowsBase.apply(this,arguments);
 if(MFP408.tab==='profile')html+=mf412PublicSettings();
 return html;
};
async function mf412SaveSections(){
 if(!AUTH_USER||!MFP408.profile)return showToast('Create a Community profile first.');
 const fields=['show_library','show_history','show_personal_order','show_old_system','show_statistics','show_ratings','show_levels'];
 const data=Object.fromEntries(fields.map(field=>[field,document.querySelector('[data-mf412s-field="'+field+'"]')?.checked===true]));
 const on=fields.filter(k=>data[k]);
 if(on.length&&!confirm('Publish the selected pages from your current workspace? Turning any option off immediately removes that permission on future requests.'))return;
 const r=await supabase.from('mfp_profiles').update(data).eq('user_id',AUTH_USER.id);
 if(r.error)return showToast('Sharing preferences failed: '+r.error.message);
 Object.assign(MFP408.profile,data);
 const browse=document.getElementById('mf412c-optin');if(browse)browse.checked=!!data.show_library;
 showToast('Public workspace permissions saved ✓');
}
function mf412PublicItems(d){
 const e=mfp408Esc,items=d?.items||[];
 if(d?.summary){
  const summary=d.summary;
  if(summary.available===false)return '<p class="mf412c-empty">'+e(summary.note||'Not available yet')+'</p>';
  return '<div class="mf412s-summary">'+Object.entries(summary).filter(([k,v])=>typeof v==='number').map(([k,v])=>
   '<article><strong>'+Number(v).toLocaleString()+'</strong><small>'+e(k.replaceAll('_',' '))+'</small></article>').join('')+'</div>'+
   ((summary.by_status||[]).length?'<div class="mf412s-chips">'+summary.by_status.map(x=>'<span>'+e(x.name)+' · '+Number(x.count)+'</span>').join('')+'</div>':'');
 }
 if(!items.length)return '<p class="mf412c-empty">No items are available in this shared section.</p>';
 if(d.section==='old')return '<div class="mf412s-chips">'+items.map(x=>'<span>'+e(x.category)+' · '+Number(x.balance)+'</span>').join('')+'</div>';
 if(d.section==='history')return '<div class="mf412s-list">'+items.map(x=>'<article><h4>'+e(x.date||'Session')+'</h4>'+
  '<p>'+e(x.category||'')+' · '+Math.max(0,Number(x.minutes)||0)+' minutes</p>'+
  '<small>'+e((x.titles||[]).join(' · '))+'</small></article>').join('')+'</div>';
 return '<div class="mf412s-list">'+items.map(t=>'<article class="mf412s-title">'+
  (t.cover_url?'<img loading="lazy" src="'+e(t.cover_url)+'" alt="">':'<span class="mf412s-no-cover">MF+</span>')+
  '<div><h4>'+e(t.title)+'</h4><p>'+e(t.category||'')+(t.status?' · '+e(t.status):'')+
  (t.progress!=null?' · '+Number(t.progress)+'/'+(t.total==null?'?':Number(t.total)):'')+
  (t.rating!=null?' · ★ '+Number(t.rating).toFixed(1)+'/10':'')+'</p></div></article>').join('')+'</div>';
}
async function mf412PublicTab(section,offset=0){
 const info=MFP412_SHARE.publicInfo,profile=info?.data?.profile;
 if(!profile||!profile.visible_sections?.[section]||!MF412_PUBLIC_SECTIONS.some(([k])=>k===section))return;
 MF412_PUBLIC.tab=section;MF412_PUBLIC.offset=offset;
 const panel=document.querySelector('.mf412s-workspace');if(!panel)return;
 panel.querySelectorAll('.mf412s-tabs button').forEach(btn=>btn.classList.toggle('selected',btn.textContent===MF412_PUBLIC_SECTIONS.find(([k])=>k===section)?.[1]));
 const content=document.getElementById('mf412s-content');if(!content)return;
 const request=++MF412_PUBLIC.request,username=profile.username;
 content.innerHTML='<p class="mf412c-empty">Loading latest owner data…</p>';
 try{
  const d=await mfp412PublicApi({type:'section',username,section,offset,limit:30});
  if(request!==MF412_PUBLIC.request||location.hash!=='#/u/'+encodeURIComponent(username)||!content.isConnected)return;
  MF412_PUBLIC.section=d;
  content.innerHTML='<p class="mf412c-subtext">'+Number(d.total||0).toLocaleString()+' items · Live from owner</p>'+
   mf412PublicItems(d)+
   '<div class="mf412c-actions">'+(offset>0?'<button onclick="App.mf412PublicTab(\''+section+'\','+Math.max(0,offset-30)+')">← Previous</button>':'')+
   (d.next_offset!=null?'<button onclick="App.mf412PublicTab(\''+section+'\','+d.next_offset+')">Next →</button>':'')+'</div>';
 }catch(e){
  if(request===MF412_PUBLIC.request&&content.isConnected)content.innerHTML='<p class="mf412c-empty">'+mfp408Esc(e?.message||'Section unavailable')+'</p>'+
   '<button onclick="App.mf412PublicTab(\''+section+'\')">Retry</button>';
 }
}
const mf412OldRoute=mfp412Route;
mfp412Route=async function(){
 await mf412OldRoute.apply(this,arguments);
 if(MFP412_SHARE.publicInfo?.kind==='profile'&&document.getElementById('mf412s-content')){
  const p=MFP412_SHARE.publicInfo.data?.profile;
  const available=MF412_PUBLIC_SECTIONS.filter(([k])=>p?.visible_sections?.[k]);
  if(available.length)void mf412PublicTab(available.some(x=>x[0]===MF412_PUBLIC.tab)?MF412_PUBLIC.tab:available[0][0]);
 }
};
function mf412TopHtml(){
 const e=mfp408Esc,d=MF412_PUBLIC.top||{},rows=(d.titles||[]).filter(t=>t.rating_count>0);
 return '<section class="mf412c-page"><header class="mf412c-pagehead"><span class="mf412c-kicker">THE LEADERBOARD</span>'+
  '<h2>Top community titles</h2><p>Rankings calculated from ratings in currently public, opted-in MediaFlow Plus libraries — never from copied ratings.</p></header>'+
  (d.partial?'<p class="mf412c-empty">The live scan is capped. These are provisional ranks, not a verified worldwide leaderboard.</p>':'')+
  (rows.length?'<div class="mf412s-top">'+rows.map((t,i)=>'<article><span class="mf412s-rank">#'+(i+1)+'</span>'+
   (t.cover_url?'<img loading="lazy" alt="" src="'+e(t.cover_url)+'">':'<span class="mf412s-no-cover">MF+</span>')+
   '<div><h3>'+e(t.title)+'</h3><small>'+e(t.key)+'</small><p>★ '+Number(t.average_rating).toFixed(2)+'/10 · '+
   t.rating_count+' public rating'+(t.rating_count===1?'':'s')+'</p></div>'+
   '<button onclick="App.mfp408Tab(\'browse\')">Browse →</button></article>').join('')+'</div>':
   '<p class="mf412c-empty">There are no opted-in ratings available yet.</p>')+
   '<button onclick="App.mf412TopLoad()">Refresh live leaderboard</button></section>';
}
async function mf412TopLoad(){
 if(S.view!=='community'||MFP408.tab!=='top'||!AUTH_USER){
  if(!AUTH_USER)mfp408Failure('Your MediaFlow Plus session is unavailable. Sign in to see Community rankings.');
  return;
 }
 const request=++MF412_PUBLIC.request,host=document.getElementById('mfp408-content');
 if(host)host.innerHTML='<p class="mf412c-empty">Calculating public ratings from current workspaces…</p>';
 try{
  const result=await mfp412PublicApi({type:'browse',query:'',sort:'rated',offset:0,limit:40});
  if(request!==MF412_PUBLIC.request||MFP408.tab!=='top'||S.view!=='community')return;
  MF412_PUBLIC.top=result;
  if(host?.isConnected)host.innerHTML=mf412TopHtml();
 }catch(e){if(request===MF412_PUBLIC.request&&host?.isConnected)host.innerHTML='<p class="mf412c-empty">'+mfp408Esc(e?.message||'Rankings unavailable')+'</p>'+
  '<button onclick="App.mf412TopLoad()">Retry</button>';}
}
MediaFlowRuntime.registerPageEnhancer('community',()=>{if(MFP408.tab==='top')void mf412TopLoad();});
Object.assign(App,{mf412SaveSections,mf412PublicTab,mf412TopLoad});
