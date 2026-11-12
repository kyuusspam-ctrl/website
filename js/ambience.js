// Ambience layer: lamp toggle, cursor-reactive particles, optional room song.
// It only touches its own elements and reads the existing `still` and `lamp-off` classes,
// so app.js logic is unchanged.
(() => {
  const room = document.getElementById('room');
  const actions = room?.querySelector('.room-actions');
  if (!room || !actions) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- Lamp: click or press Enter/Space to switch on or off ---------- */
  const lamp = room.querySelector('.room-lamp');
  function setLamp(on) {
    room.classList.toggle('lamp-off', !on);
    if (!lamp) return;
    lamp.setAttribute('aria-pressed', String(on));
    lamp.title = on ? 'Switch lamp off' : 'Switch lamp on';
  }
  if (lamp) {
    lamp.removeAttribute('aria-hidden');
    lamp.setAttribute('role', 'button');
    lamp.setAttribute('aria-label', 'Reading lamp');
    lamp.tabIndex = 0;
    setLamp(true);
    lamp.addEventListener('click', () => setLamp(room.classList.contains('lamp-off')));
    lamp.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lamp.click(); }
    });
  }

  /* ---------- Particles: drift, drift toward the cursor slowly, then scatter at random ---------- */
  const canvas = document.createElement('canvas');
  canvas.className = 'ambient-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  room.append(canvas);
  const ctx = canvas.getContext('2d');

  // Soft sprites, drawn once and reused: warm gold, and a paler moonlit one
  function makeSprite(core, mid) {
    const size = 48, c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d'), m = size / 2;
    const gr = g.createRadialGradient(m, m, 0, m, m, m);
    gr.addColorStop(0, core);
    gr.addColorStop(0.25, mid);
    gr.addColorStop(1, 'rgba(246,205,130,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, size, size);
    return c;
  }
  const spriteWarm = makeSprite('rgba(255,242,210,1)', 'rgba(250,205,130,.55)');
  const spritePale = makeSprite('rgba(255,255,255,1)', 'rgba(215,228,255,.6)');

  let W = 0, H = 0, dpr = 1, particles = [];
  const pointer = { x: 0, y: 0, lastMove: 0 };
  let dark = 0, time = 0, last = performance.now(), raf = 0;

  function seed(count) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: 0, vy: 0,
        size: rand(1.6, 3.6), phase: rand(0, 6.28), tw: rand(0.4, 1.1),
        mode: 'drift', timer: rand(120, 480),
        jx: 0, jy: 0, jt: 0,
      });
    }
  }

  function resize() {
    const nw = room.clientWidth, nh = room.clientHeight;
    if (!nw || !nh) return;
    if (W && H) particles.forEach(p => { p.x *= nw / W; p.y *= nh / H; });
    W = nw; H = nh;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!particles.length) seed(Math.round(Math.min(90, Math.max(24, W * H / 14000))));
    draw();
  }

  // Pointer is "active" for a short time after the last move (works for touch too)
  const pointerActive = () => performance.now() - pointer.lastMove < 2500;
  function onPointer(e) {
    const r = room.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.lastMove = performance.now();
  }
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onPointer, { passive: true });

  function update(t) {
    const active = pointerActive();
    for (const p of particles) {
      p.timer -= t;
      if (p.timer <= 0) {
        if (p.mode === 'follow') {
          // Scatter in a random direction after drifting toward the cursor
          p.mode = 'repel';
          p.timer = rand(90, 200);
          const a = rand(0, Math.PI * 2), s = rand(0.5, 1.1);
          p.vx += Math.cos(a) * s;
          p.vy += Math.sin(a) * s;
        } else if (p.mode === 'repel') {
          p.mode = 'drift';
          p.timer = rand(200, 500);
        } else {
          p.mode = active && Math.random() < 0.7 ? 'follow' : 'drift';
          p.timer = p.mode === 'follow' ? rand(300, 700) : rand(200, 500);
        }
      }

      // Random gentle wandering
      p.jt -= t;
      if (p.jt <= 0) { p.jx = rand(-0.02, 0.02); p.jy = rand(-0.02, 0.02); p.jt = rand(20, 60); }
      p.vx += p.jx * t;
      p.vy += p.jy * t;

      const dx = pointer.x - p.x, dy = pointer.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (active && p.mode === 'follow') {
        // Slow pull toward the cursor
        p.vx += (dx / d) * 0.012 * t;
        p.vy += (dy / d) * 0.012 * t;
      } else if (active && p.mode === 'repel' && d < 220) {
        // Push away from the cursor
        p.vx -= (dx / d) * 0.02 * t;
        p.vy -= (dy / d) * 0.02 * t;
      }

      // Speed cap and damping keep motion slow and soft
      const cap = p.mode === 'repel' ? 1.5 : 0.8;
      p.vx *= Math.pow(0.985, t);
      p.vy *= Math.pow(0.985, t);
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > cap) { p.vx = (p.vx / sp) * cap; p.vy = (p.vy / sp) * cap; }

      p.x += p.vx * t;
      p.y += p.vy * t;
      // Wrap around the room edges
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      const flicker = 0.75 + 0.25 * Math.sin(time * 0.002 * p.tw + p.phase);
      // dark = 0 (lamp ON): particles still glow, but softly and small.
      // dark = 1 (lamp OFF): they glow much more: bigger, brighter, a little paler.
      const size = p.size * (3.2 + 3.6 * dark) * (p.mode === 'repel' ? 1.15 : 1);
      const a = (0.26 + 0.7 * dark) * flicker;
      ctx.globalAlpha = a * (1 - 0.4 * dark);
      ctx.drawImage(spriteWarm, p.x - size / 2, p.y - size / 2, size, size);
      if (dark > 0.02) {
        ctx.globalAlpha = a * 0.75 * dark;
        ctx.drawImage(spritePale, p.x - size / 2, p.y - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(3, (now - last) / 16.67);
    last = now;
    if (room.hidden) return;
    time += dt * 16.67;
    const target = room.classList.contains('lamp-off') ? 1 : 0;
    dark += (target - dark) * 0.04 * dt;
    // The atmosphere toggle in app.js adds body.still, which freezes motion
    if (!document.body.classList.contains('still')) update(dt);
    draw();
  }

  resize();
  new ResizeObserver(resize).observe(room);
  if (reduced) {
    draw();
  } else {
    raf = requestAnimationFrame(t => { last = t; frame(t); });
  }

  /* ---------- Room song: put assets/song.mp3 in the folder to enable ---------- */
  const song = new Audio('assets/song.mp3');
  song.loop = true;
  song.volume = 0.35;
  song.preload = 'none';

  const musicBtn = document.createElement('button');
  musicBtn.id = 'music-toggle';
  musicBtn.className = 'quiet-button';
  musicBtn.setAttribute('aria-pressed', 'false');
  musicBtn.title = 'Play the room song';
  musicBtn.innerHTML = 'Music <span>♫</span>';
  actions.insertBefore(musicBtn, document.getElementById('lock-room'));

  function setMusic(on) {
    musicBtn.setAttribute('aria-pressed', String(on));
    musicBtn.innerHTML = on ? 'Music <span>Ⅱ</span>' : 'Music <span>♫</span>';
    if (on) song.play().catch(() => setMusic(false));
    else song.pause();
  }
  musicBtn.addEventListener('click', () => setMusic(musicBtn.getAttribute('aria-pressed') !== 'true'));

  fetch('assets/song.mp3', { method: 'HEAD' })
    .then(r => { if (!r.ok) throw new Error('missing'); })
    .catch(() => {
      musicBtn.disabled = true;
      musicBtn.title = 'Add assets/song.mp3 to play music';
    });
})();
