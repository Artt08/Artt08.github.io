// Skate Runner - simple infinite runner using canvas
// - Default visuals are drawn procedurally so no external assets are required.
// - You can replace the player and background images using the file inputs in index.html.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: true });
  let W = canvas.width;
  let H = canvas.height;

  // DOM
  const scoreEl = document.getElementById('score');
  const stateEl = document.getElementById('state');
  const playerFile = document.getElementById('playerFile');
  const bgFile = document.getElementById('bgFile');
  const resetBtn = document.getElementById('resetAssets');
  const restartBtn = document.getElementById('restart');

  // Game state
  let running = false;
  let gameOver = false;
  let lastTime = 0;
  let spawnTimer = 0;
  let speed = 350; // px per second (scroll speed)
  let distance = 0;
  let score = 0;
  let highSpeedAt = 0;

  // Asset holders
  let playerImg = null; // Image object if uploaded
  let bgImg = null;

  // Default colors / procedural assets
  const colors = {
    ground: '#444',
    player: '#1a73e8',
    obstacle: '#333',
    cloud: '#f0f5ff',
  };

  // Player
  const player = {
    x: 60,
    y: 0,
    w: 34,
    h: 44,
    vy: 0,
    grounded: true,
    jumping: false,
    ducking: false,
    gravity: 2000,
    jumpSpeed: -700,
  };

  // Obstacles
  const obstacles = [];
  const obstacleTemplates = [
    { w: 20, h: 40, yOff: 0 },
    { w: 30, h: 60, yOff: 0 },
    { w: 46, h: 28, yOff: 16 }, // low obstacle (e.g. curb)
  ];

  // Background elements (clouds)
  const clouds = [];

  // Helpers
  function setState(text) { stateEl.textContent = text; }

  function resizeCanvas() {
    // Make canvas responsive while keeping coordinate system same aspect ratio
    // Actual drawing uses canvas.width/height in pixels; keep CSS responsive.
    const container = canvas.parentElement;
    const maxWidth = Math.min(900, container.clientWidth - 24);
    canvas.style.width = maxWidth + 'px';
  }

  // Input
  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault();
    keys[e.key] = true;
    handleKey(e, true);
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    handleKey(e, false);
  });

  // Mobile touch
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!running) startGame();
    jump();
  }, { passive: false });

  // File uploads
  playerFile.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      playerImg = img;
    };
    img.src = URL.createObjectURL(f);
  });

  bgFile.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      bgImg = img;
    };
    img.src = URL.createObjectURL(f);
  });

  resetBtn.addEventListener('click', () => {
    playerImg = null;
    bgImg = null;
    player.w = 34; player.h = 44;
  });

  restartBtn.addEventListener('click', () => {
    resetGame();
    startGame();
  });

  function handleKey(e, down) {
    if (e.type !== 'keydown') return;
    const key = e.key;
    if (key === 'ArrowUp' || key === ' ' || key === 'Spacebar') {
      if (!running) startGame();
      jump();
    } else if (key === 'ArrowDown') {
      duck(true);
    } else if (key === 'r' || key === 'R') {
      resetGame();
      startGame();
    }
  }

  function jump() {
    if (player.grounded && !player.jumping) {
      player.vy = player.jumpSpeed;
      player.grounded = false;
      player.jumping = true;
    }
  }

  function duck(enable = false) {
    player.ducking = enable;
    if (enable) {
      player.h = 26;
    } else {
      player.h = 44;
    }
  }

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowDown') duck(false);
  });

  // Game lifecycle
  function init() {
    resizeCanvas();
    // seed clouds
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * W,
        y: 20 + Math.random() * 60,
        w: 60 + Math.random() * 80,
        speed: 10 + Math.random() * 20,
      });
    }
    setState('Press Space / Tap to start');
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(loop);
  }

  function startGame() {
    running = true;
    gameOver = false;
    lastTime = performance.now();
    spawnTimer = 0;
    speed = 350;
    score = 0;
    distance = 0;
    obstacles.length = 0;
    setState('Go!');
  }

  function resetGame() {
    running = false;
    gameOver = false;
    player.vy = 0;
    player.grounded = true;
    player.jumping = false;
    player.ducking = false;
    player.h = 44;
    obstacles.length = 0;
    clouds.length = 0;
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * W,
        y: 20 + Math.random() * 60,
        w: 60 + Math.random() * 80,
        speed: 10 + Math.random() * 20,
      });
    }
    scoreEl.textContent = '0';
    setState('Press Space / Tap to start');
  }

  function spawnObstacle() {
    const t = obstacleTemplates[Math.floor(Math.random() * obstacleTemplates.length)];
    const h = t.h;
    const w = t.w;
    const y = H - 24 - h + (t.yOff || 0);
    obstacles.push({ x: W + 40, y, w, h, passed: false });
  }

  function update(dt) {
    // dt in seconds
    if (!running) return;

    // speed ramping
    speed += dt * 6; // slow acceleration
    distance += speed * dt;
    score = Math.floor(distance / 10);
    scoreEl.textContent = score;

    // player physics
    player.vy += player.gravity * dt;
    player.y += player.vy * dt;

    const groundY = H - 24 - player.h;
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.grounded = true;
      player.jumping = false;
    } else {
      player.grounded = false;
    }

    // obstacles
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      // spawn timer scales with speed (faster game -> more frequent)
      spawnTimer = 1.0 - Math.min(0.6, (speed - 300) / 800);
      spawnTimer = Math.max(0.5, spawnTimer + (Math.random() * 0.5 - 0.25));
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed * dt;
      // collision
      if (checkCollision(player, ob)) {
        running = false;
        gameOver = true;
        setState('Game Over — Press R to restart');
      }

      if (ob.x + ob.w < -50) obstacles.splice(i, 1);
    }

    // clouds movement (parallax)
    for (const c of clouds) {
      c.x -= (speed * 0.15) * dt * (c.speed / 20);
      if (c.x + c.w < -100) {
        c.x = W + Math.random() * 200;
        c.y = 20 + Math.random() * 60;
      }
    }
  }

  function checkCollision(p, ob) {
    // hitbox for player (slight inset for fairness)
    const padX = 4;
    const padY = p.ducking ? 2 : 4;
    const px = p.x + padX;
    const py = p.y + padY;
    const pw = p.w - padX * 2;
    const ph = p.h - padY;

    return !(px + pw < ob.x || px > ob.x + ob.w || py + ph < ob.y || py > ob.y + ob.h);
  }

  function draw() {
    // Clear
    ctx.clearRect(0, 0, W, H);

    // Draw background image or procedural sky
    if (bgImg) {
      // draw scaled to cover (cover behavior)
      const img = bgImg;
      const scale = Math.max(W / img.width, H / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      const ix = (W - iw) / 2;
      const iy = (H - ih) / 2;
      ctx.drawImage(img, ix, iy, iw, ih);
    } else {
      // procedural sky
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#eaf2ff');
      g.addColorStop(1, '#ffffff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // simple clouds
      for (const c of clouds) {
        drawCloud(c.x, c.y, c.w);
      }
    }

    // Ground
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, H - 24, W, 24);
    // ground line
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, H - 26, W, 2);

    // Obstacles
    for (const ob of obstacles) {
      drawObstacle(ob);
    }

    // Player
    drawPlayer();

    // Score display (canvas)
    ctx.fillStyle = '#333';
    ctx.font = '12px system-ui, Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, W - 12, 18);
  }

  function drawCloud(x, y, w) {
    ctx.fillStyle = colors.cloud;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.6, w * 0.3, 0, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.4, y - 6, w * 0.45, w * 0.25, 0, 0, Math.PI * 2);
    ctx.ellipse(x - w * 0.3, y - 6, w * 0.35, w * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawObstacle(ob) {
    ctx.fillStyle = colors.obstacle;
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    // small top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(ob.x, ob.y, ob.w, 4);
  }

  function drawPlayer() {
    const p = player;
    // If an uploaded player image exists, draw it, scaled to player's box
    if (playerImg) {
      const img = playerImg;
      // keep aspect ratio to fit into player's box
      const scale = Math.min(p.w / img.width, p.h / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      const ix = p.x - (iw - p.w) / 2;
      const iy = p.y + (p.h - ih);
      ctx.drawImage(img, ix, iy, iw, ih);
      return;
    }

    // Procedural skater: simple body + skateboard
    ctx.save();

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, H - 12, p.w * 0.75, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // board
    ctx.fillStyle = '#222';
    ctx.fillRect(p.x - 6, p.y + p.h - 8, p.w + 12, 6);
    ctx.fillStyle = '#666';
    ctx.fillRect(p.x - 3, p.y + p.h - 6, p.w + 6, 3);

    // body (simple rounded rect)
    ctx.fillStyle = colors.player;
    roundRect(ctx, p.x, p.y, p.w, p.h - 10, 6);
    ctx.fill();

    // head
    ctx.fillStyle = '#ffddc1';
    ctx.beginPath();
    ctx.arc(p.x + 8, p.y - 4, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Main loop
  function loop(ts) {
    const now = ts;
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0); // clamp dt
    lastTime = now;

    // Update logical W/H in case CSS resized it
    const rect = canvas.getBoundingClientRect();
    W = canvas.width = Math.floor(rect.width * (window.devicePixelRatio || 1));
    H = canvas.height = Math.floor((rect.height || canvas.height) * (window.devicePixelRatio || 1)) || canvas.height;
    // Keep internal coordinates because some browsers change CSS size only; we recalc to keep crispness
    // For simplicity, treat coordinates scaled to canvas resolution but we rely on values initialized earlier.
    // To avoid complexity of DPI scaling, we'll set style width and keep drawing in css pixels approximation.

    // Update & draw
    update(dt);
    draw();

    requestAnimationFrame(loop);
  }

  // Collision test helper example usage uses player's numeric px positions consistent with canvas.

  // Initialize numeric player starting y relative to H after first layout
  function setInitialPlayerPosition() {
    // choose CSS pixel height - approximate initial ground positions
    const rect = canvas.getBoundingClientRect();
    const cssH = rect.height || canvas.height;
    // set player starting dimensions in CSS pixels
    player.y = cssH - 24 - player.h;
  }

  // Wait for first paint to compute canvas DOM size and start init
  function startInit() {
    setInitialPlayerPosition();
    init();
  }

  // Start
  startInit();
})();
