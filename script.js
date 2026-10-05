/* ============================================================
   ДАННЫЕ
   ============================================================ */
const SHOP_ITEMS = [
  { id: 'janitor',   name: 'Дворник',        price: 75,  desc: 'Роль начального уровня',    rarity: 'common',    icon: '🧹' },
  { id: 'hairdress', name: 'Парикмахер',     price: 150, desc: 'Для стильных ребят',         rarity: 'uncommon',  icon: '💈' },
  { id: 'trucker',   name: 'Дальнобойщик',   price: 250, desc: 'Король дорог',               rarity: 'rare',      icon: '🚛' },
  { id: 'business',  name: 'Бизнесмен',      price: 375, desc: 'Серьёзный уровень',          rarity: 'epic',      icon: '💼' },
  { id: 'crypto',    name: 'Криптоинвестор', price: 500, desc: 'Топовая роль сервера',       rarity: 'legendary', icon: '₿'  }
];

const RARITY_NAMES = {
  common:    'Обычная',
  uncommon:  'Необычная',
  rare:      'Редкая',
  epic:      'Эпическая',
  legendary: 'Легендарная'
};

const MULTIPLIERS = [
  { mult: 1.2, chance: 83.33 },
  { mult: 1.5, chance: 66.67 },
  { mult: 2,   chance: 50    },
  { mult: 3,   chance: 33.33 },
  { mult: 5,   chance: 20    },
  { mult: 10,  chance: 10    }
];

/* ============================================================
   СОСТОЯНИЕ
   ============================================================ */
const state = {
  artifacts: parseFloat(localStorage.getItem('uc_artifacts') || '0'),
  owned:     JSON.parse(localStorage.getItem('uc_owned')     || '[]'),
  best:      parseInt(localStorage.getItem('uc_best')        || '0')
};

function saveState() {
  localStorage.setItem('uc_artifacts', state.artifacts);
  localStorage.setItem('uc_owned',     JSON.stringify(state.owned));
  localStorage.setItem('uc_best',      state.best);
}

/* ============================================================
   UI
   ============================================================ */
function updateBalance() {
  document.getElementById('artifactCount').textContent = Math.floor(state.artifacts * 10) / 10;
  updateProgressBar();
}

function updateProgressBar() {
  const next = SHOP_ITEMS.find(item => !state.owned.includes(item.id));
  const labelEl = document.getElementById('progressLabel');
  const valueEl = document.getElementById('progressValue');
  const fillEl  = document.getElementById('progressFill');

  if (!next) {
    labelEl.innerHTML = 'Все роли куплены 🏆';
    valueEl.textContent = 'MAX';
    fillEl.style.width = '100%';
    fillEl.classList.add('max');
    return;
  }

  const percent = Math.min(100, (state.artifacts / next.price) * 100);
  labelEl.innerHTML = `Следующая роль: <b>${next.name}</b>`;
  valueEl.textContent = `${Math.floor(state.artifacts)} / ${next.price} ◆`;
  fillEl.style.width = percent + '%';
  fillEl.classList.toggle('max', percent >= 100);
}

let toastTimer;
function showToast(text, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast ' + type; }, 2500);
}

function showCelebration(roleName) {
  const el = document.getElementById('celebration');
  document.getElementById('celebrationName').textContent = roleName;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

/* ============================================================
   ТАБЫ
   ============================================================ */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

/* ============================================================
   КУРСОР — белая точка
   ============================================================ */
const cursorDot = document.createElement('div');
cursorDot.id = 'cursorDot';
document.body.appendChild(cursorDot);

document.addEventListener('mousemove', (e) => {
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top = e.clientY + 'px';
  cursorDot.style.opacity = 1;
});

document.addEventListener('mouseleave', () => {
  cursorDot.style.opacity = 0;
});

document.addEventListener('mousedown', () => {
  cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
});

document.addEventListener('mouseup', () => {
  cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
});

/* ============================================================
   МАГАЗИН
   ============================================================ */
function renderShop() {
  const list = document.getElementById('shopList');
  list.innerHTML = '';

  SHOP_ITEMS.forEach(item => {
    const owned = state.owned.includes(item.id);
    const canBuy = state.artifacts >= item.price && !owned;

    const div = document.createElement('div');
    div.className = 'shop-item' + (owned ? ' owned' : '') + (canBuy ? ' can-afford' : '');
    div.innerHTML = `
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-price">${item.price} артефактов</div>
        <div class="item-desc">${item.desc}</div>
      </div>
      <button class="buy-btn ${owned ? 'owned' : canBuy ? 'available' : ''}"
              data-id="${item.id}"
              ${owned || !canBuy ? 'disabled' : ''}>
        ${owned ? 'Куплено' : canBuy ? 'Купить →' : 'Не хватает'}
      </button>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => buyItem(btn.dataset.id));
  });
}

function buyItem(id) {
  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item || state.owned.includes(id)) return;
  if (state.artifacts < item.price) { showToast('Недостаточно артефактов', 'error'); return; }

  state.artifacts -= item.price;
  state.owned.push(id);
  saveState();
  updateBalance();
  renderShop();
  renderInventory();
  showCelebration(item.name);
  showToast('Куплено: ' + item.name, 'success');
}

/* ============================================================
   ИНВЕНТАРЬ
   ============================================================ */
function renderInventory() {
  const list = document.getElementById('inventoryList');
  list.innerHTML = '';

  if (state.owned.length === 0) {
    list.innerHTML = `
      <div class="inv-empty-state">
        <div class="icon">📦</div>
        <div class="title">Коллекция пуста</div>
        <div class="sub">Играй и покупай роли, чтобы они появились здесь</div>
      </div>
    `;
    return;
  }

  state.owned.forEach(id => {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;

    const div = document.createElement('div');
    div.className = `inv-card rarity-${item.rarity}`;
    div.innerHTML = `
      <div class="inv-badge">${item.icon}</div>
      <div class="inv-name">${item.name}</div>
      <div class="inv-rarity">${RARITY_NAMES[item.rarity]}</div>
    `;
    list.appendChild(div);
  });
}

/* ============================================================
   ФОН: дождь + молнии
   ============================================================ */
const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');
const stormFlash = document.getElementById('stormFlash');

let raindrops = [];
let lightningTimer = 200;

function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
resizeBg();
window.addEventListener('resize', resizeBg);

function initRain() {
  raindrops = [];
  const count = Math.floor(bgCanvas.width / 6);
  for (let i = 0; i < count; i++) {
    raindrops.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      len: 10 + Math.random() * 15,
      speed: 6 + Math.random() * 8,
      opacity: 0.15 + Math.random() * 0.35
    });
  }
}
initRain();
window.addEventListener('resize', initRain);

function drawRain() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgCtx.strokeStyle = '#ffffff';
  bgCtx.lineWidth = 1;
  bgCtx.lineCap = 'round';

  raindrops.forEach(drop => {
    bgCtx.globalAlpha = drop.opacity;
    bgCtx.beginPath();
    bgCtx.moveTo(drop.x, drop.y);
    bgCtx.lineTo(drop.x - 2, drop.y + drop.len);
    bgCtx.stroke();
    drop.y += drop.speed;
    drop.x -= 0.5;
    if (drop.y > bgCanvas.height) { drop.y = -drop.len; drop.x = Math.random() * bgCanvas.width; }
    if (drop.x < 0) drop.x = bgCanvas.width;
  });
  bgCtx.globalAlpha = 1;

  lightningTimer--;
  if (lightningTimer <= 0) {
    lightningTimer = 200 + Math.floor(Math.random() * 400);
    triggerLightning();
  }
  requestAnimationFrame(drawRain);
}

function triggerLightning() {
  stormFlash.classList.add('flash');
  setTimeout(() => stormFlash.classList.remove('flash'), 80);
  setTimeout(() => {
    stormFlash.classList.add('flash');
    setTimeout(() => stormFlash.classList.remove('flash'), 120);
  }, 200);
  drawBolt();
}

function drawBolt() {
  const startX = Math.random() * bgCanvas.width;
  const startY = 0;
  const endY = bgCanvas.height * (0.3 + Math.random() * 0.3);

  bgCtx.save();
  bgCtx.globalAlpha = 0.7;
  bgCtx.strokeStyle = '#ffffff';
  bgCtx.lineWidth = 2;
  bgCtx.shadowBlur = 30;
  bgCtx.shadowColor = '#ffffff';
  bgCtx.beginPath();
  bgCtx.moveTo(startX, startY);
  let x = startX, y = startY;
  while (y < endY) {
    x += (Math.random() - 0.5) * 40;
    y += 15 + Math.random() * 25;
    bgCtx.lineTo(x, y);
  }
  bgCtx.stroke();
  bgCtx.restore();
}
drawRain();

/* ============================================================
   ЗМЕЙКА
   ============================================================ */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CELL = 20;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;

let snake, dir, nextDir, food, score, gameLoop, isRunning, isPaused;
let applesEaten = 0;

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const rewardEl = document.getElementById('reward');

bestEl.textContent = state.best;

function initGame() {
  snake = [{ x: 10, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  applesEaten = 0;
  isPaused = false;
  spawnFood();
  updateGameUI();
  draw();
}

function spawnFood() {
  let nf;
  do { nf = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
  while (snake.some(s => s.x === nf.x && s.y === nf.y));
  food = nf;
}

function draw() {
  ctx.fillStyle = '#2a2a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= COLS; i++) { ctx.beginPath(); ctx.moveTo(i*CELL, 0); ctx.lineTo(i*CELL, canvas.height); ctx.stroke(); }
  for (let i = 0; i <= ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i*CELL); ctx.lineTo(canvas.width, i*CELL); ctx.stroke(); }

  drawGem(food.x * CELL + CELL/2, food.y * CELL + CELL/2, CELL/2 - 3);

  snake.forEach((seg, i) => {
    const x = seg.x * CELL, y = seg.y * CELL;
    if (i === 0) { ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 15; ctx.shadowColor = '#ffffff'; }
    else {
      const t = i / snake.length;
      ctx.fillStyle = `hsl(0, 0%, ${85 - t * 35}%)`;
      ctx.shadowBlur = 8; ctx.shadowColor = '#aaa';
    }
    roundRect(ctx, x + 2, y + 2, CELL - 4, CELL - 4, 4);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}

function drawGem(cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowBlur = 20; ctx.shadowColor = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -size); ctx.lineTo(size, 0); ctx.lineTo(0, size); ctx.lineTo(-size, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a2a2e';
  ctx.beginPath();
  ctx.moveTo(0, -size/2.5); ctx.lineTo(size/2.5, 0); ctx.lineTo(0, size/2.5); ctx.lineTo(-size/2.5, 0);
  ctx.closePath(); ctx.fill();
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

function step() {
  if (isPaused) return;
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return endGame();
  if (snake.some((s, i) => i !== snake.length - 1 && s.x === head.x && s.y === head.y)) return endGame();
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10; applesEaten++; spawnFood(); updateGameUI();
  } else snake.pop();
  draw();
}

function updateGameUI() {
  scoreEl.textContent = score;
  const est = applesEaten === 0 ? 0 : 2 + Math.floor(applesEaten / 5);
  rewardEl.textContent = Math.min(est, 10);
}

function startGame() {
  if (isRunning) return;
  initGame();
  isRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  pauseBtn.textContent = 'Пауза';
  clearInterval(gameLoop);
  gameLoop = setInterval(step, 110);
}

function togglePause() {
  if (!isRunning) return;
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Продолжить' : 'Пауза';
}

function endGame() {
  clearInterval(gameLoop);
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  if (score > state.best) { state.best = score; bestEl.textContent = score; }
  let reward = 0;
  if (applesEaten > 0) reward = Math.min(2 + Math.floor(applesEaten / 5), 10);
  if (reward > 0) {
    state.artifacts += reward;
    saveState(); updateBalance(); renderShop();
    showToast('+' + reward + ' артефактов. Счёт: ' + score, 'success');
  } else showToast('Игра окончена. Счёт: ' + score);
  ctx.fillStyle = 'rgba(255, 60, 60, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setTimeout(draw, 200);
}

const KEY_MAP = {
  'ArrowUp': { x: 0, y: -1 }, 'ArrowDown': { x: 0, y: 1 },
  'ArrowLeft': { x: -1, y: 0 }, 'ArrowRight': { x: 1, y: 0 },
  'w': { x: 0, y: -1 }, 'W': { x: 0, y: -1 },
  's': { x: 0, y: 1 }, 'S': { x: 0, y: 1 },
  'a': { x: -1, y: 0 }, 'A': { x: -1, y: 0 },
  'd': { x: 1, y: 0 }, 'D': { x: 1, y: 0 },
  'ц': { x: 0, y: -1 }, 'Ц': { x: 0, y: -1 },
  'ы': { x: 0, y: 1 }, 'Ы': { x: 0, y: 1 },
  'ф': { x: -1, y: 0 }, 'Ф': { x: -1, y: 0 },
  'в': { x: 1, y: 0 }, 'В': { x: 1, y: 0 }
};

document.addEventListener('keydown', (e) => {
  const nd = KEY_MAP[e.key];
  if (!nd) return;
  if (nd.x === -dir.x && nd.y === -dir.y) return;
  nextDir = nd;
  e.preventDefault();
});

let touchStart = null;
canvas.addEventListener('touchstart', (e) => { touchStart = e.touches[0]; }, { passive: true });
canvas.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.clientX;
  const dy = e.changedTouches[0].clientY - touchStart.clientY;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  let nd;
  if (Math.abs(dx) > Math.abs(dy)) nd = { x: dx > 0 ? 1 : -1, y: 0 };
  else nd = { x: 0, y: dy > 0 ? 1 : -1 };
  if (nd.x === -dir.x && nd.y === -dir.y) return;
  nextDir = nd;
  touchStart = null;
});

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

/* ============================================================
   BOOT BREAKER
   ============================================================ */
const bootCanvas = document.getElementById('bootCanvas');
const bootCtx = bootCanvas.getContext('2d');
const BB_W = bootCanvas.width;
const BB_H = bootCanvas.height;

const bbGoldEl = document.getElementById('bbGold');
const bbLevelEl = document.getElementById('bbLevel');
const bbRewardEl = document.getElementById('bbReward');
const bootStartBtn = document.getElementById('bootStartBtn');
const bootPauseBtn = document.getElementById('bootPauseBtn');
const bootStopBtn = document.getElementById('bootStopBtn');

let bbRunning = false, bbPaused = false, bbGold = 0, bbLevel = 1;
let bbGoldTarget = 0, bbGoldBroken = 0;

const bbPlatform = { x: BB_W/2, y: BB_H - 40, width: 90, height: 14, speed: 0.4 };
const bbBoot = { active: false, x: 0, y: 0, vx: 0, vy: 0, size: 14, rotation: 0, rotationSpeed: 0 };

let bbBricks = [], bbParticles = [], bbStars = [];
let bbLastFrame = 0, bbLoopHandle = null, bbPreviewLoop = null, bbPreviewLast = 0;
let bbKeyState = { left: false, right: false };

const BB_KEYS = {
  'ArrowLeft': 'left', 'a': 'left', 'A': 'left', 'ф': 'left', 'Ф': 'left',
  'ArrowRight': 'right', 'd': 'right', 'D': 'right', 'в': 'right', 'В': 'right'
};

function bbInitStars() {
  bbStars = [];
  for (let i = 0; i < 60; i++) {
    bbStars.push({
      x: Math.random() * BB_W, y: Math.random() * BB_H,
      size: 0.5 + Math.random() * 1.5,
      speed: 0.005 + Math.random() * 0.02,
      alpha: 0.2 + Math.random() * 0.6,
      twinkle: Math.random() * Math.PI * 2
    });
  }
}
bbInitStars();

function bbGenerateLevel() {
  bbBricks = [];
  bbGoldBroken = 0;
  bbGoldTarget = 0;

  const brickW = 32, brickH = 16, startY = 40;
  const rows = 3 + bbLevel;

  for (let row = 0; row < rows; row++) {
    const y = startY + row * (brickH + 2);
    const widthRatio = 0.5 + row * 0.1;
    const cols = Math.floor((BB_W / brickW) * Math.min(widthRatio, 0.85));
    const startX = (BB_W - cols * brickW) / 2;

    for (let col = 0; col < cols; col++) {
      const isCoin = Math.random() < 0.3;
      if (isCoin) bbGoldTarget++;
      bbBricks.push({
        x: startX + col * brickW, y: y,
        w: brickW - 2, h: brickH - 2,
        hp: isCoin ? 1 : 2, maxHp: isCoin ? 1 : 2,
        isCoin: isCoin, alive: true
      });
    }
  }
}

function bbLaunchBoot() {
  if (bbBoot.active || !bbRunning || bbPaused) return;
  bbBoot.active = true;
  bbBoot.x = bbPlatform.x;
  bbBoot.y = bbPlatform.y - 20;
  bbBoot.vx = (Math.random() - 0.5) * 0.05;
  bbBoot.vy = -1.2;
  bbBoot.rotation = 0;
  bbBoot.rotationSpeed = 0.015;
}

function bbInit() {
  bbRunning = true;
  bbPaused = false;
  bbGold = 0;
  bbLevel = 1;
  bbPlatform.x = BB_W / 2;
  bbBoot.active = false;
  bbBoot.x = bbPlatform.x;
  bbBoot.y = bbPlatform.y - 20;
  bbBoot.vx = 0; bbBoot.vy = 0; bbBoot.rotation = 0; bbBoot.rotationSpeed = 0;
  bbParticles = [];
  bbInitStars();
  bbGenerateLevel();
  bbUpdateUI();

  bootStartBtn.disabled = true;
  bootPauseBtn.disabled = false;
  bootStopBtn.disabled = false;
  bootPauseBtn.textContent = 'Пауза';

  if (bbPreviewLoop) { cancelAnimationFrame(bbPreviewLoop); bbPreviewLoop = null; }

  bbLastFrame = performance.now();
  cancelAnimationFrame(bbLoopHandle);
  bbLoopHandle = requestAnimationFrame(bbLoop);
}

function bbUpdateUI() {
  bbGoldEl.textContent = bbGold;
  bbLevelEl.textContent = bbLevel;
  bbRewardEl.textContent = bbGold;
}

function bbUpdate(dt) {
  bbStars.forEach(s => {
    s.y += s.speed * dt;
    s.twinkle += dt * 0.005;
    if (s.y > BB_H) { s.y = 0; s.x = Math.random() * BB_W; }
  });

  if (bbKeyState.left) bbPlatform.x -= bbPlatform.speed * dt;
  if (bbKeyState.right) bbPlatform.x += bbPlatform.speed * dt;
  bbPlatform.x = Math.max(bbPlatform.width/2, Math.min(BB_W - bbPlatform.width/2, bbPlatform.x));

  if (!bbBoot.active) {
    bbBoot.x = bbPlatform.x;
    bbBoot.y = bbPlatform.y - 20;
  }

  if (bbBoot.active) {
    bbBoot.vy += 0.00018 * dt;
    bbBoot.x += bbBoot.vx * dt;
    bbBoot.y += bbBoot.vy * dt;
    bbBoot.rotation += bbBoot.rotationSpeed * dt;

    const maxFallSpeed = 0.45, maxRiseSpeed = 1.3;
    if (bbBoot.vy > maxFallSpeed) bbBoot.vy = maxFallSpeed;
    if (bbBoot.vy < -maxRiseSpeed) bbBoot.vy = -maxRiseSpeed;
    if (Math.abs(bbBoot.vy) < 0.12 && bbBoot.y < BB_H * 0.5) bbBoot.vy += 0.08;

    if (bbBoot.x < bbBoot.size) { bbBoot.x = bbBoot.size; bbBoot.vx = Math.abs(bbBoot.vx); }
    if (bbBoot.x > BB_W - bbBoot.size) { bbBoot.x = BB_W - bbBoot.size; bbBoot.vx = -Math.abs(bbBoot.vx); }
    if (bbBoot.y < bbBoot.size) { bbBoot.y = bbBoot.size; bbBoot.vy = Math.abs(bbBoot.vy) * 0.9; }

    for (let i = 0; i < bbBricks.length; i++) {
      const b = bbBricks[i];
      if (!b.alive) continue;

      if (bbBoot.x > b.x - 6 && bbBoot.x < b.x + b.w + 6 &&
          bbBoot.y > b.y - 6 && bbBoot.y < b.y + b.h + 6) {

        b.hp--;
        const centerX = b.x + b.w / 2, centerY = b.y + b.h / 2;
        const dx = bbBoot.x - centerX, dy = bbBoot.y - centerY;

        if (Math.abs(dx) > Math.abs(dy)) bbBoot.vx = dx > 0 ? 0.4 : -0.4;
        else bbBoot.vy = dy > 0 ? Math.abs(bbBoot.vy)*0.85 + 0.1 : -Math.abs(bbBoot.vy)*0.85 - 0.1;

        bbBoot.x += bbBoot.vx * 3;
        bbBoot.y += bbBoot.vy * 3;

        if (b.hp <= 0) {
          b.alive = false;
          bbSpawnParticles(b.x + b.w/2, b.y + b.h/2, b.isCoin ? '#ffd166' : '#8a5a25', 10);
          if (b.isCoin) { bbGold++; bbGoldBroken++; bbUpdateUI(); }
        } else bbSpawnParticles(b.x + b.w/2, b.y + b.h/2, '#8a5a25', 4);
        break;
      }
    }

    const bootBottom = bbBoot.y + bbBoot.size;
    const bootLeft = bbBoot.x - bbBoot.size;
    const bootRight = bbBoot.x + bbBoot.size;
    const platTop = bbPlatform.y;
    const platLeft = bbPlatform.x - bbPlatform.width / 2;
    const platRight = bbPlatform.x + bbPlatform.width / 2;

    if (bbBoot.vy > 0 && bootBottom >= platTop && bootBottom <= platTop + bbPlatform.height + 10 &&
        bootRight > platLeft && bootLeft < platRight) {
      bbBoot.y = platTop - bbBoot.size;
      if (Math.abs(bbBoot.vy) < 0.2) {
        bbBoot.active = false;
        bbSpawnParticles(bbBoot.x, bbBoot.y, '#fff', 10);
      } else {
        bbBoot.vy = -Math.abs(bbBoot.vy) * 0.75;
        if (Math.abs(bbBoot.vy) < 0.4) bbBoot.vy = -0.5;
        bbBoot.vx += (Math.random() - 0.5) * 0.15;
        bbSpawnParticles(bbBoot.x, platTop, '#fff', 6);
      }
    }

    if (bbBoot.y > BB_H + 30) bbBoot.active = false;
  }

  for (let i = bbParticles.length - 1; i >= 0; i--) {
    const p = bbParticles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.0008 * dt;
    p.life -= dt;
    if (p.life <= 0) bbParticles.splice(i, 1);
  }

  const aliveBricks = bbBricks.filter(b => b.alive);
  if (aliveBricks.length === 0 && !bbBoot.active) {
    bbLevel++;
    bbUpdateUI();
    bbGenerateLevel();
    showToast('Уровень ' + bbLevel + '!', 'success');
  }
}

function bbSpawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.05 + Math.random() * 0.25;
    bbParticles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 400 + Math.random() * 400, maxLife: 800, color,
      size: 1.5 + Math.random() * 2.5
    });
  }
}

function bbDraw() {
  const grad = bootCtx.createRadialGradient(BB_W/2, BB_H/2, 50, BB_W/2, BB_H/2, BB_H);
  grad.addColorStop(0, '#141418');
  grad.addColorStop(1, '#050507');
  bootCtx.fillStyle = grad;
  bootCtx.fillRect(0, 0, BB_W, BB_H);

  bbStars.forEach(s => {
    const a = s.alpha * (0.6 + 0.4 * Math.sin(s.twinkle));
    bootCtx.globalAlpha = a;
    bootCtx.fillStyle = '#ffffff';
    bootCtx.beginPath();
    bootCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    bootCtx.fill();
  });
  bootCtx.globalAlpha = 1;

  bootCtx.strokeStyle = 'rgba(255,255,255,0.025)';
  bootCtx.lineWidth = 1;
  for (let x = 0; x <= BB_W; x += 40) { bootCtx.beginPath(); bootCtx.moveTo(x, 0); bootCtx.lineTo(x, BB_H); bootCtx.stroke(); }
  for (let y = 0; y <= BB_H; y += 40) { bootCtx.beginPath(); bootCtx.moveTo(0, y); bootCtx.lineTo(BB_W, y); bootCtx.stroke(); }

  const vg = bootCtx.createRadialGradient(BB_W/2, BB_H/2, BB_H*0.3, BB_W/2, BB_H/2, BB_H*0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.7)');
  bootCtx.fillStyle = vg;
  bootCtx.fillRect(0, 0, BB_W, BB_H);

  bootCtx.fillStyle = '#0a0a0a';
  bootCtx.fillRect(0, 0, 8, BB_H);
  bootCtx.fillRect(BB_W - 8, 0, 8, BB_H);
  bootCtx.fillStyle = 'rgba(255,255,255,0.05)';
  bootCtx.fillRect(8, 0, 2, BB_H);
  bootCtx.fillRect(BB_W - 10, 0, 2, BB_H);

  bbBricks.forEach(b => {
    if (!b.alive) return;
    bootCtx.save();
    if (b.isCoin) {
      bootCtx.fillStyle = b.hp < b.maxHp ? '#e6c04a' : '#ffd166';
      bootCtx.shadowBlur = 12; bootCtx.shadowColor = '#ffd166';
      roundRect(bootCtx, b.x, b.y, b.w, b.h, 3); bootCtx.fill();
      bootCtx.shadowBlur = 0;
      bootCtx.fillStyle = 'rgba(255,255,255,0.6)';
      bootCtx.fillRect(b.x + 3, b.y + 3, b.w - 10, 2);
      bootCtx.fillStyle = '#7a5020';
      bootCtx.font = 'bold 10px sans-serif';
      bootCtx.textAlign = 'center'; bootCtx.textBaseline = 'middle';
      bootCtx.fillText('◆', b.x + b.w/2, b.y + b.h/2 + 1);
    } else {
      bootCtx.fillStyle = b.hp === 1 ? '#3a3a40' : '#4a4a52';
      bootCtx.shadowBlur = 4; bootCtx.shadowColor = '#000';
      roundRect(bootCtx, b.x, b.y, b.w, b.h, 3); bootCtx.fill();
      bootCtx.strokeStyle = 'rgba(255,255,255,0.08)'; bootCtx.lineWidth = 1; bootCtx.stroke();
      bootCtx.strokeStyle = 'rgba(0,0,0,0.5)';
      bootCtx.beginPath();
      bootCtx.moveTo(b.x + b.w/2, b.y);
      bootCtx.lineTo(b.x + b.w/2, b.y + b.h);
      bootCtx.stroke();
      if (b.hp < b.maxHp) {
        bootCtx.strokeStyle = 'rgba(0,0,0,0.8)'; bootCtx.lineWidth = 1.5;
        bootCtx.beginPath();
        bootCtx.moveTo(b.x + 3, b.y + b.h - 2);
        bootCtx.lineTo(b.x + b.w/2, b.y + 2);
        bootCtx.lineTo(b.x + b.w - 3, b.y + b.h - 2);
        bootCtx.stroke();
      }
    }
    bootCtx.restore();
  });

  bbParticles.forEach(p => {
    const alpha = p.life / p.maxLife;
    bootCtx.globalAlpha = alpha;
    bootCtx.fillStyle = p.color;
    bootCtx.beginPath();
    bootCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    bootCtx.fill();
  });
  bootCtx.globalAlpha = 1;

  if (bbBoot.active) {
    bootCtx.save();
    bootCtx.translate(bbBoot.x, bbBoot.y);
    bootCtx.rotate(bbBoot.rotation);
    bootCtx.shadowBlur = 20; bootCtx.shadowColor = '#ffd166';
    bootCtx.fillStyle = '#8a5a25';
    bootCtx.beginPath();
    bootCtx.moveTo(-8, -12); bootCtx.lineTo(8, -12); bootCtx.lineTo(10, 8);
    bootCtx.lineTo(-14, 8); bootCtx.lineTo(-14, 4); bootCtx.lineTo(-8, 4);
    bootCtx.closePath(); bootCtx.fill();
    bootCtx.shadowBlur = 0;
    bootCtx.strokeStyle = '#5a3a15'; bootCtx.lineWidth = 1.5; bootCtx.stroke();
    bootCtx.fillStyle = '#3a2410';
    bootCtx.fillRect(-14, 6, 24, 4);
    bootCtx.fillStyle = 'rgba(255,255,255,0.4)';
    bootCtx.fillRect(-6, -10, 3, 12);
    bootCtx.restore();
  }

  bootCtx.save();
  bootCtx.shadowBlur = 15; bootCtx.shadowColor = '#ffffff';
  bootCtx.fillStyle = '#f0f0f0';
  roundRect(bootCtx, bbPlatform.x - bbPlatform.width/2, bbPlatform.y, bbPlatform.width, bbPlatform.height, 6);
  bootCtx.fill();
  bootCtx.shadowBlur = 0;
  bootCtx.fillStyle = '#0a0a0a';
  for (let i = 0; i < 5; i++) {
    bootCtx.fillRect(bbPlatform.x - bbPlatform.width/2 + 8 + i * 16, bbPlatform.y + 3, 8, 4);
  }
  bootCtx.strokeStyle = 'rgba(255,255,255,0.8)';
  bootCtx.lineWidth = 1;
  roundRect(bootCtx, bbPlatform.x - bbPlatform.width/2, bbPlatform.y, bbPlatform.width, bbPlatform.height, 6);
  bootCtx.stroke();
  bootCtx.restore();
}

function bbLoop(now) {
  if (!bbRunning) return;
  const dt = Math.min(now - bbLastFrame, 32);
  bbLastFrame = now;
  if (!bbPaused) bbUpdate(dt);
  bbDraw();
  bbLoopHandle = requestAnimationFrame(bbLoop);
}

function bbPreviewAnimate(now) {
  if (bbRunning) { bbPreviewLoop = null; return; }
  const dt = Math.min(now - (bbPreviewLast || now), 32);
  bbPreviewLast = now;
  bbStars.forEach(s => {
    s.y += s.speed * dt;
    s.twinkle += dt * 0.005;
    if (s.y > BB_H) { s.y = 0; s.x = Math.random() * BB_W; }
  });
  bbPlatform.x = BB_W / 2 + Math.sin(now * 0.001) * 50;
  bbBoot.x = bbPlatform.x;
  bbBoot.y = bbPlatform.y - 20;
  bbDraw();
  bbPreviewLoop = requestAnimationFrame(bbPreviewAnimate);
}

bbGenerateLevel();
bbPlatform.x = BB_W / 2;
bbPreviewLoop = requestAnimationFrame(bbPreviewAnimate);

document.addEventListener('keydown', (e) => {
  const action = BB_KEYS[e.key];
  if (action) { bbKeyState[action] = true; e.preventDefault(); }
  if (e.key === ' ' || e.key === 'Spacebar') { bbLaunchBoot(); e.preventDefault(); }
});

document.addEventListener('keyup', (e) => {
  const action = BB_KEYS[e.key];
  if (action) { bbKeyState[action] = false; e.preventDefault(); }
});

bootCanvas.addEventListener('click', () => bbLaunchBoot());

let bbTouchX = null;
bootCanvas.addEventListener('touchstart', (e) => { bbTouchX = e.touches[0].clientX; bbLaunchBoot(); }, { passive: true });
bootCanvas.addEventListener('touchmove', (e) => {
  if (bbTouchX === null) return;
  const rect = bootCanvas.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  bbPlatform.x = Math.max(bbPlatform.width/2, Math.min(BB_W - bbPlatform.width/2, x));
}, { passive: true });
bootCanvas.addEventListener('touchend', () => { bbTouchX = null; });

bootStartBtn.addEventListener('click', bbInit);
bootPauseBtn.addEventListener('click', () => {
  if (!bbRunning) return;
  bbPaused = !bbPaused;
  bootPauseBtn.textContent = bbPaused ? 'Продолжить' : 'Пауза';
  if (!bbPaused) bbLastFrame = performance.now();
});

bootStopBtn.addEventListener('click', () => {
  if (!bbRunning) return;
  if (bbGold > 0) {
    state.artifacts += bbGold;
    saveState(); updateBalance(); renderShop();
    showToast('+' + bbGold + ' ◆ за ' + bbGold + ' золотых блоков', 'success');
  } else showToast('Разбей золотые блоки, чтобы получить артефакты', 'error');

  bbRunning = false;
  cancelAnimationFrame(bbLoopHandle);
  bootStartBtn.disabled = false;
  bootPauseBtn.disabled = true;
  bootStopBtn.disabled = true;
  bootPauseBtn.textContent = 'Пауза';

  bbLevel = 1; bbGold = 0;
  bbGenerateLevel();
  bbPlatform.x = BB_W / 2;
  bbPreviewLast = 0;
  if (!bbPreviewLoop) bbPreviewLoop = requestAnimationFrame(bbPreviewAnimate);
});

/* ============================================================
   UPGRADE
   ============================================================ */
const betInput = document.getElementById('betInput');
const wheelTrack = document.getElementById('wheelTrack');
const multipliersEl = document.getElementById('multipliers');
const upgradeInfo = document.getElementById('upgradeInfo');
const upgradeBtn = document.getElementById('upgradeBtn');

let selectedMult = 2;
let isSpinning = false;

function renderMultipliers() {
  multipliersEl.innerHTML = '';
  MULTIPLIERS.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'mult-btn' + (m.mult === selectedMult ? ' active' : '');
    btn.dataset.mult = m.mult;
    btn.innerHTML = `x${m.mult}<span class="chance">${m.chance.toFixed(0)}% шанс</span>`;
    btn.addEventListener('click', () => {
      if (isSpinning) return;
      selectedMult = m.mult;
      renderMultipliers();
      updateUpgradeInfo();
    });
    multipliersEl.appendChild(btn);
  });
}

function updateUpgradeInfo() {
  const bet = parseInt(betInput.value) || 0;
  const target = Math.floor(bet * selectedMult);
  const chance = (100 / selectedMult).toFixed(1);
  upgradeInfo.innerHTML =
    `Ставка: <b>${bet}</b> ◆ → Получишь: <b>${target}</b> ◆ · Шанс: <b>${chance}%</b>`;
  upgradeBtn.disabled = isSpinning || bet < 1 || bet > state.artifacts;
}

document.querySelectorAll('.qbet').forEach(btn => {
  btn.addEventListener('click', () => {
    if (isSpinning) return;
    const val = btn.dataset.bet;
    betInput.value = val === 'all' ? Math.floor(state.artifacts) : val;
    updateUpgradeInfo();
  });
});

betInput.addEventListener('input', updateUpgradeInfo);

upgradeBtn.addEventListener('click', () => {
  if (isSpinning) return;
  const bet = parseInt(betInput.value) || 0;
  if (bet < 1 || bet > state.artifacts) { showToast('Некорректная ставка', 'error'); return; }

  isSpinning = true;
  upgradeBtn.disabled = true;

  state.artifacts -= bet;
  saveState(); updateBalance(); renderShop(); updateUpgradeInfo();

  const winChance = 100 / selectedMult;
  const isWin = Math.random() * 100 < winChance;
  const target = Math.floor(bet * selectedMult);

  const totalItems = 60;
  const winCount = Math.max(1, Math.round(totalItems * winChance / 100));
  const items = [];
  for (let i = 0; i < winCount; i++) items.push(true);
  for (let i = 0; i < totalItems - winCount; i++) items.push(false);

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const winIndex = 52;
  items[winIndex] = isWin;

  wheelTrack.innerHTML = '';
  wheelTrack.style.transition = 'none';
  wheelTrack.style.transform = 'translateX(0)';

  const itemWidth = 100;
  items.forEach((isWinSeg, i) => {
    const div = document.createElement('div');
    div.className = 'wheel-item ' + (isWinSeg ? 'win' : 'lose');
    div.textContent = isWinSeg ? '◆' : '✕';
    div.dataset.index = i;
    wheelTrack.appendChild(div);
  });

  const viewport = document.querySelector('.wheel-viewport');
  const viewportWidth = viewport.offsetWidth;
  const centerOffset = viewportWidth / 2 - itemWidth / 2;
  const jitter = (Math.random() - 0.5) * 30;
  const targetX = -(winIndex * itemWidth) + centerOffset + jitter;

  void wheelTrack.offsetWidth;
  requestAnimationFrame(() => {
    wheelTrack.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)';
    wheelTrack.style.transform = `translateX(${targetX}px)`;
  });

  setTimeout(() => {
    isSpinning = false;
    const targetEl = wheelTrack.querySelector(`[data-index="${winIndex}"]`);
    if (targetEl) targetEl.classList.add(isWin ? 'win-highlight' : 'lose-highlight');

    if (isWin) {
      state.artifacts += target;
      saveState(); updateBalance(); renderShop();
      showToast('ПОБЕДА! +' + target + ' ◆', 'success');
    } else showToast('Проигрыш. -' + bet + ' ◆', 'error');

    updateUpgradeInfo();
    setTimeout(() => {
      if (targetEl) targetEl.classList.remove('win-highlight', 'lose-highlight');
    }, 2000);
  }, 4100);
});

renderMultipliers();
updateUpgradeInfo();

/* ============================================================
   СТАРТ
   ============================================================ */
updateBalance();
renderShop();
renderInventory();
initGame();