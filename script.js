// ==========================
// Configuración del ranking
// ==========================
const CLOUD_ENDPOINT = "";

// ==========================
// Estado del juego
// ==========================
const state = {
  player: "",
  category: "mixtas",
  time: 30,
  score: 0,
  current: null,
  pool: [],
  askedIds: new Set(),
  timerId: null,
  questionsAskedCount: 0,
  maxQuestions: 20
};

const globalUsedIds = new Set();

// Utilidades
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

// Cargar preguntas JSON
let QUESTIONS = {};
async function loadQuestions() {
  const res = await fetch("questions.json");
  QUESTIONS = await res.json();
}

// Elementos
const startScreen = $("#startScreen");
const gameScreen = $("#gameScreen");
const endScreen = $("#endScreen");
const btnStart = $("#btnStart");
const playerNameIn = $("#playerName");
const categorySel = $("#category");
const hudName = $("#hudName");
const hudCat = $("#hudCat");
const hudTime = $("#hudTime");
const hudScore = $("#hudScore");
const qText = $("#questionText");
const optionsBox = $("#options");
const btnPlayAgain = $("#btnPlayAgain");
const btnSubmitScore = $("#btnSubmitScore");
const bgm = $("#bgm");

const btnLeaderboard = $("#btnLeaderboard");
const leaderboardModal = $("#leaderboardModal");
const closeModal = $("#closeModal");
const leaderboardTbody = $("#leaderboardTable tbody");

// Iniciar
window.addEventListener("DOMContentLoaded", async () => {
  await loadQuestions();
  document.body.addEventListener(
    "click",
    () => {
      if (bgm && bgm.src && bgm.paused) {
        bgm.play().catch(() => {});
      }
    },
    { once: true }
  );
});

btnStart.addEventListener("click", startGame);
btnPlayAgain.addEventListener("click", resetAndStart);
btnSubmitScore.addEventListener("click", submitScore);

btnLeaderboard.addEventListener("click", async () => {
  leaderboardModal.classList.remove("hidden");
  await renderLeaderboard();
});
closeModal.addEventListener("click", () =>
  leaderboardModal.classList.add("hidden")
);

// ==========================
// Lógica del juego
// ==========================
function startGame() {
  const name = playerNameIn.value.trim();
  if (!name) {
    alert("Escribe tu nombre para jugar");
    return;
  }
  state.player = name;
  state.category = categorySel.value;
  state.score = 0;
  state.askedIds.clear();
  state.questionsAskedCount = 0;
  hudScore.textContent = "0";
  hudName.textContent = state.player;
  hudCat.textContent = prettyCat(state.category);
  buildPool();
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  endScreen.classList.add("hidden");
  startTimer(30);
  nextQuestion();
}

function resetAndStart() {
  startGame();
}

function prettyCat(cat) {
  const map = {
    matematica: "Matemática",
    comunicacion: "Comunicación",
    sociales: "Ciencias Sociales",
    ciencia: "Ciencia y Tecnología",
    civica: "Formación Ciudadana y Cívica",
    arte: "Arte y Cultura",
    mixtas: "Mixtas",
  };
  return map[cat] || cat;
}

function buildPool() {
  let pool = [];
  if (state.category === "mixtas") {
    for (const key of [
      "matematica",
      "comunicacion",
      "sociales",
      "ciencia",
      "civica",
      "arte",
    ]) {
      const filtered = (QUESTIONS[key] || []).filter(
        (q) => !globalUsedIds.has(q.id)
      );
      pool = pool.concat(filtered);
    }
  } else {
    pool = (QUESTIONS[state.category] || []).filter(
      (q) => !globalUsedIds.has(q.id)
    );
  }
  shuffle(pool);
  state.pool = pool;

  if (state.pool.length < state.maxQuestions) {
    alert(
      "Quedan menos preguntas disponibles que la cantidad máxima. El juego puede terminar antes."
    );
  }
}

function startTimer(seconds) {
  clearInterval(state.timerId);
  state.time = seconds;
  hudTime.textContent = state.time;
  state.timerId = setInterval(() => {
    state.time--;
    hudTime.textContent = state.time;
    if (state.time <= 0) {
      clearInterval(state.timerId);
      endRound();
    }
  }, 1000);
}

function endRound() {
  clearInterval(state.timerId);
  gameScreen.classList.add("hidden");
  endScreen.classList.remove("hidden");
  $("#finalScore").textContent = `Puntaje: ${state.score}`;
}

function nextQuestion() {
  if (
    state.questionsAskedCount >= state.maxQuestions ||
    state.pool.length === 0
  ) {
    endRound();
    return;
  }

  let next = null;
  while (state.pool.length && !next) {
    const cand = state.pool.pop();
    if (!state.askedIds.has(cand.id) && !globalUsedIds.has(cand.id)) {
      next = cand;
    }
  }

  if (!next) {
    endRound();
    return;
  }

  state.current = next;
  state.askedIds.add(next.id);
  globalUsedIds.add(next.id);

  state.questionsAskedCount++;
  renderQuestion(next);
}

function renderQuestion(q) {
  qText.textContent = q.text;
  optionsBox.innerHTML = "";
  const choices = q.options.map((opt, idx) => ({ opt, idx }));
  shuffle(choices);
  choices.forEach(({ opt, idx }) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = opt;
    btn.addEventListener("click", () => onAnswer(idx === q.answer));
    optionsBox.appendChild(btn);
  });
}

function onAnswer(correct) {
  if (correct) state.score += 10;
  hudScore.textContent = state.score;
  nextQuestion();
}

// ==========================
// Ranking
// ==========================
async function submitScore() {
  const record = {
    name: state.player,
    score: state.score,
    category: state.category,
    ts: Date.now(),
  };
  try {
    if (CLOUD_ENDPOINT) {
      await fetch(CLOUD_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(record),
      });
    } else {
      const data = JSON.parse(localStorage.getItem("mentexp_ranking") || "[]");
      data.push(record);
      localStorage.setItem("mentexp_ranking", JSON.stringify(data));
    }
    alert("¡Puntaje guardado!");
    await renderLeaderboard();
  } catch (e) {
    console.error(e);
    alert("No se pudo guardar el puntaje.");
  }
}

async function renderLeaderboard() {
  let rows = [];
  if (CLOUD_ENDPOINT) {
    try {
      const res = await fetch(CLOUD_ENDPOINT + "?list=1", { cache: "no-cache" });
      rows = await res.json();
    } catch (e) {
      console.error(e);
      rows = [];
    }
  } else {
    rows = JSON.parse(localStorage.getItem("mentexp_ranking") || "[]");
  }
  rows.sort((a, b) => b.score - a.score || a.ts - b.ts);
  leaderboardTbody.innerHTML = "";
  rows.slice(0, 20).forEach((r, i) => {
    const tr = document.createElement("tr");
    const date = new Date(r.ts || Date.now());
    tr.innerHTML = `<td>${i + 1}</td><td>${escapeHTML(
      r.name
    )}</td><td>${r.score}</td><td>${date.toLocaleString()}</td>`;
    leaderboardTbody.appendChild(tr);
  });
}


