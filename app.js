
(function(){
  'use strict';
  var VERSION='v4d';
  var LSTAG='winter-arc-pwa-v4';
  var DEFAULT_HABITS=[
    {id:'read_bible',label:'Read Bible'},
    {id:'read_book',label:'Read a book'},
    {id:'eat_healthy',label:'Eat healthy (no junk/sweets)'},
    {id:'no_alcohol',label:'No alcohol'},
    {id:'no_social_first30',label:'No social media (first 30 days)'},
    {id:'social_cap',label:'≤ 30 min social (after 30 days)'},
    {id:'exercise',label:'Exercise (run or gym)'},
    {id:'walk_if_no_exercise',label:'Walk if not exercising'},
    {id:'work_on_business',label:'Work on business/side hustle'},
    {id:'track_calories',label:'Track calories in CalAI'}
  ];
  function log(msg){ var el=document.querySelector('#log'); if(el){ el.textContent += msg + '\\n'; } }
  function todayStr(d){ d=d||new Date(); return new Date(d.getFullYear(),d.getMonth(),d.getDate()).toISOString().slice(0,10); }
  function addDays(d,n){ var x=new Date(d); x.setDate(x.getDate()+n); return x; }
  function $(s){ return document.querySelector(s); }
  function load(){ try{ return JSON.parse(localStorage.getItem(LSTAG)||'{}'); }catch(_){ return {}; } }
  function save(s){ localStorage.setItem(LSTAG, JSON.stringify(s)); }
  var state = load(); if(!state.settings){ state={settings:{startDate:todayStr(),checkinTimes:['08:00','13:00','20:00'],triState:true,reminders:true}, days:{}}; save(state); }
  var selectedDate=todayStr();

  function render(){
    log('render called');
    var settings=state.settings || {};
    var sDate = settings.startDate || todayStr();
    var first30=(function(){ var s=new Date(sDate); var now=new Date(); var diff=Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate()) - new Date(s.getFullYear(),s.getMonth(),s.getDate()))/(1000*60*60*24)); return { within: diff<30, day: diff+1 }; })();
    var day = state.days[selectedDate] || {habits:{},notes:'',weight:'',calories:'',socialMinutes:''};
    $('#dayLabel').textContent='Day '+first30.day+(first30.within?' (First 30 days)':'');
    $('#checkinsDisplay').textContent=(settings.checkinTimes||[]).join(', ');
    $('#dateInput').value=selectedDate;
    var total=DEFAULT_HABITS.length;
    var done=DEFAULT_HABITS.reduce(function(a,h){ return a+(((day.habits[h.id]||0)===1)?1:0); },0);
    var pct= total? Math.round((done/total)*100):0;
    $('#progressText').textContent=done+'/'+total+' • '+pct+'%';
    $('#progressBar').style.width=pct+'%';
    var ul=$('#habits'); ul.innerHTML='';
    DEFAULT_HABITS.forEach(function(h){
      var disabledAfter30=(h.id==='no_social_first30' && !first30.within);
      var disabledBefore31=(h.id==='social_cap' && first30.within);
      var lock=disabledAfter30||disabledBefore31;
      var val=(day.habits[h.id]||0);
      var li=document.createElement('li'); li.className='habit'+(lock?' lock':'');
      var btn=document.createElement('button'); btn.className='icon'+(val?' filled':''); btn.disabled=lock;
      btn.onclick=function(){ var tri=settings.triState!==false; var next= tri ? (val===0?0.5:(val===0.5?1:0)) : (val===1?0:1); day.habits[h.id]=next; state.days[selectedDate]=day; save(state); render(); };
      btn.innerHTML= val===1? '✔' : (val===0.5? '<span class="half">½</span>' : '');
      var wrap=document.createElement('div'); wrap.className='grow'; var title=document.createElement('div'); title.textContent=h.label; var s=document.createElement('div'); s.className='small'; s.textContent='Streak: 0 days'; wrap.appendChild(title); wrap.appendChild(s);
      li.appendChild(btn); li.appendChild(wrap); ul.appendChild(li);
    });
    $('#weight').value=day.weight||''; $('#calories').value=day.calories||''; $('#social').value=day.socialMinutes||''; $('#notes').value=day.notes||'';
    $('#version').textContent=VERSION;
  }

  document.addEventListener('DOMContentLoaded', function(){
    log('DOMContentLoaded');
    $('#openSettings').onclick=function(){ $('#settingsOverlay').classList.remove('hidden'); };
    $('#closeSettings').onclick=function(){ $('#settingsOverlay').classList.add('hidden'); };
    $('#saveSettings').onclick=function(){ var s=state.settings||{}; s.startDate=$('#startDate').value||todayStr(); s.checkinTimes=$('#checkinsInput').value.split(',').map(function(x){return x.trim();}).filter(Boolean); s.triState=$('#triState').checked; s.reminders=$('#reminders').checked; state.settings=s; save(state); $('#settingsOverlay').classList.add('hidden'); render(); };
    $('#resetDay').onclick=function(){ state.days[selectedDate]={habits:{},notes:'',weight:'',calories:'',socialMinutes:''}; save(state); render(); };
    $('#exportData').onclick=function(){ var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='winter-arc-data-'+todayStr()+'.json'; a.click(); URL.revokeObjectURL(url); };
    $('#importData').onchange=function(e){ var f=e.target.files && e.target.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ try{ var parsed=JSON.parse(r.result); state=parsed; save(state); alert('Imported!'); render(); }catch(_){ alert('Invalid file'); } }; r.readAsText(f); };
    $('#saveWeight').onclick=function(){ var d=state.days[selectedDate]||{}; d.weight=$('#weight').value; state.days[selectedDate]=d; save(state); alert('Weight saved'); };
    $('#calories').onchange=function(){ var d=state.days[selectedDate]||{}; d.calories=$('#calories').value; state.days[selectedDate]=d; save(state); };
    $('#social').onchange=function(){ var d=state.days[selectedDate]||{}; d.socialMinutes=$('#social').value; state.days[selectedDate]=d; save(state); };
    $('#notes').oninput=function(){ var d=state.days[selectedDate]||{}; d.notes=$('#notes').value; state.days[selectedDate]=d; save(state); };
    render();
  });
})();
