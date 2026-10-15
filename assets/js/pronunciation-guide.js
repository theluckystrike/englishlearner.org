(() => {
'use strict';
// Drop the old engagement handler's control text before it reaches analytics.
const sharedTrack=window.elTrack;
if(typeof sharedTrack==='function')window.elTrack=function(name,params){return sharedTrack(name,name==='tool_use'?{tool_path:location.pathname}:params);};

const $ = id => document.getElementById(id);
let dict = null, spokenText = '', voices = [], submittedText = '';
const phones = {AA:'ɑ',AE:'æ',AH:'ʌ',AO:'ɔ',AW:'aʊ',AY:'aɪ',B:'b',CH:'tʃ',D:'d',DH:'ð',EH:'ɛ',ER:'ɝ',EY:'eɪ',F:'f',G:'ɡ',HH:'h',IH:'ɪ',IY:'iː',JH:'dʒ',K:'k',L:'l',M:'m',N:'n',NG:'ŋ',OW:'oʊ',OY:'ɔɪ',P:'p',R:'r',S:'s',SH:'ʃ',T:'t',TH:'θ',UH:'ʊ',UW:'uː',V:'v',W:'w',Y:'j',Z:'z',ZH:'ʒ'};
const onsets = new Set('B CH D DH F G HH JH K L M N P R S SH T TH V W Y Z B_R B_L D_R F_R F_L G_R G_L K_R K_L K_W P_R P_L S_K S_L S_M S_N S_P S_T S_W SH_R T_R TH_R TH_W S_K_R S_K_W S_P_R S_P_L S_T_R'.split(' '));
function ipa(raw) {
 const ps=raw.split(' '), vowels=[]; ps.forEach((p,i)=>{if(/[012]$/.test(p))vowels.push(i);});
 const stress=new Map();
 if($('optStress').checked && vowels.length>1)vowels.forEach((v,n)=>{
  const mark=ps[v].endsWith('1')?'ˈ':ps[v].endsWith('2')?'ˌ':''; if(mark.length===0)return;
  let start=n===0?0:v;
  if(n>0){for(let k=vowels[n-1]+1;k<v;k++){if(onsets.has(ps.slice(k,v).join('_'))){start=k;break;}}}
  stress.set(start,mark);
 });
 return ps.map((p,i)=>{const base=p.replace(/[012]/g,'');let sound=phones[base];if(p==='AH0')sound='ə';if(p==='ER0')sound='ɚ';return (stress.get(i)||'')+sound;}).join('');
}
function updateVoices(){
 if(('speechSynthesis' in window)===false){ $('voice-status').textContent='This browser has no speech service.';return; }
 voices=speechSynthesis.getVoices(); const lang=$('accent').value;
 const available=voices.some(v=>v.lang.toLowerCase().replace('_','-')===lang.toLowerCase());
 $('listen').disabled=available===false||spokenText.length===0; $('stop-listen').disabled=available===false;
 $('voice-status').textContent=available?'A voice is available for this accent.':'No voice is available for this accent in this browser.';
}
function render(track){
 if(dict===null)return;
 const text=track?$('inp').value.trim():submittedText;if(track)submittedText=text;$('out').replaceChildren();spokenText='';
 if(text.length===0){$('pron-summary').textContent='Enter an English word first.';$('pron-status').textContent='No words to look up.';updateVoices();return;}
 // Keep non-English text and numbers visible as unsupported tokens. Never drop them silently.
 const tokens=text.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)||[];
 let known=0;
 tokens.forEach(token=>{
  const key=token.toLowerCase().replace(/’/g,"'");const variants=Object.prototype.hasOwnProperty.call(dict,key)?dict[key]:null;
  const item=document.createElement('article');item.className='ref-word';const title=document.createElement('h3');title.textContent=token;item.append(title);
  const value=document.createElement('p');value.className='ref-ipa ipa';
  if(variants){const forms=[...new Set(variants.map(ipa))];value.textContent=forms.map(x=>'/'+x+'/').join(' or ');known++;}
  else {value.textContent='IPA not known';value.className='helper';}
  item.append(value);const note=document.createElement('p');note.className='helper';note.textContent=variants?'American dictionary '+(variants.length>1?'forms. Check the meaning.':'form. Check the context.'):'This word is not in this list.';item.append(note);$('out').append(item);
 });
 if(tokens.length===0){$('pron-summary').textContent='Enter an English word first.';$('pron-status').textContent='No words to look up.';updateVoices();return;}
 $('pron-summary').textContent=known+' of '+tokens.length+' words found. '+(tokens.length-known)+' without IPA.';
 $('pron-status').textContent=submittedText===$('inp').value.trim()?'Lookup complete. '+known+' words found.':'These forms are from your previous lookup. Choose Look up IPA to update them.';$('pron-result').classList.add('is-complete');
 // The submitted text stays here. Settings rerenders do not replace it or send another event.
 spokenText=tokens.filter(t=>/^[a-z'’-]+$/i.test(t)).join(' ');updateVoices();
 if(track){if(window.elTrack)window.elTrack('tool_result',{tool:'pronunciation-guide'});$('pron-heading').focus();}
}
$('pron-form').addEventListener('submit',e=>{e.preventDefault();render(true);});
$('optStress').addEventListener('change',()=>{if($('pron-result').classList.contains('is-complete'))render(false);});
$('inp').addEventListener('input',()=>{$('pron-status').textContent='Choose Look up IPA to update the result.';$('listen').disabled=true;});
$('accent').addEventListener('change',updateVoices);
$('listen').addEventListener('click',()=>{const voice=voices.find(v=>v.lang.toLowerCase().replace('_','-')===$('accent').value.toLowerCase());if(voice===undefined||spokenText.length===0)return;speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(spokenText);utterance.voice=voice;utterance.lang=$('accent').value;utterance.onerror=()=>{$('listen-status').textContent='The voice could not finish. Try again.';};utterance.onend=()=>{$('listen-status').textContent='Listening finished.';};$('listen-status').textContent='Listening.';speechSynthesis.speak(utterance);});
$('stop-listen').addEventListener('click',()=>{if('speechSynthesis' in window)speechSynthesis.cancel();$('listen-status').textContent='Listening stopped.';});
if('speechSynthesis' in window){speechSynthesis.addEventListener('voiceschanged',updateVoices);window.addEventListener('pagehide',()=>speechSynthesis.cancel());}updateVoices();
fetch('cmu-common.json').then(r=>{if(r.ok===false)throw Error();return r.json();}).then(data=>{dict=data;$('pron-submit').disabled=false;$('pron-status').textContent='Word list ready.';}).catch(()=>{$('pron-status').textContent='The word list could not load. Reload this page to try again.';});
})();
