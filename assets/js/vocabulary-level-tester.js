(() => {
'use strict';
// Drop the old engagement handler's control text before it reaches analytics.
const sharedTrack=window.elTrack;
if(typeof sharedTrack==='function')window.elTrack=function(name,params){return sharedTrack(name,name==='tool_use'?{tool_path:location.pathname}:params);};

const $=id=>document.getElementById(id);
const bands=[["rights", "go", "steal", "except", "weight", "yesterday", "return", "spend"], ["heaven", "shift", "bump", "alter", "mental", "knit", "awkward", "comment"], ["define", "assess", "asset", "airline", "transact", "inject", "boost", "factory"], ["abrupt", "matrix", "compile", "absurd", "competence", "tribunal", "compliance", "strap"], ["synthetic", "communal", "bowel", "dispense", "sacks", "comb", "circus", "theological"]];
const fake=['nustelv','plamvish','drelpish','tromvick','sprolven','flanterp','glostive','prenthil','vasklorn','brumvess'];
let items=[],answers=[],index=0,complete=false;
function shuffle(a){for(let i=a.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function start(){items=shuffle(bands.flatMap((list,band)=>list.map(word=>({word,band,real:true}))).concat(fake.map(word=>({word,band:-1,real:false}))));answers=Array(50).fill(null);index=0;complete=false;$('vocab-task').hidden=false;$('vocab-result-body').hidden=true;$('vocab-placeholder').hidden=false;$('vocab-result').classList.remove('is-complete');render();}
function render(){ $('vocab-word').textContent=items[index].word;$('vocab-progress').textContent='Word '+(index+1)+' of 50';$('vocab-bar').value=answers.filter(a=>typeof a==='boolean').length;$('vocab-back').disabled=index===0; }
function answer(yes){if(complete)return;answers[index]=yes;if(index<49){index++;render();}else finish();}
function finish(){if(complete)return;complete=true;$('vocab-task').hidden=true;$('vocab-placeholder').hidden=true;$('vocab-result-body').hidden=false;$('vocab-result').classList.add('is-complete');
 const hits=bands.map((_,b)=>items.reduce((n,item,i)=>n+(item.real&&item.band===b&&answers[i]===true?1:0),0));
 const alarms=items.reduce((n,item,i)=>n+(item.real===false&&answers[i]===true?1:0),0),f=alarms/10;
 $('vocab-counts').textContent=hits.reduce((a,b)=>a+b,0)+' of 40 real words marked Yes. '+alarms+' of 10 made-up words marked Yes.';
 $('vocab-bands').replaceChildren();hits.forEach((n,b)=>{const row=document.createElement('tr');const a=document.createElement('th');a.scope='row';a.textContent=(b*1000+1).toLocaleString('en-US')+' to '+((b+1)*1000).toLocaleString('en-US');const c=document.createElement('td');c.textContent=n+' of 8';row.append(a,c);$('vocab-bands').append(row);});
 if(alarms>=5){$('vocab-range').textContent='No reliable estimate';$('vocab-result-note').textContent='You marked many made-up words Yes. Try again and choose No when you are not sure.';}
 else {const total=hits.reduce((n,h)=>n+1000*Math.max(0,(h/8-f)/(1-f)),0);const low=Math.floor(Math.max(0,total-1000)/500)*500;const high=Math.ceil(Math.min(5000,total+1000)/500)*500;$('vocab-range').textContent=low.toLocaleString('en-US')+' to '+high.toLocaleString('en-US')+' word families';$('vocab-result-note').textContent='An early estimate of word recognition within the first 5,000 families. You may know words beyond this range.';}
 if(window.elTrack)window.elTrack('tool_result',{tool:'vocabulary-level-tester'});$('vocab-result-heading').focus();
}
$('vocab-yes').addEventListener('click',()=>answer(true));$('vocab-no').addEventListener('click',()=>answer(false));$('vocab-back').addEventListener('click',()=>{if(index>0&&complete===false){index-=1;render();}});$('vocab-restart').addEventListener('click',start);$('vocab-retake').addEventListener('click',()=>{start();$('vocab-yes').focus();});start();
})();
