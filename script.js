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
  updateDisplay();
}

function saveSession(minutes) {
  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  const today = new Date().toISOString().split('T')[0];

  sessions.push({
    date: today,
    subject: subjectInput.value.trim(),
    blockId: null,
    note: noteInput.value.trim(),
    minutes: minutes
  });

  localStorage.setItem('sessions', JSON.stringify(sessions));

  subjectInput.value = '';
  noteInput.value = '';
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

// Timer başlayanda: motivasiya lentini göstər, wake lock al, tam ekran düyməsini göstər
const originalStartHandler = startBtn.onclick;
startBtn.addEventListener('click', () => {
  if (!subjectInput.value.trim()) return; // eyni yoxlama, boşdursa heç nə etmə
  motivationBanner.classList.remove('hidden');
  fullscreenBtn.classList.remove('hidden');
  showRandomMotivation();
  requestWakeLock();

  // motivasiya mətnini hər 12 saniyədən bir dəyiş
  clearInterval(window._motivationInterval);
  window._motivationInterval = setInterval(showRandomMotivation, 12000);
});

// Fasilə/Dayandır/Sessiya bitəndə: lenti gizlət, wake lock buraxsın, tam ekrandan çıx
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

// finishSession avtomatik (hədəfə çatanda) da çağırılır — ora da body-fullscreen təmizləməsini bağlayaq
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

  // Silmə düymələri
  document.querySelectorAll('.block-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm('Bu bloku silmək istədiyinə əminsən? Bu bloka aid keçmiş sessiyalar silinməyəcək, sadəcə blok siyahıdan çıxacaq.')) {
        const updated = getBlocks().filter(b => b.id !== id);
        saveBlocks(updated);
        renderBlocks();
        refreshBlockDropdown(); // Mərhələ 5-də əlavə olunacaq funksiya üçün hazırlıq
      }
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

// Enter düyməsi ilə də əlavə etmək mümkün olsun
newBlockNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addBlockBtn.click();
  }
});

// Bloklar tab-ı açılanda siyahını yenilə
document.querySelector('[data-tab="blocks"]').addEventListener('click', renderBlocks);

// Sadə boş funksiya — Mərhələ 5-də real məzmunla dolduracağıq
function refreshBlockDropdown() {}

renderBlocks();