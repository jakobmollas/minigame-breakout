'use strict'

// Collision detection works pretty good for reasonable speeds, 
// could be improved by doing multiple passes, 
// splitting up movement vector into multiple smaller deltas and checking each one

// todo: add life counter, decrease lives
// Todo: remove bottom bounce when not needed, or hide with setting
// todo: 2 screens max, then game over
// Todo: Refactor

// Maybe:
// todo: add images and more discusison in readme
// Todo: Make canvas and all sizes dynamic, to support high dpi screens?
// Todo: scale to device width? With max width? 
// Todo: add support for mobile devices, for example tap to launch/restart, swipe to move etc.

const columns = 18;
const rows = 10;

const brickWidth = 30;
const brickHeight = 15;

const speed1 = 150; // pixels per second
const speed2 = 210;
const speed3 = 270;
const speed4 = 360;

let canvas;
let context;
let mouseX = 0;

let bat;
let ball;
let score;
let lives;
let gameSpeed; // todo: move to ball class?
let level;
let numberOfHits;
let topWallHasBeenHit;
let topRowsHasBeenHit;
let gameOver;
let running;
let bricks = [];
let gameTime = new GameTime();

window.onload = function () {
    canvas = document.getElementById("game-canvas");
    context = canvas.getContext("2d");

    document.addEventListener("keydown", keyDown);
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);

    initialize();

    window.requestAnimationFrame(mainLoop);
}

function mainLoop() {
    gameTime.update();

    processGameLogic();
    render();
    
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

    drawStats();
    drawGameOver();
    drawFps();
}

function moveBat() {
    bat.x = clamp(mouseX, 0, canvas.width - bat.width)
}

function moveBall() {
    if (!running) {
        ball.x = bat.x + bat.width / 2;
        ball.y = bat.y - ball.radius;
        return;
    }

    ball.pos.add(Vector2d.mult(ball.direction, gameSpeed * gameTime.deltaTimeFactor));
}

function checkBallToWallCollision() {
    if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
        ball.direction.invertX();
        ball.x = clamp(ball.x, ball.radius, canvas.width - ball.radius);
    }

    if (ball.y < ball.radius || ball.y > canvas.height - ball.radius) {
        ball.direction.invertY();
        topWallHasBeenHit = ball.y < ball.radius;

        ball.y = clamp(ball.y, ball.radius, canvas.height - ball.radius);
    }
}

function checkBallToBatCollision() {
    if (ball.y + ball.radius <= bat.y) {
        return;
    }

    if (ball.x < bat.x || ball.x > bat.x + bat.width) {
        return;
    }

    ball.direction.invertY();
    ball.y = bat.y - ball.radius;

    // let point of impact affect bounce direction
    let impactRotation = ((ball.x - bat.x) / bat.width - 0.5) * 4;

    // clamp to some min/max angles to avoid very shallow angles
    let newHeading = clamp(ball.direction.heading + impactRotation, -Math.PI * 0.75, -Math.PI * 0.25);
    ball.direction.setHeading(newHeading);
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

        let invertedBallDirection = ball.direction.clone().invert();
        if (invertedBallDirection.isHeadingBetween(h1, h2) ||
            invertedBallDirection.isHeadingBetween(h3, h4)) {
                ball.direction.invertY();
        }
        else {
            ball.direction.invertX();
        }

        topRowsHasBeenHit = topRowsHasBeenHit || brick.row === 4 || brick.row === 5;
        numberOfHits++;
        score += brick.score;
        brick.active = false;

        break;
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
    if (topWallHasBeenHit && !bat.isSmall) {
        bat.makeSmall();
    }
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
    context.fillRect(bat.x, bat.y, bat.width, bat.height);
}

function drawBall() {
    context.fillStyle = getBrickColor(getCellFromXY(ball).y);
    context.beginPath();
    context.arc(ball.x, ball.y, 5, 0, 2 * Math.PI);
    context.fill();
}

function drawStats() {
    let stats = document.getElementById("stats");
    stats.innerHTML = "SCORE: " + score +  " LIVES: " + lives;
}

function drawGameOver() {
    if (!gameOver) {
        return;
    }

    context.font = "7rem Press Start 2P";
    context.fillText("GAME", 70, 180);
    context.fillText("OVER", 70, 300);
}

function drawFps() {
    let stats = document.getElementById("fps");
    stats.innerHTML = "FPS: " + gameTime.fps.toFixed() + " (" + gameTime.deltaTime.toFixed() + " ms)";
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
    const ballRadius = 5;
    const initialBallDirection = new Vector2d(0.7, -1);
    const batHeight = 0.5 * brickHeight;
    const batInitialWidth = 3 * brickWidth;

    bat = new Bat(canvas.width / 2 - batInitialWidth / 2, canvas.height - 2 * batHeight, batInitialWidth, batHeight);
    ball = new Ball(bat.x + bat.Width / 2, bat.y - ballRadius, ballRadius, initialBallDirection);

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
        default: return "#D25444";
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