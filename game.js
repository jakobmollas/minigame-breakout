'use strict'

// Collision detection works pretty good for reasonable speeds, 
// could be improved by doing multiple passes, 
// splitting up movement vector into multiple smaller deltas and checking each one

// todo: add live counter, decrease lives
// Todo: remove bottom bounce when not needed, or hide with setting
// todo: shrink bat to 1/2 size when hitting back wall
// todo: 2 screens max, then game over
// todo: change ball color based on row
// Todo: Refactor

// Todo: Make canvas and all sizes dynamic, to support high dpi screens?
// Todo: scale to device width? With max width? 
// Todo: add support for mobile devices, for example tap to launch/restart, swipe to move etc.

const columns = 18;
const rows = 10;
const brickWidth = 30;
const brickHeight = 15;
const batWidth = 3 * brickWidth;
const batHeight = 0.5 * brickHeight;
const ballRadius = 5;
const speed1 = 40;
const speed2 = 65;
const speed3 = 90;
const speed4 = 120;

let canvas;
let context;
let height = 0;
let width = 0;
let mouseX = 0;

// Todo: move to game state object?
let bat;
let ball;
let ballDirection;
let score;
let lives;
let gameSpeed;
let level;
let numberOfHits;
let topWallHasBeenHit;
let topRowsHasBeenHit;
let gameOver;
let running;
let bricks = [];

let deltaTime = 0;
let deltaTimeFactor = 0;
let fps = 0;
let lastTimestamp = 0;

window.onload = function () {
    canvas = document.getElementById("game-canvas");
    context = canvas.getContext("2d");

    width = canvas.width;
    height = canvas.height;

    document.addEventListener("keydown", keyDown);
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);

    initialize();

    window.requestAnimationFrame(mainLoop);
}

function mainLoop() {
    deltaTime = lastTimestamp ? performance.now() - lastTimestamp : 0;
    deltaTimeFactor = deltaTime > 0 ? 1 / deltaTime : 0;
    fps = deltaTime > 0 ? 1000 / deltaTime : 0;

    processGameLogic();
    render();

    lastTimestamp = performance.now();
    window.requestAnimationFrame(mainLoop);
}

function processGameLogic() {
    if (gameOver) {
        return;
    }

    moveBat();
    moveBall();

    checkBallToWallCollision();
    checkBallToBatCollision();
    checkBallToBrickCollision();

    handleSpeedUp();
    handleBatSize();
}

function render() {
    drawBackground();
    drawBricks();
    drawBat();
    drawBall();

    drawScore();
    drawGameOver();
    drawFps();
}

function moveBat() {
    bat.x = clamp(mouseX, 0, width - batWidth)
}

function moveBall() {
    if (!running) {
        ball.x = bat.x + batWidth / 2;
        ball.y = bat.y - ballRadius;
        return;
    }

    ball.add(Vector2d.mult(ballDirection, gameSpeed * deltaTimeFactor));
}

function checkBallToWallCollision() {
    if (ball.x < ballRadius || ball.x > width - ballRadius) {
        ballDirection.invertX();
        ball.x = clamp(ball.x, ballRadius, width - ballRadius);
    }

    if (ball.y < ballRadius || ball.y > height - ballRadius) {
        ballDirection.invertY();
        ball.y = clamp(ball.y, ballRadius, height - ballRadius);
    }
}

function checkBallToBatCollision() {
    if (ball.y + ballRadius <= bat.y) {
        return;
    }

    if (ball.x < bat.x || ball.x > bat.x + batWidth) {
        return;
    }

    ballDirection.invertY();
    ball.y = bat.y - ballRadius;

    // let point of impact affect bounce direction
    let impactRotation = ((ball.x - bat.x) / batWidth - 0.5) * 4;

    // clamp to some min/max angles to avoid very shallow angles
    let newHeading = clamp(ballDirection.heading() + impactRotation, -Math.PI * 0.75, -Math.PI * 0.25);
    ballDirection.setHeading(newHeading);
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
        if (!intersects(ball, ballRadius, brick))
            continue;

        // divide brick into 4 angular sectors based on ball position and all 4 brick corners, taking ball radius into consideration
        // these are used to determine if the impact is vertical or horizontal
        // vectors are calculated counter-clockwise starting at upper right corner
        let h1 = new Vector2d(brick.right + ballRadius, brick.top - ballRadius).subtract(ball).heading();
        let h2 = new Vector2d(brick.left - ballRadius, brick.top - ballRadius).subtract(ball).heading();
        let h3 = new Vector2d(brick.left - ballRadius, brick.bottom + ballRadius).subtract(ball).heading();
        let h4 = new Vector2d(brick.right + ballRadius, brick.bottom + ballRadius).subtract(ball).heading();

        // edge case - if ball is exactly aligned with brick top, h1/h2 angle will be positive 0-PI, negate in that case
        h2 = ball.y === (brick.top - ballRadius) ? -h2 : h2;

        let invertedBallHeading = ballDirection.clone().invert().heading();
        if (isAngleBetween(invertedBallHeading, h1, h2) ||
            isAngleBetween(invertedBallHeading, h3, h4)) {
            ballDirection.invertY();
        }
        else {
            ballDirection.invertX();
        }

        topRowsHasBeenHit = topRowsHasBeenHit || brick.row === 4 || brick.row === 5;
        numberOfHits++;
        score += brick.score;
        brick.active = false;

        break;
    }
}

function getCellFromXY(ball) {
    let x = Math.floor(ball.x / brickWidth);
    let y = Math.floor(ball.y / brickHeight);

    return new Point2d(x, y);
}

function getBrickAtColRow(bricks, col, row) {
    return bricks[row * columns + col];
}

function handleSpeedUp() {
    if (numberOfHits === 4 && gameSpeed < speed2) {
        gameSpeed = speed2;
    }
    else if (numberOfHits === 12 && gameSpeed < speed3) {
        gameSpeed = speed3;
    }
    else if (topRowsHasBeenHit && gameSpeed < speed4) {
        gameSpeed = speed4;
    }
}

function handleBatSize() {
    // todo: implement
}

function drawBackground() {
    context.fillStyle = "#00000055";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBricks() {
    for (let brick of bricks.filter(b => b?.active)) {
        context.fillStyle = brick.color;
        context.fillRect(brick.left, brick.top, brick.width - 1, brick.height - 1);
    }
}

function drawBat() {
    context.fillStyle = "#D45345";
    context.fillRect(bat.x, bat.y, batWidth, batHeight);
}

function drawBall() {
    context.fillStyle = "#D45345";
    context.beginPath();
    context.arc(ball.x, ball.y, 5, 0, 2 * Math.PI);
    context.fill();
}

function intersects(circle, radius, brick) {
    const halfWidth = brick.width / 2;
    const halfHeight = brick.height / 2;

    let distX = Math.abs(circle.x - (brick.left + halfWidth));
    let distY = Math.abs(circle.y - (brick.top + halfHeight));

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

function drawScore() {
    let scoreBoard = document.getElementById("score");
    scoreBoard.innerHTML = "Score: " + score;
}

function drawGameOver() {
    if (!gameOver) {
        return;
    }

    context.font = "7rem consolas";
    context.fillText("GAME", 70, 180);
    context.fillText("OVER", 70, 300);
}

function drawFps() {
    let stats = document.getElementById("fps");
    stats.innerHTML = "FPS: " + fps.toFixed() + " (" + deltaTime.toFixed() + " ms)";
}

function keyDown(e) {
    // space
    if (e.keyCode === 32) {
        if (gameOver) {
            initialize();
        }
        else {
            running = true;
        }

        e.preventDefault();
    }
}

function mouseMove(e) {
    mouseX = e.pageX;
    e.preventDefault();
}

function mouseDown(e) {
    running = true;
    e.preventDefault();
}

function initialize() {
    bat = new Point2d(width / 2 - batWidth / 2, height - 2 * batHeight);
    ball = new Vector2d(bat.x + batWidth / 2, bat.y - ballRadius);
    ballDirection = new Vector2d(0.7, -1);
    score = 0;
    lives = 5;
    gameSpeed = speed1;
    level = 1;
    numberOfHits = 0;
    topWallHasBeenHit = false;
    topRowsHasBeenHit = false;
    gameOver = false;
    running = false;

    bricks = createBricks();
}

function createBricks() {
    let bricks = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            let left = col * brickWidth;
            let top = row * brickHeight;
            let color = getBrickColor(row);
            let score = getBrickScore(row);
            let active = row > 3;
            bricks.push(new Brick(left, top, brickWidth, brickHeight, col, row, color, score, active));
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
        default: return "#3F4FCE";
    }
}

function getBrickScore(rowNumber) {
    switch (rowNumber) {
        case 4:return 7;
        case 5: return 7;
        case 6:return 4;
        case 7: return 4;
        case 8:return 1;
        case 9: return 1;
        default: return 0;
    }
}

function clamp(value, min, max) {
    if (value > max) return max;
    if (value < min) return min;
    return value;
}

function isAngleBetween(target, angle1, angle2) {
    return angle1 <= angle2
        ? angle2 - angle1 <= Math.PI
            ? angle1 <= target && target <= angle2
            : angle2 <= target || target <= angle1
        : angle1 - angle2 <= Math.PI
            ? angle2 <= target && target <= angle1
            : angle1 <= target || target <= angle2;
}