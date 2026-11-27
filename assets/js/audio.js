/*
 * 8-bit风格音效（原生WebAudio，无依赖）
 * 音色：sine合成器 + 短促包络，模拟原版的"叮/啵/上行音阶"。
 */
(function () {
  let ctx = null;
  let enabled = true;
  try { enabled = localStorage.getItem('wangjiang_sound_enabled') !== '0'; } catch (e) {}

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, vol, type) {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    const t0 = c.currentTime + start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function boing(soft) {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    const t0 = c.currentTime;
    const f0 = soft ? 180 : 150;
    o.frequency.setValueAtTime(f0 * 2.2, t0);
    o.frequency.exponentialRampToValueAtTime(f0, t0 + (soft ? 0.3 : 0.15));
    g.gain.setValueAtTime(soft ? 0.12 : 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (soft ? 0.5 : 0.25));
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + 0.6);
    tone(659, soft ? 0.09 : 0.03, soft ? 0.3 : 0.15, 0.06);
  }

  const SFX = {
    boing: (s) => boing(s && s.soft),
    pop: (s) => { const soft = s && s.soft; tone(soft ? 440 : 523, 0, soft ? 0.2 : 0.1, 0.12); tone(soft ? 523 : 659, soft ? 0.12 : 0.06, soft ? 0.22 : 0.11, 0.12); },
    chime: (s) => { const soft = s && s.soft; tone(soft ? 523 : 659, 0, soft ? 0.26 : 0.13, 0.1); tone(soft ? 392 : 523, soft ? 0.16 : 0.09, soft ? 0.32 : 0.18, 0.1); },
    jingle: (s) => { const soft = s && s.soft; const d = soft ? 0.12 : 0.07; tone(262, 0, 0.14, 0.1); tone(330, d, 0.14, 0.1); tone(392, d * 2, 0.14, 0.1); tone(330, d * 3, 0.22, 0.1); },
    success: () => { tone(262, 0, 0.12, 0.12); tone(330, 0.07, 0.12, 0.12); tone(392, 0.14, 0.12, 0.12); tone(523, 0.21, 0.2, 0.12); tone(659, 0.28, 0.3, 0.12); },
    tick: () => tone(392, 0, 0.06, 0.1),
    surprise: () => { tone(262, 0, 0.08, 0.1); tone(392, 0.06, 0.12, 0.1); tone(523, 0.12, 0.18, 0.1); },
    speak: () => { tone(440, 0, 0.26, 0.06); tone(392, 0.16, 0.3, 0.06); }
  };

  window.Sfx = {
    play(name, opts) {
      if (!enabled) return;
      try { if (SFX[name]) SFX[name](opts || {}); } catch (e) { /* 忽略音频错误 */ }
    },
    get enabled() { return enabled; },
    set enabled(v) {
      enabled = !!v;
      try { localStorage.setItem('wangjiang_sound_enabled', enabled ? '1' : '0'); } catch (e) {}
    },
    // 首次交互时解锁AudioContext
    unlock() { try { ac(); } catch (e) {} }
  };
})();
