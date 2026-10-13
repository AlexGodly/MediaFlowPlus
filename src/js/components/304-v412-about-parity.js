/* MediaFlow Plus v412 — About-page content parity with Personal v408.
 * Personal source 064-v161-about-custom-navigation-data-audit.js has an identical
 * SHA in both editions. Preserve its FAQ/features/developer layout; ensure the
 * 'official' update checker and app link never point Plus back to Personal.
 */
(function(){
'use strict';
if(typeof V161_UPDATE_SOURCES!=='undefined'&&Array.isArray(V161_UPDATE_SOURCES)){
 V161_UPDATE_SOURCES.splice(0,V161_UPDATE_SOURCES.length,
  'https://raw.githubusercontent.com/AlexGodly/MediaFlowPlus/main/index.html',
  'https://alexgodly.github.io/MediaFlowPlus/');
}
if(typeof renderAbout==='function'){
 const original=renderAbout;
 renderAbout=function(){
  const html=String(original.apply(this,arguments));
  return html
   .replaceAll('https://alexgodly.github.io/MediaFlow/','https://alexgodly.github.io/MediaFlowPlus/')
   .replace('>MediaFlow v'+escapeHtml(v161CurrentVersion())+' · by Alex Godly<','>MediaFlow Plus v'+escapeHtml(v161CurrentVersion())+' · by Alex Godly<')
   .replace('ABOUT MEDIAFLOW</div>','ABOUT MEDIAFLOW PLUS</div>');
 };
}
window.MediaFlowPlusAboutParity={release:412,source:'Personal v408 About content; read-only comparison; Plus-specific update sources'};
})();