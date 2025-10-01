const LSTAG = 'winter-arc-pwa-v1';
const DEFAULT_HABITS = [
  { id: 'read_bible', label: 'Read Bible' },
  { id: 'read_book', label: 'Read a book' },
  { id: 'eat_healthy', label: 'Eat healthy (no junk/sweets)' },
  { id: 'no_alcohol', label: 'No alcohol' },
  { id: 'no_social_first30', label: 'No social media (first 30 days)' },
  { id: 'social_cap', label: '≤ 30 min social (after 30 days)' },
  { id: 'exercise', label: 'Exercise (run or gym)' },
  { id: 'walk_if_no_exercise', label: 'Walk if not exercising' },
  { id: 'work_on_business', label: 'Work on business/side hustle' },
  { id: 'track_calories', label: 'Track calories in CalAI' },
];

const todayStr = (d=new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

function loadState(){
  try { return JSON.parse(localStorage.getItem(LSTAG) || '{}'); } catch { return {}; }
}
function saveState(s){ localStorage.setItem(LSTAG, JSON.stringify(s)); }

function getSettings(state){
  return state.settings || { startDate: todayStr(), checkinTimes: ['08:00','13:00','20:00'], triState:true, reminders:true };
}

function getDay(state, date){
  const d = state.days?.[date];
  return d || { habits:{}, notes:'', weight:'', calories:'', socialMinutes:'' };
}
function setDay(state, date, patch){
  const cur = getDay(state, date);
  const next = typeof patch === 'function' ? patch(cur) : patch;
  state.days = state.days || {};
  state.days[date] = { ...cur, ...next };
}

function computeStreak(state, habitId, upToDate){
  let streak = 0; let d = new Date(upToDate); let curs = todayStr(d);
  while(true){
    const day = state.days?.[curs];
    if(!day) break;
    const val = day.habits?.[habitId] || 0;
    if(val !== 1) break;
    streak++;
    d = addDays(d, -1);
    curs = todayStr(d);
  }
  return streak;
}

function withinFirst30(startDate){
  const s = new Date(startDate); const now = new Date();
  const diff = Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate()) - new Date(s.getFullYear(),s.getMonth(),s.getDate()))/(1000*60*60*24));
  return { within: diff < 30, day: diff+1 };
}

const state = loadState();
if(!state.settings){ state.settings = getSettings(state); saveState(state); }

let selectedDate = todayStr();
render();

function render(){
  const settings = getSettings(state);
  const first30 = withinFirst30(settings.startDate);
  const day = getDay(state, selectedDate);

  // header
  document.querySelector('#dayLabel').textContent = `Day ${first30.day}${first30.within ? ' (First 30 days)' : ''}`;
  document.querySelector('#checkins').textContent = settings.checkinTimes.join(', ');
  const dateInput = document.querySelector('#dateInput');
  dateInput.value = selectedDate;
  dateInput.onchange = (e)=>{ selectedDate = e.target.value; render(); };

  // progress
  const total = DEFAULT_HABITS.length;
  const done = DEFAULT_HABITS.reduce((a,h)=> a + ((day.habits[h.id]||0)===1 ? 1:0), 0);
  const pct = total ? Math.round((done/total)*100) : 0;
  document.querySelector('#progressText').textContent = `${done}/${total} • ${pct}%`;
  document.querySelector('#progressBar').style.width = `${pct}%`;

  // habits
  const ul = document.querySelector('#habits');
  ul.innerHTML = '';
  DEFAULT_HABITS.forEach(h => {
    const disabledAfter30 = (h.id==='no_social_first30' && !first30.within);
    const disabledBefore31 = (h.id==='social_cap' && first30.within);
    const lock = disabledAfter30 || disabledBefore31;
    const val = day.habits[h.id] || 0; // 0, 0.5, 1

    const li = document.createElement('li');
    li.className = 'habit' + (lock ? ' lock' : '');

    const btn = document.createElement('button');
    btn.className = 'icon' + (val? ' filled': '');
    btn.ariaLabel = 'toggle';
    btn.disabled = lock;
    btn.onclick = () => {
      const tri = settings.triState;
      const next = tri ? (val===0 ? 0.5 : (val===0.5 ? 1 : 0)) : (val===1?0:1);
      setDay(state, selectedDate, (cur)=>({ habits: { ...cur.habits, [h.id]: next } }));
      saveState(state); render();
    };
    btn.innerHTML = val===1 ? '✔' : (val===0.5 ? '<span class=\"half\">½</span>' : '');

    const wrap = document.createElement('div');
    wrap.className = 'grow';
    const title = document.createElement('div');
    title.textContent = h.label;
    const streak = document.createElement('div');
    streak.className = 'badge';
    streak.textContent = `Streak: ${computeStreak(state, h.id, selectedDate)} days`;
    wrap.appendChild(title); wrap.appendChild(streak);

    li.appendChild(btn); li.appendChild(wrap);
    ul.appendChild(li);
  });

  // metrics + notes
  const weight = document.querySelector('#weight'); weight.value = day.weight || '';
  const cals = document.querySelector('#calories'); cals.value = day.calories || '';
  const mins = document.querySelector('#social'); mins.value = day.socialMinutes || '';
  const notes = document.querySelector('#notes'); notes.value = day.notes || '';

  // listeners
  document.querySelector('#saveWeight').onclick = ()=>{ setDay(state, selectedDate, { weight: weight.value }); saveState(state); alert('Weight saved');};
  weight.onchange = ()=>{ setDay(state, selectedDate, { weight: weight.value }); saveState(state); };
  cals.onchange = ()=>{ setDay(state, selectedDate, { calories: cals.value }); saveState(state); };
  mins.onchange = ()=>{ setDay(state, selectedDate, { socialMinutes: mins.value }); saveState(state); };
  notes.oninput = ()=>{ setDay(state, selectedDate, { notes: notes.value }); saveState(state); };

  // streak grid
  const sg = document.querySelector('#streakGrid'); sg.innerHTML = '';
  DEFAULT_HABITS.forEach(h => {
    const card = document.createElement('div'); card.className = 'card';
    const t = document.createElement('div'); t.textContent = h.label;
    const s = document.createElement('div'); s.className = 'small'; s.textContent = computeStreak(state, h.id, selectedDate) + ' days';
    card.appendChild(t); card.appendChild(s); sg.appendChild(card);
  });
}

document.querySelector('#resetDay').onclick = ()=>{
  setDay(state, selectedDate, { habits:{}, notes:'', weight:'', calories:'', socialMinutes:'' });
  saveState(state); render();
};

document.querySelector('#exportData').onclick = ()=>{
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'winter-arc-data-'+todayStr()+'.json'; a.click();
  URL.revokeObjectURL(url);
};

document.querySelector('#importData').onchange = (e)=>{
  const file = e.target.files?.[0]; if(!file) return;
  const r = new FileReader();
  r.onload = () => { try { const parsed = JSON.parse(r.result); Object.assign(state, parsed); saveState(state); alert('Imported!'); render(); } catch{ alert('Invalid file'); } };
  r.readAsText(file);
};

// Settings modal
const modal = document.querySelector('#settingsModal');
document.querySelector('#openSettings').onclick = ()=>{ modal.classList.remove('hidden'); loadSettingsToForm(); };
document.querySelector('#closeSettings').onclick = ()=>{ modal.classList.add('hidden'); };
document.querySelector('#saveSettings').onclick = ()=>{
  const sd = document.querySelector('#startDate').value;
  const times = document.querySelector('#checkins').value.split(',').map(x=>x.trim()).filter(Boolean);
  const tri = document.querySelector('#triState').checked;
  const rem = document.querySelector('#reminders').checked;
  state.settings = { startDate: sd || todayStr(), checkinTimes: times.length?times:['08:00','13:00','20:00'], triState: tri, reminders: rem };
  saveState(state); modal.classList.add('hidden'); render();
  // request notification permission
  if (rem && 'Notification' in window && Notification.permission !== 'granted') { Notification.requestPermission(); }
};

function loadSettingsToForm(){
  const s = getSettings(state);
  document.querySelector('#startDate').value = s.startDate;
  document.querySelector('#checkins').value = s.checkinTimes.join(', ');
  document.querySelector('#triState').checked = !!s.triState;
  document.querySelector('#reminders').checked = !!s.reminders;
}

// simple local reminder scheduling when app is open
function scheduleReminders(){
  const s = getSettings(state);
  if(!s.reminders || !('Notification' in window)) return;
  if(Notification.permission !== 'granted') return;

  function msUntil(tstr){
    const [h,m] = tstr.split(':').map(Number);
    const now = new Date(); const target = new Date();
    target.setHours(h,m,0,0);
    if(target < now) target.setDate(target.getDate()+1);
    return target - now;
  }
  s.checkinTimes.forEach(t=>{
    setTimeout(()=>{
      new Notification('Winter Arc check-in', { body: 'Open the tracker and tick today\\'s boxes ('+todayStr()+')' });
      scheduleReminders(); // reschedule after firing
    }, msUntil(t));
  });
}
if('Notification' in window) scheduleReminders();

// register SW
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./service-worker.js');
  });
}