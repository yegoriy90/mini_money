// Голос, звуки й святкування.

let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => v.lang?.toLowerCase().startsWith('uk')) || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function speak(text) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'uk-UA';
  if (voice) u.voice = voice;
  u.rate = 0.95;
  u.pitch = 1.15;
  speechSynthesis.speak(u);
}

let ctx = null;
function ac() {
  if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
// iOS дозволяє звук лише після дотику
window.addEventListener('pointerdown', () => ac(), { once: true });

function tone(freq, start, dur, type = 'sine', vol = 0.18) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

export const sound = {
  tap() { tone(660, 0, 0.08, 'triangle', 0.08); },
  coin() { tone(988, 0, 0.12, 'square', 0.06); tone(1319, 0.08, 0.35, 'square', 0.06); },
  done() { [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.12)); },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.14));
    tone(1319, 0.5, 0.6, 'triangle', 0.12);
    for (let i = 0; i < 6; i++) { tone(988, 0.8 + i * 0.12, 0.1, 'square', 0.04); tone(1319, 0.86 + i * 0.12, 0.2, 'square', 0.04); }
  },
};

export function confetti(n = 60) {
  const layer = document.createElement('div');
  layer.className = 'confetti';
  const items = ['🪙', '⭐', '💖', '🎀', '✨', '🪙', '💜'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.textContent = items[i % items.length];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDelay = Math.random() * 0.8 + 's';
    s.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
    s.style.fontSize = 22 + Math.random() * 26 + 'px';
    layer.appendChild(s);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 4000);
}
