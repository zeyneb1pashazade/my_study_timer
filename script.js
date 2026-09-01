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