'use strict'

const columns = 18;
const rows = 10;

const brickWidth = 30;
const brickHeight = 15;

const speed1 = 150; // pixels per second
const speed2 = 210;
const speed3 = 270;
const speed4 = 360;

const GameState = { "LAUNCHING": 0, "RUNNING": 1, "LEVEL_UP": 2, "BALL_LOST": 3, "GAME_OVER": 4 };

let context;
let width = 0;
let height = 0;
let inputCenterX = 0;

let bat;
let ball;
let score;
let lives;
let gameSpeed;
let level;
let bricks = [];
let gameTime = new GameTime();
let state = GameState.LAUNCHING;

window.onload = function () {
    context = setupCanvasContext();

    document.addEventListener("touchmove", touchMove);
    document.addEventListener("touchend", touchEnd);
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);

    startNewGame();

    window.requestAnimationFrame(mainLoop);
}

function setupCanvasContext() {
    let canvas = document.getElementById("game-canvas");

    width = canvas.width;
    height = canvas.height;

    let dpr = 1 / (window.devicePixelRatio || 1);
    canvas.width = canvas.width * dpr;
    canvas.height = canvas.height * dpr;

    // Scale drawing context to match dpr
    let context = canvas.getContext('2d');
    context.scale(dpr, dpr);

    return context;
}

function mainLoop() {
    gameTime.update();

    processGameLogic();
    render();

    window.requestAnimationFrame(mainLoop);
}

function processGameLogic() {
    if (state === GameState.LAUNCHING || state === GameState.RUNNING) {
        moveBat();
        moveBall();
    }

    if (state === GameState.RUNNING) {
        checkBallToWallCollision();
        checkBallToBatCollision();
        checkBallToBrickCollision();

        handleSpeedUp();
        handleBatSize();
        handleBallLost();
        handleLevelUp();
        handleGameOver();
    }
}

function render() {
    drawBackground();
    drawBricks();
    drawBat();
    drawBall();

    drawGameStats();

    switch (state) {
        case GameState.LEVEL_UP:
            drawLevelUp();
            break;

        case GameState.BALL_LOST:
            drawBallLost();
            break;

        case GameState.GAME_OVER:
            drawGameOver();
            break;
    }
}

function moveBat() {
    bat.x = clamp(inputCenterX - bat.width / 2, 0, width - bat.width)
}

function moveBall() {
    if (state !== GameState.RUNNING) {
        // Follow bat
        ball.x = bat.x + bat.width / 2;
        ball.y = bat.y - ball.radius;
        return;
    }

    ball.move(gameSpeed * gameTime.deltaTimeFactor);
}

function checkBallToWallCollision() {
    if (ball.x < ball.radius || ball.x > width - ball.radius) {
        ball.invertX();
        ball.x = clamp(ball.x, ball.radius, width - ball.radius);
    }

    if (ball.y < ball.radius) {
        ball.invertY();
        ball.y = ball.radius;
        ball.topWallHasBeenHit = true;
    }
    else if (ball.y > height - ball.radius) {
        ball.isLost = true;
    }
}

function checkBallToBatCollision() {
    if (ball.y + ball.radius <= bat.y) {
        return;
    }

    if (ball.x < bat.x || ball.x > bat.x + bat.width) {
        return;
    }

    ball.invertY();
    ball.y = bat.y - ball.radius;

    // let point of impact affect bounce direction
    let impactRotation = ((ball.x - bat.x) / bat.width - 0.5) * 4;

    // clamp to some min/max angles to avoid very shallow angles
    let newHeading = clamp(ball.heading + impactRotation, -Math.PI * 0.80, -Math.PI * 0.20);
    ball.setHeading(newHeading);
}

function checkBallToBrickCollision() {
    // Check brick at ball pos, then above/below/left/right
    let bricksToCheck = [];
    let c = getCellFromXY(ball);
    bricksToCheck.push(getBrickAtColRow(bricks, c.x, c.y - 1));
    bricksToCheck.push(getBrickAtColRow(bricks, c.x, c.y + 1));
    bricksToCheck.push(getBrickAtColRow(bricks, c.x - 1, c.y));
    bricksToCheck.push(getBrickAtColRow(bricks, c.x + 1, c.y));
    bricksToCheck.push(getBrickAtColRow(bricks, c.x, c.y));

    for (let brick of bricksToCheck.filter(b => b?.active)) {
        if (!intersects(ball, ball.radius, brick))
            continue;

        // divide brick into 4 angular sectors based on ball position and all 4 brick corners, taking ball radius into consideration
        // these are used to determine if the impact is vertical or horizontal
        // vectors are calculated counter-clockwise starting at upper right corner
        let h1 = new Vector2d(brick.right + ball.radius, brick.top - ball.radius).subtract(ball).heading;
        let h2 = new Vector2d(brick.left - ball.radius, brick.top - ball.radius).subtract(ball).heading;
        let h3 = new Vector2d(brick.left - ball.radius, brick.bottom + ball.radius).subtract(ball).heading;
        let h4 = new Vector2d(brick.right + ball.radius, brick.bottom + ball.radius).subtract(ball).heading;

        // edge case - if ball is exactly aligned with brick top, h1/h2 angle will be positive 0-PI, negate in that case
        h2 = ball.y === (brick.top - ball.radius) ? -h2 : h2;

        let invertedBallHeading = Vector2d.fromAngle(ball.heading).invert().heading;
        if (Vector2d.isHeadingBetween(invertedBallHeading, h1, h2) ||
            Vector2d.isHeadingBetween(invertedBallHeading, h3, h4)) {
            ball.invertY();
        }
        else {
            ball.invertX();
        }

        ball.topRowsHasBeenHit = ball.topRowsHasBeenHit || brick.isTopRow;
        ball.numberOfBrickHits++;
        score += brick.score;
        brick.active = false;

        break;
    }
}

function handleSpeedUp() {
    if (ball.numberOfBrickHits === 4 && gameSpeed < speed2) {
        gameSpeed = speed2;
    }
    else if (ball.numberOfBrickHits === 12 && gameSpeed < speed3) {
        gameSpeed = speed3;
    }
    else if (ball.topRowsHasBeenHit && gameSpeed < speed4) {
        gameSpeed = speed4;
    }
}

function handleBatSize() {
    if (ball.topWallHasBeenHit && !bat.isSmall) {
        bat.makeSmall();
    }
}

function handleBallLost() {
    if (ball.isLost) {
        state = GameState.BALL_LOST;
    }
}

function handleLevelUp() {
    let remainingBricks = bricks.filter(b => b.active).length;
    if (level < 2 && remainingBricks <= 0) {
        state = GameState.LEVEL_UP;
    }
}

function handleGameOver() {
    let remainingBricks = bricks.filter(b => b.active).length;
    if ((lives <= 1 && state === GameState.BALL_LOST) ||
        (level >= 2 && remainingBricks <= 0)) {
        state = GameState.GAME_OVER;
    }
}

function drawBackground() {
    context.fillStyle = "#00000055";
    context.fillRect(0, 0, width, height);
}

function drawBricks() {
    for (let brick of bricks.filter(b => b?.active)) {
        context.fillStyle = brick.color;
        context.fillRect(brick.left, brick.top, brick.width - 1, brick.height - 1);
    }
}

function drawBat() {
    context.fillStyle = "#D45345";
    context.fillRect(bat.x, bat.y, bat.width, bat.height);
}

function drawBall() {
    context.fillStyle = getBrickColor(getCellFromXY(ball).y);
    context.beginPath();
    context.arc(ball.x, ball.y, 5, 0, 2 * Math.PI);
    context.fill();
}

function drawGameStats() {
    let stats = document.getElementById("stats");
    stats.innerHTML = "SCORE: " + score + " LIVES: " + lives;
}

function drawLevelUp() {
    drawOverlay("LEVEL UP");
}

function drawBallLost() {
    drawOverlay("BALL LOST");
}

function drawGameOver() {
    drawOverlay("GAME OVER");
}

function drawOverlay(text) {
    context.font = "3rem 'Press Start 2P'";
    context.textAlign = "center";
    context.textBaseline = 'middle';

    let x = width / 2;
    let y = height / 1.5;

    var g = context.createLinearGradient(0, y - 15, 0, y + 15);
    g.addColorStop("0", "#D25444");
    g.addColorStop("0.2", "#D07137");
    g.addColorStop("1.0", "#3F4FCE");
    context.fillStyle = g;

    context.fillText(text, x, y);
}

function touchEnd(e) {
    e.preventDefault();
    handleRestart();
}

function touchMove(e) {
    let xPos = e.changedTouches[0]?.pageX ?? 0;
    inputCenterX = map(xPos, 0, window.innerWidth, 0, width);
}

function mouseMove(e) {
    e.preventDefault();
    inputCenterX = map(e.pageX, 0, window.innerWidth, 0, width);
}

function mouseDown(e) {
    e.preventDefault();
    handleRestart();
}

function handleRestart() {
    switch (state) {
        case GameState.LAUNCHING:
            state = GameState.RUNNING;
            break;

        case GameState.LEVEL_UP:
            levelUp();
            break;

        case GameState.BALL_LOST:
            newBall();
            break;

        case GameState.GAME_OVER:
            startNewGame();
            return;
    }
}

function startNewGame() {
    const ballRadius = 5;
    const initialBallDirection = new Vector2d(0.7, -1);
    const batHeight = 0.5 * brickHeight;
    const batInitialWidth = 3 * brickWidth;

    bat = new Bat(width / 2 - batInitialWidth / 2, height - 2 * batHeight, batInitialWidth, batHeight);
    ball = new Ball(bat.x + bat.Width / 2, bat.y - ballRadius, ballRadius, initialBallDirection);
    bricks = createBricks(rows, columns, brickWidth, brickHeight);

    score = 0;
    lives = 5;
    gameSpeed = speed1;
    level = 1;
    state = GameState.LAUNCHING;
}

function levelUp() {
    // keep much of current state (speed, bat size etc) on level up

    ball.resetDirection();
    ball.y = bat.y - ball.radius;

    bricks = createBricks(rows, columns, brickWidth, brickHeight);

    level++;
    state = GameState.LAUNCHING;
}

function newBall() {
    bat.resetWidth();

    ball.resetDirection();
    ball.x = bat.x + bat.Width / 2;
    ball.y = bat.y - ball.radius;
    ball.topRowsHasBeenHit = false;
    ball.topWallHasBeenHit = false;
    ball.numberOfBrickHits = 0;
    ball.isLost = false;

    lives--;
    gameSpeed = speed1;
    state = GameState.LAUNCHING;
}

function createBricks(rows, columns, brickWidth, brickHeight) {
    let bricks = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            let left = col * brickWidth;
            let top = row * brickHeight;
            let color = getBrickColor(row);
            let score = getBrickScore(row);
            let isTopRow = row >= 4 && row <= 5;
            let active = row > 3;
            bricks.push(new Brick(left, top, brickWidth, brickHeight, col, row, color, score, isTopRow, active));
        }
    }

    return bricks;
}

function getBrickColor(rowNumber) {
    switch (rowNumber) {
        case 4: return "#D25444";
        case 5: return "#D07137";
        case 6: return "#BA7B2C";
        case 7: return "#A49A26";
        case 8: return "#439348";
        case 9: return "#3F4FCE";
        default: return "#D25444";
    }
}

function getBrickScore(rowNumber) {
    switch (rowNumber) {
        case 4: return 7;
        case 5: return 7;
        case 6: return 4;
        case 7: return 4;
        case 8: return 1;
        case 9: return 1;
        default: return 0;
    }
}

function intersects(ball, radius, brick) {
    const halfWidth = brick.width / 2;
    const halfHeight = brick.height / 2;

    let distX = Math.abs(ball.x - (brick.left + halfWidth));
    let distY = Math.abs(ball.y - (brick.top + halfHeight));

    if (distX > (halfWidth + radius) ||
        distY > (halfHeight + radius)) {
        return false;
    }

    if (distX <= (halfWidth + radius) ||
        distY <= (halfHeight + radius)) {
        return true;
    }

    let cornerDistance_sq =
        Math.pow((distX - halfWidth), 2) +
        Math.pow((distY - halfHeight), 2);

    return cornerDistance_sq <= radius * radius;
}

function getCellFromXY(ball) {
    let x = Math.floor(ball.x / brickWidth);
    let y = Math.floor(ball.y / brickHeight);

    return new Point2d(x, y);
}

function getBrickAtColRow(bricks, col, row) {
    return bricks[row * columns + col];
}

function clamp(value, min, max) {
    if (value > max) return max;
    if (value < min) return min;
    return value;
}

function map(value, inputMin, inputMax, outputMin, outputMax) {
    return (value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin;
}