/* =========================================================
   Scrambled — интерактивный фан-сайт
   ========================================================= */

const CONFIG = {
  filmUrl: "https://player.vimeo.com/video/298947269",
  colors: ["r", "y", "g", "b", "v", "p"],
};

/* 1. Ссылка на мультфильм */
const watchLink = document.getElementById("watchLink");
if (watchLink) watchLink.href = CONFIG.filmUrl;

/* 2. Мобильное меню */
const burger = document.getElementById("burger");
const nav = document.querySelector(".nav");
if (burger && nav) {
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(a =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    })
  );
}

/* 3. Появление секций */
const io = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      io.unobserve(e.target);
    }
  }),
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* 4. Частицы */
const particlesBox = document.getElementById("particles");
if (particlesBox) {
  const count = 26;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.bottom = "-10px";
    p.style.animationDuration = 8 + Math.random() * 12 + "s";
    p.style.animationDelay = Math.random() * 8 + "s";
    const size = 2 + Math.random() * 4;
    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.opacity = 0.3 + Math.random() * 0.5;
    particlesBox.appendChild(p);
  }
}

/* 5. Звук клика */
let audioCtx = null;
function clickSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.13);
  } catch (e) {}
}

/* 6. Игра */
const boardEl = document.getElementById("board");
const movesEl = document.getElementById("moves");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const btnScramble = document.getElementById("btnScramble");
const btnSolve = document.getElementById("btnSolve");
const btnReset = document.getElementById("btnReset");

const SIZE = 3;
let grid = [];
let moves = 0;
let startTime = null;
let timerId = null;
let locked = false;

function buildSolved() {
  const shuffled = [...CONFIG.colors].sort(() => Math.random() - 0.5).slice(0, 3);
  grid = [];
  for (let r = 0; r < SIZE; r++) {
    grid.push([shuffled[r], shuffled[r], shuffled[r]]);
  }
}

function render() {
  boardEl.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell " + grid[r][c];
      cell.setAttribute("aria-label", `Ячейка ${r + 1}-${c + 1}`);
      cell.addEventListener("click", () => onCellClick(r, c));
      boardEl.appendChild(cell);
    }
  }
}

function onCellClick(r, c) {
  if (locked) return;
  if ((r + c) % 2 === 0) shiftRow(r, 1);
  else shiftCol(c, 1);
  clickSound();
  moves++;
  updateStats();
  checkWin();
}

function shiftRow(r, dir = 1) {
  const row = grid[r];
  if (dir > 0) row.unshift(row.pop());
  else row.push(row.shift());
  render();
}

function shiftCol(c, dir = 1) {
  const col = [grid[0][c], grid[1][c], grid[2][c]];
  if (dir > 0) col.unshift(col.pop());
  else col.push(col.shift());
  for (let r = 0; r < SIZE; r++) grid[r][c] = col[r];
  render();
}

function isSolved() {
  for (let r = 0; r < SIZE; r++) {
    if (grid[r][0] !== grid[r][1] || grid[r][1] !== grid[r][2]) return false;
  }
  return true;
}

function checkWin() {
  if (isSolved()) {
    locked = true;
    stopTimer();
    statusEl.textContent = "Собрано! 🎉";
    statusEl.style.color = "var(--green)";
    boardEl.querySelectorAll(".cell").forEach(c => {
      c.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 450, iterations: 2 });
    });
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      [523, 659, 784].forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, audioCtx.currentTime + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + i * 0.12 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + i * 0.12 + 0.25);
        o.connect(g).connect(audioCtx.destination);
        o.start(audioCtx.currentTime + i * 0.12);
        o.stop(audioCtx.currentTime + i * 0.12 + 0.3);
      });
    } catch (e) {}
  }
}

function scramble() {
  resetGame(true);
  let guard = 0;
  do {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (Math.random() > 0.5) shiftRow(r, Math.random() > 0.5 ? 1 : -1);
    else shiftCol(c, Math.random() > 0.5 ? 1 : -1);
    guard++;
  } while (isSolved() && guard < 60);
  moves = 0;
  updateStats();
  statusEl.textContent = "Твой ход";
  statusEl.style.color = "";
  startTimer();
  locked = false;
}

function solve() {
  if (locked) return;
  buildSolved();
  render();
  locked = true;
  stopTimer();
  statusEl.textContent = "Собрано автосборкой";
  statusEl.style.color = "var(--yellow)";
  moves++;
  updateStats();
}

function resetGame(silent = false) {
  buildSolved();
  for (let i = 0; i < 8; i++) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (Math.random() > 0.5) shiftRow(r, 1);
    else shiftCol(c, 1);
  }
  render();
  moves = 0;
  locked = false;
  updateStats();
  stopTimer();
  timerEl.textContent = "00:00";
  if (!silent) {
    statusEl.textContent = "Готов?";
    statusEl.style.color = "";
  }
}

function startTimer() {
  stopTimer();
  startTime = Date.now();
  timerId = setInterval(() => {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(diff / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
}
function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}
function updateStats() {
  movesEl.textContent = moves;
}

btnScramble.addEventListener("click", scramble);
btnSolve.addEventListener("click", solve);
btnReset.addEventListener("click", () => resetGame(false));

/* init */
buildSolved();
resetGame(true);
statusEl.textContent = "Готов?";
