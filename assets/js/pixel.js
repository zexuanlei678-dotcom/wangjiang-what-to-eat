/*
 * 像素小人引擎
 * ------------------------------------------------
 * 每个角色在24×32的逻辑像素画布上绘制，再整数倍放大，保持硬边像素感。
 * 想改造型？直接改下面的调色板和drawGirl/drawBoy里的矩形坐标即可。
 * 想加动作？在ACTIONS表里加一项，返回每帧的姿态参数就行。
 */
(function () {
  const W = 24;
  const H = 32;

  // ---------- 调色板 ----------
  const PAL = {
    girl: {
      hair: '#4B2D2B', hairHi: '#734A45', hairDark: '#37201F',
      skin: '#F8DBBF', skinSh: '#EBBE9B', eye: '#3A2626', white: '#FFFFFF',
      blush: '#F5A8B8', mouth: '#C9666C', mouthIn: '#9E434B',
      cardigan: '#F9EFE1', cardiganSh: '#E6D2BC', ribbon: '#E98B9B', ribbonDk: '#D06F80',
      skirt: '#D97E96', skirtDk: '#BE5F7A', sock: '#FCF9F3', shoe: '#7A4A2E', shoeSh: '#5E3621',
      bowl: '#F3F0E8', bowlSh: '#D8D2C6'
    },
    boy: {
      hair: '#2F2A34', hairHi: '#4F4758',
      skin: '#F8DBBF', skinSh: '#EBBE9B', eye: '#2A2226', white: '#FFFFFF',
      blush: '#F0B4A4', mouth: '#B5606A', mouthIn: '#8E434C',
      jacket: '#6E8FB1', jacketSh: '#557490', tee: '#FBFAF6', teeSh: '#E6E2D8',
      pants: '#3E4A5E', pantsSh: '#2F3949', shoe: '#F5F3EE', shoeSh: '#C8C3BB'
    }
  };

  // ---------- 绘制工具 ----------
  function makePainter(ctx, scale, dy, dx, flip) {
    return function (x, y, w, h, color) {
      if (flip) x = W - x - w;
      ctx.fillStyle = color;
      ctx.fillRect((x + dx) * scale, (y + dy) * scale, w * scale, h * scale);
    };
  }

  // 手臂姿态：down / up / up2（举更高）/ out / cheeks / belly / bowl
  const ARM_UP = {
    up:  [[5, 15, 2, 3], [3, 12, 2, 3], [3, 10, 2, 2]],
    up2: [[5, 14, 2, 3], [3, 11, 2, 3], [3, 9, 2, 2]]
  };
  function drawGirlArm(R, c, side, pose) {
    const L = side === 'L';
    const R1 = (x, y, w, h, col) => R(L ? x : W - x - w, y, w, h, col);
    const R2 = R1;
    if (ARM_UP[pose]) {
      const a = ARM_UP[pose];
      R1(a[0][0], a[0][1], a[0][2], a[0][3], c.cardigan);
      R1(a[1][0], a[1][1], a[1][2], a[1][3], c.cardigan);
      R1(a[2][0], a[2][1], a[2][2], a[2][3], c.skin);
    } else if (pose === 'out') {
      R2(3, 16, 4, 2, c.cardigan); R2(2, 16, 1, 2, c.skin);
    } else if (pose === 'cheeks') {
      R1(5, 15, 2, 2, c.cardigan); R1(5, 12, 2, 3, c.skin);
    } else if (pose === 'belly') {
      R1(6, 16, 2, 4, c.cardigan); R2(8, 20, 2, 2, c.skin);
    } else if (pose === 'bowl') {
      R1(6, 16, 2, 3, c.cardigan); R2(8, 18, 2, 2, c.skin);
    } else { // down
      R1(6, 16, 2, 6, c.cardigan); R1(6, 22, 2, 1, c.skin);
    }
  }

  function drawBoyArm(R, c, side, pose) {
    const L = side === 'L';
    const R1 = (x, y, w, h, col) => R(L ? x : W - x - w, y, w, h, col);
    const R2 = R1;
    if (ARM_UP[pose]) {
      const a = ARM_UP[pose];
      R1(a[0][0], a[0][1], a[0][2], a[0][3], c.jacket);
      R1(a[1][0], a[1][1], a[1][2], a[1][3], c.jacket);
      R1(a[2][0], a[2][1], a[2][2], a[2][3], c.skin);
    } else if (pose === 'out') {
      R2(3, 16, 4, 2, c.jacket); R2(2, 16, 1, 2, c.skin);
    } else if (pose === 'cheeks') {
      R1(5, 15, 2, 2, c.jacket); R1(5, 12, 2, 3, c.skin);
    } else if (pose === 'belly') {
      R1(6, 16, 2, 5, c.jacket); R2(8, 20, 2, 2, c.skin);
    } else if (pose === 'bowl') {
      R1(6, 16, 2, 4, c.jacket); R2(8, 18, 2, 2, c.skin);
    } else { // down
      R1(6, 16, 2, 6, c.jacket); R1(6, 22, 2, 1, c.skin);
    }
  }

  function drawEyes(R, c, eyes, isGirl) {
    const eye = c.eye;
    if (eyes === 'closed') {
      R(9, 10, 2, 1, eye); R(13, 10, 2, 1, eye);
    } else if (eyes === 'happy') {
      R(9, 9, 1, 1, eye); R(8, 10, 1, 1, eye); R(10, 10, 1, 1, eye);
      R(14, 9, 1, 1, eye); R(13, 10, 1, 1, eye); R(15, 10, 1, 1, eye);
    } else if (eyes === 'wide') {
      R(9, 9, 2, 2, c.white); R(10, 10, 1, 1, eye);
      R(13, 9, 2, 2, c.white); R(13, 10, 1, 1, eye);
    } else {
      R(9, 9, 2, 2, eye); R(9, 9, 1, 1, c.white);
      R(13, 9, 2, 2, eye); R(13, 9, 1, 1, c.white);
      if (isGirl) { R(9, 8, 2, 1, c.hairDark); R(13, 8, 2, 1, c.hairDark); } // 睫毛
    }
  }

  function drawMouth(R, c, mouth) {
    switch (mouth) {
      case 'open': R(11, 12, 2, 2, c.mouth); R(11, 13, 2, 1, c.mouthIn); break;
      case 'o': R(11, 12, 2, 2, c.mouth); R(11, 13, 2, 1, c.mouthIn); break;
      case 'wavy': R(10, 12, 1, 1, c.mouth); R(12, 12, 1, 1, c.mouth); R(11, 13, 1, 1, c.mouth); R(13, 13, 1, 1, c.mouth); break;
      case 'smileBig': R(10, 12, 4, 1, c.mouth); R(11, 13, 2, 1, c.mouth); break;
      default: R(11, 12, 2, 1, c.mouth);
    }
  }

  // ---------- 璇璇 ----------
  function drawGirl(R, p) {
    const c = PAL.girl;
    const sw = p.sway || 0;
    // 后发
    R(5, 4, 14, 13, c.hairDark);
    R(6, 17, 12, 3, c.hairDark);
    R(8 + sw, 20, 8, 1, c.hairDark);
    // 腿、袜子、鞋
    R(9, 26, 2, 2, c.skin); R(13, 26, 2, 2, c.skin);
    R(9, 28, 2, 2, c.sock); R(13, 28, 2, 2, c.sock);
    R(8, 30, 3, 1, c.shoe); R(13, 30, 3, 1, c.shoe);
    R(8, 31, 3, 1, c.shoeSh); R(13, 31, 3, 1, c.shoeSh);
    // 百褶裙
    R(7, 23, 10, 3, c.skirt);
    R(9, 23, 1, 2, c.skirtDk); R(12, 23, 1, 2, c.skirtDk); R(15, 23, 1, 2, c.skirtDk);
    R(7, 25, 10, 1, c.skirtDk);
    // 开衫身体
    R(9, 15, 6, 1, c.cardigan);
    R(8, 16, 8, 7, c.cardigan);
    R(8, 16, 1, 6, c.cardiganSh); R(15, 16, 1, 6, c.cardiganSh); // 躯干与手臂分界
    R(8, 22, 8, 1, c.cardiganSh);
    // 内搭+蝴蝶结
    R(11, 16, 2, 5, c.ribbon);
    R(11, 21, 2, 2, c.cardiganSh);
    R(10, 15, 1, 1, c.ribbonDk); R(13, 15, 1, 1, c.ribbonDk); R(11, 15, 2, 1, c.ribbon);
    // 脖子、脸
    R(11, 14, 2, 1, c.skinSh);
    R(7, 6, 10, 7, c.skin); R(8, 13, 8, 1, c.skin);
    R(7, 13, 1, 1, c.skinSh); R(16, 13, 1, 1, c.skinSh);
    // 前发：头顶+侧发+空气刘海
    R(6, 2, 12, 3, c.hair);
    R(5, 4, 14, 3, c.hair);
    R(5, 7, 2, 6, c.hair); R(17, 7, 2, 6, c.hair);
    R(5 + sw, 13, 2, 1, c.hair); R(17 + sw, 13, 2, 1, c.hair);
    R(7, 6, 10, 1, c.hair);
    R(7, 7, 4, 1, c.hair); R(13, 7, 4, 1, c.hair);
    R(8, 8, 2, 1, c.hair); R(14, 8, 2, 1, c.hair);
    R(9, 3, 3, 1, c.hairHi); R(7, 4, 2, 1, c.hairHi);
    // 手臂（画在头发之后，举手时不会被侧发遮挡）
    drawGirlArm(R, c, 'L', p.armL);
    drawGirlArm(R, c, 'R', p.armR);
    if (p.armL === 'bowl' && p.armR === 'bowl') {
      R(9, 17, 6, 2, c.bowl); R(10, 19, 4, 1, c.bowlSh);
    }
    // 五官
    drawEyes(R, c, p.eyes, true);
    const b = Math.max(1, p.blush || 0);
    if (b > 0) { R(7, 11, 2, 1, c.blush); R(15, 11, 2, 1, c.blush); }
    if (b > 1) { R(7, 12, 1, 1, c.blush); R(16, 12, 1, 1, c.blush); }
    drawMouth(R, c, p.mouth);
  }

  // ---------- 仔仔 ----------
  function drawBoy(R, p) {
    const c = PAL.boy;
    // 腿、鞋
    R(8, 23, 8, 2, c.pants); R(8, 23, 8, 1, c.pantsSh);
    R(9, 25, 2, 3, c.pants); R(13, 25, 2, 3, c.pants);
    R(9, 28, 2, 1, c.shoe); R(13, 28, 2, 1, c.shoe);
    R(8, 29, 3, 2, c.shoe); R(13, 29, 3, 2, c.shoe);
    R(8, 30, 3, 1, c.shoeSh); R(13, 30, 3, 1, c.shoeSh);
    // 外套+T恤
    R(8, 15, 8, 8, c.jacket);
    R(10, 15, 4, 8, c.tee);
    R(9, 15, 1, 2, c.jacketSh); R(14, 15, 1, 2, c.jacketSh);
    R(10, 15, 4, 1, c.teeSh);
    R(8, 22, 2, 1, c.jacketSh); R(14, 22, 2, 1, c.jacketSh);
    R(8, 16, 1, 6, c.jacketSh); R(15, 16, 1, 6, c.jacketSh); // 躯干与手臂分界
    // 脖子、脸
    R(11, 14, 2, 1, c.skinSh);
    R(7, 6, 10, 7, c.skin); R(8, 13, 8, 1, c.skin);
    // 短发
    R(7, 3, 10, 3, c.hair);
    R(6, 5, 12, 2, c.hair);
    R(7, 7, 3, 1, c.hair); R(12, 7, 3, 1, c.hair); R(10, 7, 1, 1, c.hair);
    R(6, 7, 1, 2, c.hair); R(17, 7, 1, 2, c.hair);
    R(9, 3, 3, 1, c.hairHi);
    // 手臂（画在头发之后）
    drawBoyArm(R, c, 'L', p.armL);
    drawBoyArm(R, c, 'R', p.armR);
    if (p.armL === 'bowl' && p.armR === 'bowl') {
      R(9, 17, 6, 2, '#F3F0E8'); R(10, 19, 4, 1, '#D8D2C6');
    }
    // 五官
    drawEyes(R, c, p.eyes, false);
    if (p.blush) { R(7, 11, 2, 1, c.blush); R(15, 11, 2, 1, c.blush); }
    drawMouth(R, c, p.mouth);
  }

  // ---------- 动作表：返回每一帧的姿态 ----------
  const ACTIONS = {
    bob:      { fps: 2,   frames: () => [{ dy: 0 }, { dy: 1 }] },
    wave:     { fps: 4,   frames: () => [{ armR: 'up', mouth: 'smile' }, { armR: 'up2', eyes: 'happy', sway: 1 }] },
    dance:    { fps: 4,   frames: () => [
      { dx: -1, armL: 'up', armR: 'down', eyes: 'happy', mouth: 'smileBig', sway: -1 },
      { dx: 0, dy: 1, armL: 'down', armR: 'down', eyes: 'happy', mouth: 'smileBig' },
      { dx: 1, armL: 'down', armR: 'up', eyes: 'happy', mouth: 'smileBig', sway: 1 },
      { dx: 0, dy: 1, armL: 'down', armR: 'down', eyes: 'open', mouth: 'smile' }
    ] },
    spin:     { fps: 7,   frames: () => [{}, { flip: true }, { flip: true, dy: 1 }, { dy: 1 }] },
    eat:      { fps: 3,   frames: () => [
      { armL: 'bowl', armR: 'bowl', mouth: 'open', eyes: 'happy' },
      { armL: 'bowl', armR: 'bowl', mouth: 'smile', eyes: 'closed' },
      { armL: 'bowl', armR: 'bowl', mouth: 'smileBig', eyes: 'happy', dy: 1 }
    ] },
    hungry:   { fps: 3,   frames: () => [
      { armL: 'belly', mouth: 'wavy', eyes: 'open', dy: 0 },
      { armL: 'belly', mouth: 'wavy', eyes: 'closed', dy: 1, sway: -1 }
    ] },
    boing:    { fps: 5,   frames: () => [
      { armL: 'out', armR: 'out', mouth: 'o', eyes: 'wide' },
      { armL: 'out', armR: 'out', dy: -3, mouth: 'smileBig', eyes: 'happy' },
      { armL: 'out', armR: 'out', dy: -1, mouth: 'smile', eyes: 'open' }
    ] },
    jump:     { fps: 5,   frames: () => [
      { armL: 'down', armR: 'down' },
      { armL: 'up', armR: 'up', dy: -4, eyes: 'happy', mouth: 'smileBig' },
      { armL: 'up', armR: 'up', dy: -4, eyes: 'happy', mouth: 'smileBig' },
      { armL: 'out', armR: 'out', dy: -1 }
    ] },
    shy:      { fps: 3,   frames: () => [
      { armL: 'cheeks', armR: 'cheeks', eyes: 'happy', blush: 2, mouth: 'smile', dx: -1 },
      { armL: 'cheeks', armR: 'cheeks', eyes: 'closed', blush: 2, mouth: 'smile', dx: 1, sway: 1 }
    ] },
    surprise: { fps: 4,   frames: () => [
      { armL: 'out', armR: 'out', eyes: 'wide', mouth: 'o' },
      { armL: 'out', armR: 'out', eyes: 'wide', mouth: 'o', dy: -1 }
    ] },
    cheer:    { fps: 5,   frames: () => [
      { armL: 'up', armR: 'down', eyes: 'happy', mouth: 'smileBig', dy: 0, sway: -1 },
      { armL: 'down', armR: 'up', eyes: 'happy', mouth: 'open', dy: -2, sway: 1 }
    ] }
  };
  const DEFAULT_POSE = { dy: 0, dx: 0, sway: 0, armL: 'down', armR: 'down', eyes: 'open', mouth: 'smile', blush: 0, flip: false };

  // ---------- 精灵实例 ----------
  const live = new Set();
  let rafId = null;
  let lastTs = 0;

  class Sprite {
    constructor(container, who, opts = {}) {
      this.who = who;
      this.scale = opts.scale || 4;
      this.action = opts.action || 'bob';
      this.freeze = opts.freeze; // 调试用：固定显示第N帧
      this.t = -(opts.delay || 0);
      this.blinkT = 1.5 + Math.random() * 3;
      this.blinking = 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.dpr = dpr;
      const cv = document.createElement('canvas');
      cv.width = W * this.scale * dpr;
      cv.height = H * this.scale * dpr;
      cv.style.width = W * this.scale + 'px';
      cv.style.height = H * this.scale + 'px';
      cv.className = 'pixel-sprite-canvas';
      cv.setAttribute('aria-hidden', 'true');
      this.canvas = cv;
      cv.__sprite = this;
      this.ctx = cv.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      container.appendChild(cv);
      this.draw(DEFAULT_POSE);
      live.add(this);
      startLoop();
    }
    setAction(a) { if (ACTIONS[a]) { this.action = a; this.t = 0; } }
    step(dt) {
      this.t += dt;
      const def = ACTIONS[this.action];
      const frames = def.frames();
      const idx = this.freeze != null ? this.freeze : Math.floor(Math.max(0, this.t) * def.fps) % frames.length;
      const pose = Object.assign({}, DEFAULT_POSE, frames[idx]);
      // 随机眨眼（仅在睁眼动作下）
      this.blinkT -= dt;
      if (this.blinkT <= 0) { this.blinking = 0.13; this.blinkT = 2.2 + Math.random() * 3.5; }
      if (this.blinking > 0) {
        this.blinking -= dt;
        if (pose.eyes === 'open') pose.eyes = 'closed';
      }
      this.draw(pose);
    }
    draw(p) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const R = makePainter(ctx, this.scale, p.dy, p.dx, p.flip);
      if (this.who === 'girl' || this.who === 'female') drawGirl(R, p); else drawBoy(R, p);
    }
    destroy() { live.delete(this); this.canvas.remove(); }
  }

  function startLoop() {
    if (rafId) return;
    lastTs = performance.now();
    const loop = (ts) => {
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      if (tick(dt)) rafId = requestAnimationFrame(loop); else rafId = null;
    };
    rafId = requestAnimationFrame(loop);
  }
  // 看门狗：标签页在后台时rAF会被浏览器暂停，用定时器兜底，保证切回来画面不"冻住"
  setInterval(() => {
    if (!live.size) return;
    const now = performance.now();
    if (now - lastTs < 120) return;
    const dt = Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now; tick(dt);
  }, 50);
  function tick(dt) {
    let any = false;
    live.forEach((s) => {
      if (!s.canvas.isConnected) { live.delete(s); return; }
      s.step(dt); any = true;
    });
    return any;
  }

  window.PixelSprite = Sprite;
  window.PIXEL_SIZE = { W, H };
})();
