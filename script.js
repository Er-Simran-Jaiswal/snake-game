
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const message = document.getElementById("message");
const hint = document.getElementById("hint");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const cells = 20;
const cellSize = canvas.width / cells;

let snake;
let food;
let direction;
let nextDirection;
let score;
let timer = null;
let running = false;
let gameOver = false;
let paused = false;

let best = 0;

try {
  best = Number(localStorage.getItem("neonSnakeBest")) || 0;
} catch (error) {
  best = 0;
}

bestEl.textContent = best;

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];

  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;

  scoreEl.textContent = score;
  gameOver = false;
  paused = false;
  running = false;

  placeFood();
  draw();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * cells),
      y: Math.floor(Math.random() * cells)
    };
  } while (
    snake.some(part => part.x === food.x && part.y === food.y)
  );
}

function draw() {
  ctx.fillStyle = "#0d1719";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the grid.
  ctx.strokeStyle = "#172a28";
  ctx.lineWidth = 1;

  for (let i = 0; i <= cells; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.stroke();
  }

  // Draw the food.
  ctx.fillStyle = "#ff6584";
  ctx.shadowColor = "#ff6584";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(
    (food.x + 0.5) * cellSize,
    (food.y + 0.5) * cellSize,
    cellSize * 0.34,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw the snake.
  snake.forEach((part, index) => {
    const inset = 1.5;

    ctx.fillStyle = index === 0 ? "#b0ffbf" : "#4be77a";
    ctx.shadowColor = index === 0 ? "#b0ffbf" : "#4be77a";
    ctx.shadowBlur = index === 0 ? 10 : 3;

    ctx.beginPath();
    ctx.roundRect(
      part.x * cellSize + inset,
      part.y * cellSize + inset,
      cellSize - inset * 2,
      cellSize - inset * 2,
      4
    );
    ctx.fill();
  });

  ctx.shadowBlur = 0;
}

function startGame() {
  if (running) return;

  if (gameOver) {
    resetGame();
  }

  running = true;
  paused = false;
  overlay.classList.add("hidden");

  clearInterval(timer);
  timer = setInterval(tick, 115);
}

function tick() {
  if (!running || paused || gameOver) return;

  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  const eating = head.x === food.x && head.y === food.y;

  const body = eating ? snake : snake.slice(0, -1);

  const hitWall =
    head.x < 0 || head.x >= cells ||
    head.y < 0 || head.y >= cells;

  const hitSelf = body.some(
    part => part.x === head.x && part.y === head.y
  );

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (eating) {
    score += 10;
    scoreEl.textContent = score;

    if (score > best) {
      best = score;
      bestEl.textContent = best;

      try {
        localStorage.setItem("neonSnakeBest", best);
      } catch (error) {
        // The game still works if storage is unavailable.
      }
    }

    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function endGame() {
  running = false;
  gameOver = true;
  clearInterval(timer);

  message.textContent = "GAME OVER";
  hint.textContent = `Your score: ${score}`;
  startBtn.textContent = "PLAY AGAIN";
  overlay.classList.remove("hidden");
}

function togglePause() {
  if (gameOver) return;

  if (!running) {
    startGame();
    return;
  }

  paused = !paused;

  if (paused) {
    message.textContent = "PAUSED";
    hint.textContent = "Take a little break.";
    startBtn.textContent = "RESUME";
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function changeDirection(key) {
  const directions = {
    ArrowUp:    { x: 0, y: -1 },
    w:          { x: 0, y: -1 },
    ArrowDown:  { x: 0, y: 1 },
    s:          { x: 0, y: 1 },
    ArrowLeft:  { x: -1, y: 0 },
    a:          { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    d:          { x: 1, y: 0 }
  };

  const newDirection = directions[key];

  if (!newDirection) return;

  // Prevent reversing straight into yourself.
  if (
    newDirection.x === -direction.x &&
    newDirection.y === -direction.y
  ) {
    return;
  }

  nextDirection = newDirection;

  if (!running && !gameOver) {
    startGame();
  }
}

document.addEventListener("keydown", event => {
  if ([
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "
  ].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === " ") {
    togglePause();
    return;
  }

  changeDirection(event.key);
});

startBtn.addEventListener("click", () => {
  if (paused) {
    togglePause();
  } else {
    startGame();
  }
});

restartBtn.addEventListener("click", () => {
  clearInterval(timer);
  resetGame();

  message.textContent = "READY?";
  hint.textContent = "Press Start to play";
  startBtn.textContent = "START GAME";
  overlay.classList.remove("hidden");
});

resetGame();
