const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.dataset.tab;

    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(targetTab).classList.add('active');
  });
});

// ==== TIMER MƏNTİQİ ====

let currentMode = 'countup';
let timerInterval = null;
let elapsedSeconds = 0;
let remainingSeconds = 0;
let isRunning = false;

let breakInterval = null;
let breakRemainingSeconds = 0;

const modeButtons = document.querySelectorAll('.mode-btn');
const countdownInputWrap = document.getElementById('countdown-input-wrap');
const targetMinutesInput = document.getElementById('target-minutes');
const subjectInput = document.getElementById('subject-input');
const blockSelect = document.getElementById('block-select');
const noteInput = document.getElementById('note-input');
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const savedMsg = document.getElementById('session-saved-msg');

const breakPanel = document.getElementById('break-panel');
const breakOptionButtons = document.querySelectorAll('.break-option-btn');
const customBreakInput = document.getElementById('custom-break-input');
const customBreakBtn = document.getElementById('custom-break-btn');
const breakActiveWrap = document.getElementById('break-active-wrap');
const breakDisplay = document.getElementById('break-display');
const cancelBreakBtn = document.getElementById('cancel-break-btn');

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (isRunning) return;
    modeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;

    if (currentMode === 'countdown') {
      countdownInputWrap.classList.remove('hidden');
    } else {
      countdownInputWrap.classList.add('hidden');
    }
    updateDisplay();
  });
});

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

function pad(num) {
  return num.toString().padStart(2, '0');
}

function updateDisplay() {
  if (currentMode === 'countup') {
    timerDisplay.textContent = formatTime(elapsedSeconds);
  } else {
    timerDisplay.textContent = formatTime(remainingSeconds);
  }
}

startBtn.addEventListener('click', () => {
  if (!subjectInput.value.trim()) {
    alert('Zəhmət olmasa mövzu daxil et.');
    return;
  }

  if (currentMode === 'countdown' && remainingSeconds === 0) {
    const mins = parseInt(targetMinutesInput.value, 10) || 30;
    remainingSeconds = mins * 60;
  }

  isRunning = true;
  startBtn.classList.add('hidden');
  pauseBtn.classList.remove('hidden');
  stopBtn.classList.remove('hidden');
  subjectInput.disabled = true;
  noteInput.disabled = true;
  targetMinutesInput.disabled = true;
  blockSelect.disabled = true;
  savedMsg.classList.add('hidden');

  timerInterval = setInterval(() => {
    if (currentMode === 'countup') {
      elapsedSeconds++;
    } else {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        remainingSeconds = 0;
        updateDisplay();
        finishSession(true);
        return;
      }
    }
    updateDisplay();
  }, 1000);
});

pauseBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  isRunning = false;
  pauseBtn.classList.add('hidden');
  stopBtn.classList.add('hidden');
  breakPanel.classList.remove('hidden');
});

breakOptionButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const mins = parseInt(btn.dataset.mins, 10);
    startBreak(mins);
  });
});

customBreakBtn.addEventListener('click', () => {
  const mins = parseInt(customBreakInput.value, 10);
  if (!mins || mins <= 0) {
    alert('Zəhmət olmasa düzgün dəqiqə daxil et.');
    return;
  }
  startBreak(mins);
});

function startBreak(minutes) {
  breakPanel.classList.add('hidden');
  breakActiveWrap.classList.remove('hidden');
  breakRemainingSeconds = minutes * 60;
  breakDisplay.textContent = formatTime(breakRemainingSeconds);

  breakInterval = setInterval(() => {
    breakRemainingSeconds--;
    breakDisplay.textContent = formatTime(breakRemainingSeconds);
    if (breakRemainingSeconds <= 0) {
      endBreak(true);
    }
  }, 1000);
}

cancelBreakBtn.addEventListener('click', () => {
  endBreak(false);
});

function endBreak(playSound) {
  clearInterval(breakInterval);
  breakActiveWrap.classList.add('hidden');
  customBreakInput.value = '';
  if (playSound) {
    playChime('break');
  }
  startBtn.classList.remove('hidden');
  startBtn.textContent = 'Davam et';
}

stopBtn.addEventListener('click', () => {
  finishSession(false);
});

function finishSession(reachedTarget) {
  clearInterval(timerInterval);

  const minutesSpent = currentMode === 'countup'
    ? Math.round(elapsedSeconds / 60)
    : Math.round((parseInt(targetMinutesInput.value, 10) || 30) - remainingSeconds / 60);

  if (minutesSpent > 0) {
    saveSession(minutesSpent);
    savedMsg.classList.remove('hidden');
  }

  if (reachedTarget) {
    playChime('celebrate');
  }

  isRunning = false;
  elapsedSeconds = 0;
  remainingSeconds = 0;
  startBtn.classList.remove('hidden');
  startBtn.textContent = 'Başlat';
  pauseBtn.classList.add('hidden');
  stopBtn.classList.add('hidden');
  breakPanel.classList.add('hidden');
  breakActiveWrap.classList.add('hidden');
  subjectInput.disabled = false;
  noteInput.disabled = false;
  targetMinutesInput.disabled = false;
  blockSelect.disabled = false;
  updateDisplay();
}

function saveSession(minutes) {
  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  const today = new Date().toISOString().split('T')[0];

  sessions.push({
    date: today,
    subject: subjectInput.value.trim(),
    blockId: blockSelect.value || null,
    note: noteInput.value.trim(),
    minutes: minutes
  });

  localStorage.setItem('sessions', JSON.stringify(sessions));

  subjectInput.value = '';
  noteInput.value = '';
  blockSelect.value = '';
}

function playChime(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = type === 'break'
      ? [660, 880]
      : [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = now + i * 0.15;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch (e) {
    console.warn('Səs çalınmadı:', e);
  }
}

updateDisplay();

// ==== TAM EKRAN + WAKE LOCK + MOTİVASİYA LENTİ ====

const motivationBanner = document.getElementById('motivation-banner');
const motivationText = document.getElementById('motivation-text');
const fullscreenBtn = document.getElementById('fullscreen-btn');

const motivationPhrases = [
  'Sən bacarırsan! 🎀',
  'Bir addım da qaldı, davam et!',
  'Hər dəqiqə sənin gələcəyinə işləyir 🌸',
  'Yorulsan da, dayanma — bacarırsan!',
  'Bu gün özünə görə fəxr edəcəksən 💜',
  'Kiçik addımlar böyük nəticələr yaradır'
];

let wakeLock = null;

function showRandomMotivation() {
  const random = motivationPhrases[Math.floor(Math.random() * motivationPhrases.length)];
  motivationText.textContent = random;
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (e) {
    console.warn('Wake Lock alınmadı:', e);
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

const fsIconExpand = document.getElementById('fs-icon-expand');
const fsIconCollapse = document.getElementById('fs-icon-collapse');

fullscreenBtn.addEventListener('click', () => {
  const timerSection = document.getElementById('timer');
  if (!document.fullscreenElement) {
    if (timerSection.requestFullscreen) {
      timerSection.requestFullscreen();
    }
  } else {
    document.exitFullscreen();
  }
});

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    document.body.classList.add('timer-fullscreen-mode');
    fsIconExpand.classList.add('hidden');
    fsIconCollapse.classList.remove('hidden');
  } else {
    document.body.classList.remove('timer-fullscreen-mode');
    fsIconExpand.classList.remove('hidden');
    fsIconCollapse.classList.add('hidden');
  }
});

startBtn.addEventListener('click', () => {
  if (!subjectInput.value.trim()) return;
  motivationBanner.classList.remove('hidden');
  fullscreenBtn.classList.remove('hidden');
  showRandomMotivation();
  requestWakeLock();

  clearInterval(window._motivationInterval);
  window._motivationInterval = setInterval(showRandomMotivation, 12000);
});

function exitFullscreenAndCleanup() {
  motivationBanner.classList.add('hidden');
  fullscreenBtn.classList.add('hidden');
  clearInterval(window._motivationInterval);
  releaseWakeLock();
  document.body.classList.remove('timer-fullscreen-mode');
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
}

pauseBtn.addEventListener('click', () => {
  releaseWakeLock();
});

stopBtn.addEventListener('click', () => {
  exitFullscreenAndCleanup();
});

const originalFinishSession = finishSession;
finishSession = function(reachedTarget) {
  originalFinishSession(reachedTarget);
  exitFullscreenAndCleanup();
};

// ==== BLOKLAR (CRUD) ====

const newBlockNameInput = document.getElementById('new-block-name');
const addBlockBtn = document.getElementById('add-block-btn');
const blocksList = document.getElementById('blocks-list');
const noBlocksMsg = document.getElementById('no-blocks-msg');

function getBlocks() {
  return JSON.parse(localStorage.getItem('blocks') || '[]');
}

function saveBlocks(blocks) {
  localStorage.setItem('blocks', JSON.stringify(blocks));
}

function getSessions() {
  return JSON.parse(localStorage.getItem('sessions') || '[]');
}

function getBlockTotalMinutes(blockId) {
  const sessions = getSessions();
  return sessions
    .filter(s => s.blockId === blockId)
    .reduce((sum, s) => sum + s.minutes, 0);
}

function formatMinutesAsHours(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} dəq`;
  if (mins === 0) return `${hours} saat`;
  return `${hours} saat ${mins} dəq`;
}

function renderBlocks() {
  const blocks = getBlocks();
  blocksList.innerHTML = '';

  if (blocks.length === 0) {
    noBlocksMsg.classList.remove('hidden');
  } else {
    noBlocksMsg.classList.add('hidden');
  }

  blocks.forEach(block => {
    const totalMinutes = getBlockTotalMinutes(block.id);

    const card = document.createElement('div');
    card.className = 'block-card';
    card.innerHTML = `
      <button class="block-delete-btn" data-id="${block.id}" title="Sil">✕</button>
      <div class="block-name">${escapeHtml(block.name)}</div>
      <div class="block-hours">${formatMinutesAsHours(totalMinutes)}</div>
    `;
    blocksList.appendChild(card);
  });

  document.querySelectorAll('.block-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm('Bu bloku silmək istədiyinə əminsən? Bu bloka aid keçmiş sessiyalar silinməyəcək, sadəcə blok siyahıdan çıxacaq.')) {
        const updated = getBlocks().filter(b => b.id !== id);
        saveBlocks(updated);
        renderBlocks();
        refreshBlockDropdown();
      }
    });
  });

  document.querySelectorAll('.block-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.querySelector('.block-delete-btn').dataset.id;
      const block = getBlocks().find(b => b.id === id);
      if (block) openBlockModal(block);
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

addBlockBtn.addEventListener('click', () => {
  const name = newBlockNameInput.value.trim();
  if (!name) {
    alert('Zəhmət olmasa blok adı daxil et.');
    return;
  }

  const blocks = getBlocks();
  const newBlock = {
    id: Date.now().toString(),
    name: name,
    createdAt: new Date().toISOString()
  };
  blocks.push(newBlock);
  saveBlocks(blocks);

  newBlockNameInput.value = '';
  renderBlocks();
  refreshBlockDropdown();
});

newBlockNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addBlockBtn.click();
  }
});

document.querySelector('[data-tab="blocks"]').addEventListener('click', renderBlocks);

function refreshBlockDropdown() {
  const blocks = getBlocks();
  const currentValue = blockSelect.value;

  blockSelect.innerHTML = '<option value="">— Blok seçilməyib —</option>';
  blocks.forEach(block => {
    const opt = document.createElement('option');
    opt.value = block.id;
    opt.textContent = block.name;
    blockSelect.appendChild(opt);
  });

  if ([...blockSelect.options].some(o => o.value === currentValue)) {
    blockSelect.value = currentValue;
  }
}

renderBlocks();
refreshBlockDropdown();

// ==== AYLIQ TƏQVİM ====

let calendarViewDate = new Date(); // hansı ayın göstərildiyini saxlayır

const calendarGrid = document.getElementById('calendar-grid');
const calendarMonthLabel = document.getElementById('calendar-month-label');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');

const azMonthNames = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
  'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

function toDateKey(date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMinutesByDate() {
  const sessions = getSessions();
  const map = {};
  sessions.forEach(s => {
    map[s.date] = (map[s.date] || 0) + s.minutes;
  });
  return map;
}

function renderCalendar() {
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth(); // 0-11

  calendarMonthLabel.textContent = `${azMonthNames[month]} ${year}`;

  const firstDayOfMonth = new Date(year, month, 1);
  // JS-də Bazar (Sunday) = 0. Bizə Bazar ertəsi = 0 lazımdır.
  let startWeekday = firstDayOfMonth.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const minutesByDate = getMinutesByDate();
  const todayKey = toDateKey(new Date());

  calendarGrid.innerHTML = '';

  // Aya qədər boş xanalar
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day empty';
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateKey = toDateKey(dateObj);
    const minutes = minutesByDate[dateKey] || 0;

    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    if (dateKey === todayKey) cell.classList.add('today');

    cell.innerHTML = `
      <span class="day-number">${day}</span>
      <span class="day-minutes ${minutes === 0 ? 'empty-day' : ''}">${minutes > 0 ? formatMinutesAsHours(minutes) : '-'}</span>
    `;
    calendarGrid.appendChild(cell);
  }
}

prevMonthBtn.addEventListener('click', () => {
  calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
  renderCalendar();
});

// Təqvim tab-ı açılanda yenilə (yeni sessiyalar əlavə olunmuş ola bilər)
document.querySelector('[data-tab="calendar"]').addEventListener('click', renderCalendar);

renderCalendar();

// ==== HƏFTƏLİK CƏDVƏL ====

let weekViewDate = new Date(); // bu tarixin olduğu həftə göstərilir

const weekRangeLabel = document.getElementById('week-range-label');
const weeklyTableHead = document.getElementById('weekly-table-head');
const weeklyTableBody = document.getElementById('weekly-table-body');
const prevWeekBtn = document.getElementById('prev-week-btn');
const nextWeekBtn = document.getElementById('next-week-btn');
const noWeeklyDataMsg = document.getElementById('no-weekly-data-msg');

const azWeekdayShort = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'];

function getWeekDates(date) {
  const d = new Date(date);
  let weekday = d.getDay() - 1; // Bazar ertəsi = 0
  if (weekday < 0) weekday = 6;
  d.setDate(d.getDate() - weekday); // həftənin Bazar ertəsi gününə qayıt

  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    days.push(day);
  }
  return days;
}

function renderWeeklyTable() {
  const weekDates = getWeekDates(weekViewDate);
  const weekKeys = weekDates.map(toDateKey);

  weekRangeLabel.textContent = `${weekDates[0].getDate()} ${azMonthNames[weekDates[0].getMonth()]} — ${weekDates[6].getDate()} ${azMonthNames[weekDates[6].getMonth()]}`;

  const sessions = getSessions().filter(s => weekKeys.includes(s.date));

  // Baş sətir: boş xana + 7 gün
  weeklyTableHead.innerHTML = '<th>Mövzu</th>' +
    weekDates.map((d, i) => `<th>${azWeekdayShort[i]}<br>${d.getDate()}</th>`).join('');

  if (sessions.length === 0) {
    weeklyTableBody.innerHTML = '';
    noWeeklyDataMsg.classList.remove('hidden');
    document.getElementById('weekly-table').classList.add('hidden');
    return;
  }
  noWeeklyDataMsg.classList.add('hidden');
  document.getElementById('weekly-table').classList.remove('hidden');

  // Mövzu -> { dateKey: totalMinutes }
  const subjectMap = {};
  sessions.forEach(s => {
    const subj = s.subject || '(adsız)';
    if (!subjectMap[subj]) subjectMap[subj] = {};
    subjectMap[subj][s.date] = (subjectMap[subj][s.date] || 0) + s.minutes;
  });

  const subjects = Object.keys(subjectMap).sort();

  weeklyTableBody.innerHTML = '';
  subjects.forEach(subject => {
    const row = document.createElement('tr');
    let rowHtml = `<td>${escapeHtml(subject)}</td>`;
    weekKeys.forEach(key => {
      const mins = subjectMap[subject][key];
      if (mins) {
        rowHtml += `<td class="has-time">${formatMinutesAsHours(mins)}</td>`;
      } else {
        rowHtml += `<td>-</td>`;
      }
    });
    row.innerHTML = rowHtml;
    weeklyTableBody.appendChild(row);
  });

  // Cəmi sətri
  const totalRow = document.createElement('tr');
  let totalHtml = '<td>Cəmi</td>';
  weekKeys.forEach(key => {
    const dayTotal = sessions
      .filter(s => s.date === key)
      .reduce((sum, s) => sum + s.minutes, 0);
    totalHtml += `<td>${dayTotal > 0 ? formatMinutesAsHours(dayTotal) : '-'}</td>`;
  });
  totalRow.innerHTML = totalHtml;
  totalRow.style.borderTop = '2px solid #f0c9e0';
  totalRow.style.fontWeight = '700';
  weeklyTableBody.appendChild(totalRow);
}

prevWeekBtn.addEventListener('click', () => {
  weekViewDate.setDate(weekViewDate.getDate() - 7);
  renderWeeklyTable();
});

nextWeekBtn.addEventListener('click', () => {
  weekViewDate.setDate(weekViewDate.getDate() + 7);
  renderWeeklyTable();
});

document.querySelector('[data-tab="weekly"]').addEventListener('click', renderWeeklyTable);

renderWeeklyTable();

// ==== BLOK DETALI (AYLIQ TƏQVİM) ====

let activeBlockId = null;
let blockModalViewDate = new Date();

const blockModalOverlay = document.getElementById('block-modal-overlay');
const blockModalTitle = document.getElementById('block-modal-title');
const blockModalTotal = document.getElementById('block-modal-total');
const closeBlockModalBtn = document.getElementById('close-block-modal-btn');
const blockCalendarGrid = document.getElementById('block-calendar-grid');
const blockCalendarMonthLabel = document.getElementById('block-calendar-month-label');
const blockPrevMonthBtn = document.getElementById('block-prev-month-btn');
const blockNextMonthBtn = document.getElementById('block-next-month-btn');

function openBlockModal(block) {
  activeBlockId = block.id;
  blockModalViewDate = new Date();
  blockModalTitle.textContent = block.name;
  blockModalOverlay.classList.remove('hidden');
  renderBlockModalCalendar();
}

function closeBlockModal() {
  blockModalOverlay.classList.add('hidden');
  activeBlockId = null;
}

closeBlockModalBtn.addEventListener('click', closeBlockModal);
blockModalOverlay.addEventListener('click', (e) => {
  if (e.target === blockModalOverlay) closeBlockModal();
});

function renderBlockModalCalendar() {
  if (!activeBlockId) return;

  const year = blockModalViewDate.getFullYear();
  const month = blockModalViewDate.getMonth();

  blockCalendarMonthLabel.textContent = `${azMonthNames[month]} ${year}`;

  const firstDayOfMonth = new Date(year, month, 1);
  let startWeekday = firstDayOfMonth.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  // Yalnız bu bloka aid sessiyalardan gün->dəqiqə xəritəsi
  const sessions = getSessions().filter(s => s.blockId === activeBlockId);
  const minutesByDate = {};
  sessions.forEach(s => {
    minutesByDate[s.date] = (minutesByDate[s.date] || 0) + s.minutes;
  });

  blockCalendarGrid.innerHTML = '';

  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day empty';
    blockCalendarGrid.appendChild(empty);
  }

  let monthTotal = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateKey = toDateKey(dateObj);
    const minutes = minutesByDate[dateKey] || 0;
    monthTotal += minutes;

    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    if (dateKey === todayKey) cell.classList.add('today');

    cell.innerHTML = `
      <span class="day-number">${day}</span>
      <span class="day-minutes ${minutes === 0 ? 'empty-day' : ''}">${minutes > 0 ? formatMinutesAsHours(minutes) : '-'}</span>
    `;
    blockCalendarGrid.appendChild(cell);
  }

  blockModalTotal.textContent = `Bu ay cəmi: ${formatMinutesAsHours(monthTotal)}`;
}

blockPrevMonthBtn.addEventListener('click', () => {
  blockModalViewDate.setMonth(blockModalViewDate.getMonth() - 1);
  renderBlockModalCalendar();
});

blockNextMonthBtn.addEventListener('click', () => {
  blockModalViewDate.setMonth(blockModalViewDate.getMonth() + 1);
  renderBlockModalCalendar();
});