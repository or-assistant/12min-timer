/* 12MIN.ME Event Timer — v4: i18n, dropdowns, reset-to-start */

// Cities from 12min.me (researched 2026-06-23)
const CITIES = [
  // Germany
  'Baden-Baden','Berlin','Bochum','Bremen','Düsseldorf','Flensburg',
  'Güstrow','Hamburg','Heidelberg','Karlsruhe','Kiel','Leipzig',
  'Lübeck','München','Münster','Nürnberg','Rostock','Rügen',
  'Schwerin','Stuttgart','Ulm','Wismar',
  // International
  'Basel','Istanbul','Izmir','Jerez de la Frontera','Marbella','Tallinn','Wien',
];

// Formats from 12min.me/formate/ (researched 2026-06-23)
const FORMATS = [
  'IGNITE','SUSTAIN','TASTE','DIVE','INVEST','RESTART','RISE','SELECT','START','DISRUPT','IMPACT',
];

(() => {
  'use strict';

  const PHASE_DURATION = 12 * 60;

  const I18N = {
    de: {
      tagline: "DON'T WASTE YOUR TIME!",
      city: 'Stadt', cityPlaceholder: 'Stadt wählen',
      event: 'Format', eventPlaceholder: 'Format wählen',
      mode: 'Modus', auto: 'Auto (durchlaufen)', manual: 'Manuell (pro Phase)',
      start: 'Timer starten', customEvent: 'Freier Event-Name (optional)',
      phases: { speaker: 'Speaker', guests: 'Fragen', pause: 'Pause' },
      subtext: { speaker: '12 Minuten Vortrag', guests: '12 Minuten Q&A', pause: '12 Minuten Pause' },
      round: 'Runde', of: 'von',
      pause: 'Pause', resume: 'Fortsetzen', next: 'Weiter', skip: 'Überspringen', reset: 'Reset',
      resetConfirm: 'Timer auf Null zurücksetzen?',
      finishedTitle: 'Geschafft!', finishedSub: 'Zeit für offenes Netzwerken',
      transRound: 'Runde', transNext: 'folgt'
    },
    en: {
      tagline: "DON'T WASTE YOUR TIME!",
      city: 'City', cityPlaceholder: 'Select city',
      event: 'Format', eventPlaceholder: 'Select format',
      mode: 'Mode', auto: 'Auto (continuous)', manual: 'Manual (per phase)',
      start: 'Start timer', customEvent: 'Custom event name (optional)',
      phases: { speaker: 'Speaker', guests: 'Q&A', pause: 'Break' },
      subtext: { speaker: '12 minutes talk', guests: '12 minutes Q&A', pause: '12 minutes break' },
      round: 'Round', of: 'of',
      pause: 'Pause', resume: 'Resume', next: 'Next', skip: 'Skip', reset: 'Reset',
      resetConfirm: 'Reset timer to zero?',
      finishedTitle: 'Done!', finishedSub: 'Time for open networking',
      transRound: 'Round', transNext: 'next'
    },
    tr: {
      tagline: "DON'T WASTE YOUR TIME!",
      city: 'Şehir', cityPlaceholder: 'Şehir seç',
      event: 'Format', eventPlaceholder: 'Format seç',
      mode: 'Mod', auto: 'Otomatik (sürekli)', manual: 'Manuel (aşama başına)',
      start: 'Süreölçeri başlat', customEvent: 'Özel etkinlik adı (isteğe bağlı)',
      phases: { speaker: 'Konuşmacı', guests: 'Sorular', pause: 'Mola' },
      subtext: { speaker: '12 dakika sunum', guests: '12 dakika S&C', pause: '12 dakika mola' },
      round: 'Tur', of: '/',
      pause: 'Duraklat', resume: 'Devam et', next: 'İleri', skip: 'Atla', reset: 'Sıfırla',
      resetConfirm: 'Süreölçer sıfırlansın mı?',
      finishedTitle: 'Tamamlandı!', finishedSub: 'Ağ kurma zamanı',
      transRound: 'Tur', transNext: 'başlıyor'
    },
    es: {
      tagline: "DON'T WASTE YOUR TIME!",
      city: 'Ciudad', cityPlaceholder: 'Seleccionar ciudad',
      event: 'Formato', eventPlaceholder: 'Seleccionar formato',
      mode: 'Modo', auto: 'Auto (continuo)', manual: 'Manual (por fase)',
      start: 'Iniciar temporizador', customEvent: 'Nombre de evento personalizado (opcional)',
      phases: { speaker: 'Ponente', guests: 'Preguntas', pause: 'Pausa' },
      subtext: { speaker: '12 minutos de charla', guests: '12 minutos de preguntas', pause: '12 minutos de pausa' },
      round: 'Ronda', of: 'de',
      pause: 'Pausa', resume: 'Continuar', next: 'Siguiente', skip: 'Saltar', reset: 'Reiniciar',
      resetConfirm: '¿Reiniciar temporizador?',
      finishedTitle: '¡Hecho!', finishedSub: 'Hora de hacer networking',
      transRound: 'Ronda', transNext: 'sigue'
    }
  };

  let lang = 'de';
  const t = () => I18N[lang];
  function langLabel() { return { de: 'DE', en: 'EN', tr: 'TR', es: 'ES' }[lang] || 'DE'; }

  const PHASES = [
    { type: 'speaker', round: 1 }, { type: 'guests', round: 1 }, { type: 'pause', round: 1 },
    { type: 'speaker', round: 2 }, { type: 'guests', round: 2 }, { type: 'pause', round: 2 },
    { type: 'speaker', round: 3 }, { type: 'guests', round: 3 },
  ];

  let currentPhaseIdx = 0;
  let timeRemaining = PHASE_DURATION;
  let isRunning = false;
  let autoMode = true;
  let intervalId = null;
  let audioCtx = null;
  let inverted = false;
  let soundOn = true;

  // SVG circle
  const radius = 175;
  const circumference = 2 * Math.PI * radius;
  const timerProgress = document.getElementById('timer-progress');
  timerProgress.style.strokeDasharray = circumference;
  timerProgress.style.strokeDashoffset = 0;

  // Generate clock ticks
  const ticksGroup = document.getElementById('ticks-group');
  for (let i = 0; i < 60; i++) {
    const angle = (i * 6 - 90) * Math.PI / 180;
    const isMajor = i % 5 === 0;
    const inner = isMajor ? 155 : 163;
    const outer = 172;
    const x1 = 200 + inner * Math.cos(angle), y1 = 200 + inner * Math.sin(angle);
    const x2 = 200 + outer * Math.cos(angle), y2 = 200 + outer * Math.sin(angle);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('class', isMajor ? 'tick-line major' : 'tick-line');
    ticksGroup.appendChild(line);
  }

  // Populate dropdowns
  function populateDropdowns() {
    const citySel = document.getElementById('city-select');
    const formatSel = document.getElementById('format-select');
    citySel.innerHTML = `<option value="">${t().cityPlaceholder}</option>`;
    formatSel.innerHTML = `<option value="">${t().eventPlaceholder}</option>`;
    CITIES.forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      citySel.appendChild(o);
    });
    FORMATS.forEach(f => {
      const o = document.createElement('option');
      o.value = f; o.textContent = `12MIN.ME | ${f}`;
      formatSel.appendChild(o);
    });
  }

  // When custom event name is typed, disable format dropdown
  document.getElementById('custom-event-input').addEventListener('input', (e) => {
    const formatSel = document.getElementById('format-select');
    const hasText = e.target.value.trim().length > 0;
    formatSel.disabled = hasText;
    if (hasText) formatSel.value = '';
  });

  // Apply language
  function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const parts = el.dataset.i18n.split('.');
      let val = t();
      for (const p of parts) val = val?.[p];
      if (val) el.textContent = val;
    });
    document.documentElement.lang = lang;
    populateDropdowns();
    // Re-set selected values if any
    const cs = document.getElementById('city-select');
    const fs = document.getElementById('format-select');
    if (cs.dataset.val) cs.value = cs.dataset.val;
    if (fs.dataset.val) fs.value = fs.dataset.val;
  }

  // Setup screen
  document.getElementById('auto-mode-btn').addEventListener('click', () => {
    autoMode = true;
    document.getElementById('auto-mode-btn').classList.add('active');
    document.getElementById('manual-mode-btn').classList.remove('active');
  });

  document.getElementById('manual-mode-btn').addEventListener('click', () => {
    autoMode = false;
    document.getElementById('manual-mode-btn').classList.add('active');
    document.getElementById('auto-mode-btn').classList.remove('active');
  });

  document.getElementById('start-btn').addEventListener('click', () => {
    const citySel = document.getElementById('city-select');
    const formatSel = document.getElementById('format-select');
    const customInput = document.getElementById('custom-event-input');
    citySel.dataset.val = citySel.value;
    formatSel.dataset.val = formatSel.value;

    const city = citySel.value;
    const format = formatSel.value;
    const custom = customInput.value.trim();

    document.getElementById('event-city').textContent = city || '';
    let displayName = '12MIN.ME';
    if (format && custom) displayName = `12MIN.ME<span class="ev-sep">|</span>${custom.toUpperCase()}`;
    else if (format) displayName = `12MIN.ME<span class="ev-sep">|</span>${format}`;
    else if (custom) displayName = `12MIN.ME<span class="ev-sep">|</span>${custom.toUpperCase()}`;
    document.getElementById('event-name').innerHTML = displayName;

    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('timer-screen').classList.add('active');
    document.body.className = inverted ? 'theme-inverted' : '';
    currentPhaseIdx = 0;
    startPhase(0);
  });

  // Build round visualization
  function buildRoundViz() {
    const rv = document.getElementById('round-viz');
    rv.innerHTML = '';
    for (let r = 1; r <= 3; r++) {
      const block = document.createElement('div');
      block.className = 'round-block';
      const label = document.createElement('div');
      label.className = 'round-label';
      label.textContent = `${t().round} ${r}`;
      block.appendChild(label);

      const segs = document.createElement('div');
      segs.className = 'round-segments';
      ['speaker', 'guests', 'pause'].forEach((segType, si) => {
        if (r === 3 && segType === 'pause') {
          // Party icon for the end (round 3, no pause → networking)
          const seg = document.createElement('div');
          seg.className = 'seg seg-party';
          const icon = document.createElement('span');
          icon.className = 'seg-icon';
          icon.textContent = '🎉';
          seg.appendChild(icon);
          segs.appendChild(seg);
          return;
        }
        const phaseIdx = (r - 1) * 3 + si;
        const seg = document.createElement('div');
        seg.className = `seg seg-${segType}`;
        const isDone = phaseIdx < currentPhaseIdx;
        const isCurrent = phaseIdx === currentPhaseIdx;
        if (isDone) seg.classList.add('done');
        else if (isCurrent) seg.classList.add('current');

        // Progress fill inside segment
        const fill = document.createElement('div');
        fill.className = 'seg-fill';
        if (isDone) fill.style.width = '100%';
        else if (isCurrent) fill.style.width = `${((PHASE_DURATION - timeRemaining) / PHASE_DURATION) * 100}%`;
        seg.appendChild(fill);

        const icon = document.createElement('span');
        icon.className = 'seg-icon';
        if (isDone) {
          icon.textContent = '✓';
        } else {
          icon.textContent = segType === 'speaker' ? '🎤' : segType === 'guests' ? '💬' : '🍷';
        }
        seg.appendChild(icon);
        segs.appendChild(seg);
      });
      block.appendChild(segs);
      rv.appendChild(block);
    }
  }

  function formatTime(secs) {
    return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  }

  function updateTotalElapsed() {
    let r1 = 0, r2 = 0, r3 = 0;
    for (let i = 0; i <= currentPhaseIdx && i < PHASES.length; i++) {
      const phase = PHASES[i];
      const phaseSecs = i < currentPhaseIdx ? PHASE_DURATION : (PHASE_DURATION - timeRemaining);
      if (phase.round === 1) r1 += phaseSecs;
      else if (phase.round === 2) r2 += phaseSecs;
      else r3 += phaseSecs;
    }
    document.getElementById('elapsed-1').textContent = formatTime(r1);
    document.getElementById('elapsed-2').textContent = formatTime(r2);
    document.getElementById('elapsed-3').textContent = formatTime(r3);
    const cr = PHASES[currentPhaseIdx]?.round || 1;
    document.getElementById('elapsed-1').classList.toggle('active', cr === 1);
    document.getElementById('elapsed-2').classList.toggle('active', cr === 2);
    document.getElementById('elapsed-3').classList.toggle('active', cr === 3);
  }

  function startPhase(idx) {
    if (idx >= PHASES.length) { finishTimer(); return; }
    currentPhaseIdx = idx;
    const phase = PHASES[idx];
    timeRemaining = PHASE_DURATION;
    isRunning = true;

    buildRoundViz();
    document.getElementById('round-indicator').textContent = `${t().round} ${phase.round} ${t().of} 3`;
    document.getElementById('phase-label').textContent = t().phases[phase.type];
    document.getElementById('phase-subtext').textContent = t().subtext[phase.type];

    document.body.className = `phase-${phase.type}`;
    if (inverted) document.body.classList.add('theme-inverted');

    const btn = document.getElementById('play-pause-btn');
    btn.innerHTML = `<span>⏸</span> ${t().pause}`;
    btn.classList.add('primary');

    timerProgress.style.strokeDashoffset = 0;
    timerProgress.classList.remove('warn');
    document.getElementById('time-display').classList.remove('warn');

    updateDisplay();
    updateTotalElapsed();

    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(tick, 1000);
  }

  function tick() {
    if (!isRunning) return;
    timeRemaining--;
    if (timeRemaining <= 30 && timeRemaining > 0) {
      timerProgress.classList.add('warn');
      document.getElementById('time-display').classList.add('warn');
    }
    if (timeRemaining <= 0) {
      timeRemaining = 0;
      updateDisplay(); updateTotalElapsed();
      clearInterval(intervalId); intervalId = null;
      // Short bell at each phase end
      playBell(523.25, 2.0, 0.5);
      if (autoMode) { showTransition(); }
      else {
        isRunning = false;
        const btn = document.getElementById('play-pause-btn');
        btn.innerHTML = `<span>▶</span> ${t().next}`;
        btn.classList.add('primary');
      }
      return;
    }
    updateDisplay(); updateTotalElapsed();
  }

  function updateDisplay() {
    document.getElementById('time-display').textContent = formatTime(timeRemaining);
    timerProgress.style.strokeDashoffset = circumference * ((PHASE_DURATION - timeRemaining) / PHASE_DURATION);
    // Update segment fill
    const fill = document.querySelector('.seg.current .seg-fill');
    if (fill) fill.style.width = `${((PHASE_DURATION - timeRemaining) / PHASE_DURATION) * 100}%`;
  }

  function showTransition() {
    const nextIdx = currentPhaseIdx + 1;
    if (nextIdx >= PHASES.length) { finishTimer(); return; }
    const np = PHASES[nextIdx];
    document.getElementById('transition-text').textContent = t().phases[np.type];
    document.getElementById('transition-sub').textContent = np.type === 'pause'
      ? `${t().transRound} ${np.round} ${t().transNext}`
      : `${t().transRound} ${np.round} • ${t().phases[np.type]}`;
    document.getElementById('transition-overlay').classList.add('active');
    setTimeout(() => {
      document.getElementById('transition-overlay').classList.remove('active');
      startPhase(nextIdx);
    }, 2500);
  }

  function finishTimer() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null; isRunning = false;
    document.getElementById('timer-screen').classList.remove('active');
    document.getElementById('finished-screen').classList.add('active');
    document.getElementById('finished-title').textContent = t().finishedTitle;
    document.getElementById('finished-sub').textContent = t().finishedSub;
    document.body.className = inverted ? 'theme-inverted' : '';
    // Triple bell for networking start
    playBell(523.25, 3.0, 0.6);
    setTimeout(() => playBell(659.25, 3.0, 0.6), 800);
    setTimeout(() => playBell(783.99, 3.5, 0.7), 1600);
  }

  // ===== Controls =====
  document.getElementById('play-pause-btn').addEventListener('click', () => {
    if (timeRemaining <= 0) {
      const nextIdx = currentPhaseIdx + 1;
      if (nextIdx >= PHASES.length) finishTimer();
      else startPhase(nextIdx);
      return;
    }
    isRunning = !isRunning;
    const btn = document.getElementById('play-pause-btn');
    if (isRunning) {
      btn.innerHTML = `<span>⏸</span> ${t().pause}`;
      btn.classList.add('primary');
      if (!intervalId) intervalId = setInterval(tick, 1000);
    } else {
      btn.innerHTML = `<span>▶</span> ${t().resume}`;
      btn.classList.remove('primary');
    }
  });

  document.getElementById('skip-btn').addEventListener('click', () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    const nextIdx = currentPhaseIdx + 1;
    if (nextIdx >= PHASES.length) finishTimer();
    else startPhase(nextIdx);
  });

  // RESET: goes directly to Runde 1, not setup screen
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm(t().resetConfirm)) {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      currentPhaseIdx = 0;
      timeRemaining = PHASE_DURATION;
      isRunning = false;
      // Stay on timer screen, restart phase 1
      startPhase(0);
    }
  });

  // ===== Audio: Bell Synthesis =====
  const BELL_PARTIALS = [[0.5,0.3,3.5],[1.0,0.6,3.0],[1.2,0.4,2.2],[1.5,0.3,1.8],[2.0,0.5,1.5],[2.5,0.2,1.2],[3.0,0.25,1.0],[4.0,0.15,0.8],[5.0,0.08,0.6]];

  function playBell(fundamental, duration, volume) {
    if (!soundOn) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const mg = audioCtx.createGain();
      mg.gain.setValueAtTime(volume, now);
      mg.connect(audioCtx.destination);
      const nb = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = (Math.random()*2-1)*(1-i/nd.length);
      const ns = audioCtx.createBufferSource(); ns.buffer = nb;
      const nf = audioCtx.createBiquadFilter(); nf.type='bandpass'; nf.frequency.value=fundamental*3; nf.Q.value=2;
      const ng = audioCtx.createGain(); ng.gain.setValueAtTime(0.15*volume,now); ng.gain.exponentialRampToValueAtTime(0.001,now+0.08);
      ns.connect(nf); nf.connect(ng); ng.connect(mg); ns.start(now); ns.stop(now+0.1);
      BELL_PARTIALS.forEach(([r,a,d]) => {
        const o = audioCtx.createOscillator(); o.type='sine'; o.frequency.value=fundamental*r; o.detune.value=(Math.random()-0.5)*3;
        const g = audioCtx.createGain(); g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(a*volume,now+0.005); g.gain.exponentialRampToValueAtTime(0.0001,now+duration*d);
        o.connect(g); g.connect(mg); o.start(now); o.stop(now+duration*d+0.1);
      });
      triggerBellAnimation(duration);
    } catch(e){}
  }

  function playBellTing(f) {
    if (!soundOn) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const mg = audioCtx.createGain(); mg.gain.setValueAtTime(0.25,now); mg.connect(audioCtx.destination);
      [[1,0.5,1],[2,0.3,0.7],[3,0.15,0.5]].forEach(([r,a,d]) => {
        const o = audioCtx.createOscillator(); o.type='sine'; o.frequency.value=f*r;
        const g = audioCtx.createGain(); g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(a*0.25,now+0.003); g.gain.exponentialRampToValueAtTime(0.0001,now+d);
        o.connect(g); g.connect(mg); o.start(now); o.stop(now+1.5);
      });
      triggerBellAnimation(1.0);
    } catch(e){}
  }

  function triggerBellAnimation(duration) {
    const bell = document.getElementById('bell-anim');
    if (!bell) return;
    bell.classList.remove('ringing');
    void bell.offsetWidth;
    bell.classList.add('ringing');
    bell.style.animationDuration = `${duration}s`;
    setTimeout(() => bell.classList.remove('ringing'), duration * 1000 + 200);
  }

  // ===== Top-right buttons =====
  document.getElementById('sound-btn').addEventListener('click', () => {
    soundOn = !soundOn;
    document.getElementById('sound-btn').textContent = soundOn ? '🔊' : '🔇';
  });

  document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });

  document.getElementById('zoom-btn').addEventListener('click', () => {
    const isZoomed = document.body.classList.toggle('zoomed');
    const timeDisplay = document.getElementById('time-display');
    const timerScreen = document.getElementById('timer-screen');
    if (isZoomed) {
      timerScreen.appendChild(timeDisplay);
    } else {
      document.querySelector('.timer-container').appendChild(timeDisplay);
    }
  });

  document.getElementById('theme-btn').addEventListener('click', () => {
    inverted = !inverted;
    document.body.classList.toggle('theme-inverted', inverted);
  });

  document.getElementById('lang-btn').addEventListener('click', () => {
    lang = lang === 'de' ? 'en' : lang === 'en' ? 'tr' : lang === 'tr' ? 'es' : 'de';
    applyLanguage();
    const ts = document.getElementById('timer-screen');
    if (ts.classList.contains('active') && currentPhaseIdx < PHASES.length) {
      const phase = PHASES[currentPhaseIdx];
      document.getElementById('round-indicator').textContent = `${t().round} ${phase.round} ${t().of} 3`;
      document.getElementById('phase-label').textContent = t().phases[phase.type];
      document.getElementById('phase-subtext').textContent = t().subtext[phase.type];
      buildRoundViz();
      const btn = document.getElementById('play-pause-btn');
      if (isRunning) btn.innerHTML = `<span>⏸</span> ${t().pause}`;
      else if (timeRemaining <= 0) btn.innerHTML = `<span>▶</span> ${t().next}`;
      else btn.innerHTML = `<span>▶</span> ${t().resume}`;
      document.getElementById('skip-btn').innerHTML = `<span>⏭</span> ${t().skip}`;
      document.getElementById('reset-btn').innerHTML = `<span>↺</span> ${t().reset}`;
    }
    if (document.getElementById('finished-screen').classList.contains('active')) {
      document.getElementById('finished-title').textContent = t().finishedTitle;
      document.getElementById('finished-sub').textContent = t().finishedSub;
    }
    document.getElementById('lang-btn').textContent = langLabel();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    const ts = document.getElementById('timer-screen');
    if (document.getElementById('setup-screen').style.display === 'none' && ts.classList.contains('active')) {
      if (e.code === 'Space') { e.preventDefault(); document.getElementById('play-pause-btn').click(); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); document.getElementById('skip-btn').click(); }
      else if (e.code === 'KeyR') { e.preventDefault(); document.getElementById('reset-btn').click(); }
      else if (e.code === 'KeyF') { e.preventDefault(); document.getElementById('fullscreen-btn').click(); }
      else if (e.code === 'KeyZ') { e.preventDefault(); document.getElementById('zoom-btn').click(); }
      else if (e.code === 'KeyT') { e.preventDefault(); document.getElementById('theme-btn').click(); }
      else if (e.code === 'KeyL') { e.preventDefault(); document.getElementById('lang-btn').click(); }
    }
  });

  // Init
  applyLanguage();
  document.getElementById('lang-btn').textContent = langLabel();
})();
