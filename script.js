/* ==========================================================================
   HELCINE — SUGAR CRUSH 23 ANS (INTERACTIVE JAVASCRIPT ENGINE)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Modules
  init3DPosterTilt();
  initStickerInteractions();
  initWebAudioSynth();
  initCandleBlowEngine();
  initConfettiCanvas();
  initGuestbookWall();
});

/* ==========================================================================
   1. 3D POSTER TILT & PARALLAX ENGINE
   ========================================================================== */
function init3DPosterTilt() {
  const card = document.getElementById('poster-card');
  const wrapper = document.getElementById('poster-wrapper');
  const shine = document.getElementById('poster-shine');

  if (!card || !wrapper) return;

  function handleMove(clientX, clientY) {
    const rect = wrapper.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -18; // Degrees
    const rotateY = ((x - centerX) / centerX) * 18;  // Degrees

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

    if (shine) {
      const shineX = (x / rect.width) * 100;
      const shineY = (y / rect.height) * 100;
      shine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 70%)`;
    }
  }

  wrapper.addEventListener('mousemove', (e) => {
    handleMove(e.clientX, e.clientY);
  });

  wrapper.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    if (shine) {
      shine.style.background = `linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 60%)`;
    }
  });

  // Touch Support for Mobile
  wrapper.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  wrapper.addEventListener('touchend', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  });
}

/* ==========================================================================
   2. INTERACTIVE STICKERS (DRAG & POP)
   ========================================================================== */
function initStickerInteractions() {
  const stickers = document.querySelectorAll('.interactive-sticker');

  stickers.forEach(sticker => {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    sticker.addEventListener('click', (e) => {
      if (isDragging) return;
      playSynthSound(sticker.dataset.sound || 'pop');

      // Visual Pop & Sparkle
      sticker.style.animation = 'none';
      sticker.offsetHeight; // trigger reflow
      sticker.style.transform = 'scale(1.3) rotate(12deg)';

      setTimeout(() => {
        sticker.style.transform = '';
      }, 300);

      // Create floating heart/star particle at click position
      createFloatingEmoji(e.clientX, e.clientY, getStickerEmoji(sticker.dataset.sound));
    });

    // Make stickers draggable
    sticker.addEventListener('mousedown', (e) => {
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = sticker.getBoundingClientRect();
      const parentRect = sticker.parentElement.getBoundingClientRect();

      initialLeft = rect.left - parentRect.left;
      initialTop = rect.top - parentRect.top;

      function onMouseMove(moveEvent) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isDragging = true;
        }

        if (isDragging) {
          sticker.style.left = `${initialLeft + dx}px`;
          sticker.style.top = `${initialTop + dy}px`;
          sticker.style.transform = 'scale(1.1) rotate(5deg)';
        }
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  });
}

function getStickerEmoji(soundType) {
  switch (soundType) {
    case 'heart': return '💖';
    case 'sparkle': return '✨';
    case 'cheer': return '👑';
    default: return '🎉';
  }
}

function createFloatingEmoji(x, y, emojiStr) {
  const el = document.createElement('div');
  el.textContent = emojiStr;
  el.style.position = 'fixed';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.fontSize = '1.8rem';
  el.style.pointerEvents = 'none';
  el.style.zIndex = '9999';
  el.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.style.transform = `translate(${(Math.random() - 0.5) * 80}px, -100px) scale(1.4)`;
    el.style.opacity = '0';
  });

  setTimeout(() => el.remove(), 850);
}

/* ==========================================================================
   3. WEB AUDIO SYNTH & MUSIC PLAYER
   ========================================================================== */
let audioCtx = null;
let isMusicPlaying = false;
let melodyInterval = null;

function initWebAudioSynth() {
  const musicBtn = document.getElementById('music-play-btn');
  const partyBtn = document.getElementById('party-btn');
  const equalizer = document.getElementById('equalizer');
  const bgAudio = document.getElementById('bg-music');
  const promptBanner = document.getElementById('audio-prompt-banner');
  const promptBtn = document.getElementById('audio-start-btn');

  if (!musicBtn) return;

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function hidePrompt() {
    if (promptBanner) promptBanner.classList.add('hidden');
  }

  function startMusic() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }

    if (bgAudio) {
      bgAudio.muted = false;
      bgAudio.volume = 1.0;

      const promise = bgAudio.play();
      if (promise !== undefined) {
        promise.then(() => {
          bgAudio.muted = false;
          bgAudio.volume = 1.0;
          musicBtn.classList.add('playing');
          musicBtn.querySelector('.btn-label').textContent = 'PAUSE MUSIC';
          musicBtn.querySelector('.btn-icon').textContent = '⏸';
          if (equalizer) equalizer.classList.add('active');
          isMusicPlaying = true;
          hidePrompt();
        }).catch((err) => {
          // If browser blocked unmuted autoplay, show banner so user can tap once
          if (promptBanner) promptBanner.classList.remove('hidden');
        });
      }
    } else {
      startBirthdayTune();
      musicBtn.classList.add('playing');
      musicBtn.querySelector('.btn-label').textContent = 'PAUSE MUSIC';
      musicBtn.querySelector('.btn-icon').textContent = '⏸';
      if (equalizer) equalizer.classList.add('active');
      isMusicPlaying = true;
      hidePrompt();
    }
  }

  function pauseMusic() {
    if (bgAudio) bgAudio.pause();
    stopBirthdayTune();
    musicBtn.classList.remove('playing');
    musicBtn.querySelector('.btn-label').textContent = 'PLAY MUSIC';
    musicBtn.querySelector('.btn-icon').textContent = '▶';
    if (equalizer) equalizer.classList.remove('active');
    isMusicPlaying = false;
  }

  musicBtn.addEventListener('click', () => {
    getAudioContext();
    if (!isMusicPlaying) {
      startMusic();
    } else {
      pauseMusic();
    }
  });

  if (promptBtn) {
    promptBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startMusic();
    });
  }

  if (promptBanner) {
    promptBanner.addEventListener('click', (e) => {
      e.stopPropagation();
      startMusic();
    });
  }

  const introSplash = document.getElementById('intro-splash');
  const splashEnterBtn = document.getElementById('splash-enter-btn');

  function dismissSplash() {
    if (introSplash) {
      introSplash.classList.add('dismissed');
      setTimeout(() => {
        introSplash.style.display = 'none';
      }, 500);
    }
  }

  function startMusicAndDismiss() {
    startMusic();
    dismissSplash();
  }

  if (splashEnterBtn) {
    splashEnterBtn.addEventListener('click', startMusicAndDismiss);
  }
  if (introSplash) {
    introSplash.addEventListener('click', startMusicAndDismiss);
  }

  // Autoplay & Instant Unlock on First Interaction
  function tryAutoplay() {
    startMusic();
  }

  // Attempt instant autoplay
  setTimeout(tryAutoplay, 200);

  // Global first-interaction listener to bypass browser autoplay restrictions
  const autoUnlockEvents = ['click', 'touchstart', 'mousemove', 'scroll', 'keydown'];
  function unlockAudioOnGesture() {
    startMusicAndDismiss();
    autoUnlockEvents.forEach(evt => document.removeEventListener(evt, unlockAudioOnGesture));
  }
  autoUnlockEvents.forEach(evt => document.addEventListener(evt, unlockAudioOnGesture, { once: true }));

  if (partyBtn) {
    partyBtn.addEventListener('click', () => {
      getAudioContext();
      playSynthSound('cheer');
      triggerConfettiBurst(120);
    });
  }
}

// Modern Talking — Cheri Cheri Lady (80s Synth Generator)
function startBirthdayTune() {
  if (!audioCtx) return;

  // Cheri Cheri Lady Synth Melody Notes & Frequencies (Hz)
  const notes = [
    // Iconic Riff 1
    369.99, 440.00, 415.30, 369.99, 329.63, 369.99, 415.30, 277.18,
    369.99, 440.00, 415.30, 369.99, 329.63, 369.99, 415.30, 440.00, 415.30, 369.99,
    
    // Chorus: "Cheri cheri lady..."
    554.37, 554.37, 493.88, 440.00, 493.88, 554.37, 493.88, 440.00, 415.30, 369.99,
    493.88, 493.88, 440.00, 415.30, 440.00, 493.88, 440.00, 415.30, 369.99, 329.63,
    554.37, 554.37, 493.88, 440.00, 493.88, 554.37, 493.88, 440.00, 415.30, 369.99,
    493.88, 493.88, 440.00, 415.30, 440.00, 493.88, 554.37, 493.88, 440.00
  ];

  const bassNotes = [
    185.00, 185.00, 220.00, 246.94, 185.00, 185.00, 220.00, 246.94,
    185.00, 185.00, 220.00, 246.94, 185.00, 185.00, 220.00, 246.94,
    185.00, 185.00, 220.00, 246.94, 185.00, 185.00, 220.00, 246.94,
    185.00, 185.00, 220.00, 246.94, 185.00, 185.00, 220.00, 246.94
  ];

  const durations = [
    220, 220, 220, 220, 220, 220, 440, 440,
    220, 220, 220, 220, 220, 220, 220, 220, 220, 440,
    
    330, 220, 220, 220, 220, 330, 220, 220, 220, 440,
    330, 220, 220, 220, 220, 330, 220, 220, 220, 440,
    330, 220, 220, 220, 220, 330, 220, 220, 220, 440,
    330, 220, 220, 220, 220, 330, 330, 330, 660
  ];

  let noteIdx = 0;

  function playNextNote() {
    if (!isMusicPlaying) return;

    const freq = notes[noteIdx];
    const bassFreq = bassNotes[noteIdx % bassNotes.length];
    const dur = durations[noteIdx];

    const now = audioCtx.currentTime;

    // Lead Synth Oscillator (80s Eurodisco Synth)
    const leadOsc = audioCtx.createOscillator();
    const leadGain = audioCtx.createGain();
    leadOsc.type = 'sawtooth';
    leadOsc.frequency.setValueAtTime(freq, now);
    leadGain.gain.setValueAtTime(0.12, now);
    leadGain.gain.exponentialRampToValueAtTime(0.001, now + (dur / 1000) - 0.03);

    leadOsc.connect(leadGain);
    leadGain.connect(audioCtx.destination);

    leadOsc.start(now);
    leadOsc.stop(now + (dur / 1000));

    // Bass Synth Oscillator (Slap Bass)
    const bassOsc = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    bassOsc.type = 'square';
    bassOsc.frequency.setValueAtTime(bassFreq, now);
    bassGain.gain.setValueAtTime(0.08, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + (dur / 1000) - 0.05);

    bassOsc.connect(bassGain);
    bassGain.connect(audioCtx.destination);

    bassOsc.start(now);
    bassOsc.stop(now + (dur / 1000));

    noteIdx = (noteIdx + 1) % notes.length;
    melodyInterval = setTimeout(playNextNote, dur);
  }

  playNextNote();
}

function stopBirthdayTune() {
  if (melodyInterval) clearTimeout(melodyInterval);
}

function playSynthSound(type) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'heart' || type === 'sparkle') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'cheer') {
    // Sparkle chord sweep
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, now + i * 0.06);
      g.gain.setValueAtTime(0.15, now + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(now + i * 0.06);
      o.stop(now + i * 0.06 + 0.3);
    });
  } else {
    // Pop / Beep
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}

/* ==========================================================================
   4. BIRTHDAY CAKE & CANDLE BLOW ENGINE
   ========================================================================== */
function initCandleBlowEngine() {
  const flames = document.querySelectorAll('.candle-flame');
  const blowBtn = document.getElementById('blow-btn');
  const wishBox = document.getElementById('wish-reveal-box');

  flames.forEach(flame => {
    flame.addEventListener('click', () => {
      if (!flame.classList.contains('blown-out')) {
        flame.classList.add('blown-out');
        playSynthSound('sparkle');
        checkAllCandlesBlown();
      }
    });
  });

  if (blowBtn) {
    blowBtn.addEventListener('click', () => {
      flames.forEach(flame => flame.classList.add('blown-out'));
      playSynthSound('cheer');
      triggerConfettiBurst(100);
      if (wishBox) wishBox.classList.remove('hidden');
    });
  }

  function checkAllCandlesBlown() {
    const activeFlames = document.querySelectorAll('.candle-flame:not(.blown-out)');
    if (activeFlames.length === 0) {
      playSynthSound('cheer');
      triggerConfettiBurst(100);
      if (wishBox) wishBox.classList.remove('hidden');
    }
  }
}

/* ==========================================================================
   5. CONFETTI & CELEBRATION CANVAS ENGINE
   ========================================================================== */
let confettiParticles = [];
let confettiCtx = null;
let animationFrameId = null;

function initConfettiCanvas() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  confettiCtx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function renderConfetti() {
    if (!confettiCtx) return;

    confettiCtx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRot;
      p.opacity -= 0.005;

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rotation);
      confettiCtx.globalAlpha = Math.max(0, p.opacity);
      confettiCtx.fillStyle = p.color;

      if (p.shape === 'circle') {
        confettiCtx.beginPath();
        confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        confettiCtx.fill();
      } else {
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

      confettiCtx.restore();

      if (p.y > canvas.height + 20 || p.opacity <= 0) {
        confettiParticles.splice(i, 1);
      }
    }

    if (confettiParticles.length > 0) {
      animationFrameId = requestAnimationFrame(renderConfetti);
    } else {
      animationFrameId = null;
    }
  }

  window.triggerConfettiBurst = function(count = 80) {
    const colors = ['#FFE500', '#FF2A85', '#00B0FF', '#7B2CBF', '#FFFFFF', '#00E676'];

    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 5 + 3,
        gravity: 0.08,
        size: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        opacity: 1,
        shape: Math.random() > 0.5 ? 'circle' : 'rect'
      });
    }

    if (!animationFrameId) {
      renderConfetti();
    }
  };
}

/* ==========================================================================
   6. GUESTBOOK WISHES WALL
   ========================================================================== */
function initGuestbookWall() {
  const wishForm = document.getElementById('wish-form');
  const wishesBoard = document.getElementById('wishes-board');

  if (!wishForm || !wishesBoard) return;

  wishForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const authorInput = document.getElementById('wish-author');
    const messageInput = document.getElementById('wish-message');

    const author = authorInput.value.trim();
    const message = messageInput.value.trim();

    if (!author || !message) return;

    // Sticky note color variants
    const colors = ['note-pink', 'note-yellow', 'note-blue'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomRotation = (Math.random() * 8 - 4).toFixed(1);

    const note = document.createElement('div');
    note.className = `wish-note ${randomColor}`;
    note.style.transform = `rotate(${randomRotation}deg)`;
    note.style.animation = 'popIn 0.4s ease-out';

    note.innerHTML = `
      <div class="note-pin">📌</div>
      <p class="note-text">"${escapeHTML(message)}"</p>
      <span class="note-author">— De la part de ${escapeHTML(author)}</span>
    `;

    wishesBoard.prepend(note);
    playSynthSound('heart');
    triggerConfettiBurst(40);

    // Reset form
    authorInput.value = '';
    messageInput.value = '';
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
