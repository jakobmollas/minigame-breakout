'use strict'

// Todo: Make canvas and all sizes dynamic, to support high dpi screens?
// Todo: Refactor
// Todo: use deltatime for calculations
// todo: add fast speed, for example holding ctrl?

const columns = 18;
const rows = 6;
const brickWidth = 30;
const brickHeight = 15;
const topMargin = 4 * brickHeight;
const batWidth = 3 * brickWidth;
const batHeight = 0.5 * brickHeight;
const ballRadius = 5;

let canvas;
let context;
let height = 0;
let width = 0;
let bat;
let ball;
let ballVelocity;
let score = 0;
let gameOver = false;
let leftPressed = false;
let rightPressed = false;
let bricks = [];

// Todo: remove? use dev tools instead
let deltaTime = 0;
let fps = 0;
let lastTimestamp = 0;

window.onload = function () {
    canvas = document.getElementById("game-canvas");
    context = canvas.getContext("2d");

    width = canvas.width;
    height = canvas.height;

    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    initialize();

    window.requestAnimationFrame(mainLoop);
}

function mainLoop() {
    deltaTime = lastTimestamp != null ? performance.now() - lastTimestamp : 0;
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
    checkBallToBatCollision
    checkBallToBrickCollision();

    // todo: check lost ball, remove life, check game over etc.
}

function render() {
    drawBackground();
    drawBricks();
    drawBat();
    drawBall();

    drawScore(score);
    drawGameOver(gameOver);
    drawFps();
}

function moveBat() {
    let movementX = leftPressed ? -1 : 0;
    movementX = rightPressed ? 1 : movementX;
    bat.x += movementX * 15;

    if (bat.x < 0) {
        bat.x = 0;
    }
    else if (bat.x + batWidth > width) {
        bat.x = width - batWidth;
    }
}

function moveBall() {
    ball.add(ballVelocity);
}

function checkBallToWallCollision() {
    if (ball.x < 0 + ballRadius) {
        ballVelocity.invertX();
        ball.x = 1 + ballRadius;
    }
    else if (ball.x > width - ballRadius) {
        ballVelocity.invertX();
        ball.x = width - 1 - ballRadius;
    }

    if (ball.y < 0 + ballRadius) {
        ballVelocity.invertY();
        ball.y = 1 + ballRadius;
    }
    else if (ball.y > height - ballRadius) {
        ballVelocity.invertY();
        ball.y = height - 1 - ballRadius;
    }
}

function checkBallToBatCollision() {
    if (ball.y + ballRadius > bat.y) {
        if (ball.x >= bat.x && ball.x <= bat.x + batWidth) {
            // Todo: Change angle based on point of impact
            // var xDiff = ball.x - batX;
            // var relDiff = xDiff / batWidth - 0.5;
            // console.log(relDiff);
            //ballDirY = -ballDirY;
            //ballVelocity.x += relDiff * 5;
            //ballDirY -= relDiff * 5;
        }
    }
}

function checkBallToBrickCollision() {
    // Todo: Only check when reasonable, no need to check when above/belov brick area?

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            let brick = bricks[row * columns + col];
            if (!brick.active) {
                continue;
            }

            if (intersects(ball, ballRadius, new Vector2d(col * brickWidth, topMargin + row * brickHeight), brickWidth, brickHeight)) {
                ballVelocity.invertY();
                brick.active = false;

                // Todo: check incoming direction, reflect accordingly

                return;
            }
        }
    }
}

function drawBackground() {
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBricks() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            let brick = bricks[row * columns + col];
            context.fillStyle = getBrickColor(row);
            if (brick.active) {
                context.fillRect(col * brickWidth, row * brickHeight + topMargin, brickWidth - 1, brickHeight - 1);
            }
        }
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

function getBrickColor(rowNumber) {
    switch (rowNumber) {
        case 0: return "#D25444";
        case 1: return "#D07137";
        case 2: return "#BA7B2C";
        case 3: return "#A49A26";
        case 4: return "#439348";
        case 5: return "#3F4FCE";
    }
}

function intersects(circle, radius, rectangle, rectWidth, rectHeight) {
    let distX = Math.abs(circle.x - (rectangle.x + rectWidth / 2));
    let distY = Math.abs(circle.y - (rectangle.y + rectHeight / 2));

    if (distX > (rectWidth / 2 + radius) ||
        distY > (rectHeight / 2 + radius)) {
        return false;
    }

    if (distX <= (rectWidth / 2 + radius) ||
        distY <= (rectHeight / 2 + radius)) {
        return true;
    }

    let cornerDistance_sq =
        Math.pow((distX - rectWidth / 2), 2) +
        Math.pow((distY - rectHeight / 2), 2);

    return cornerDistance_sq <= Math.pow(radius, 2);
}

function drawScore(score) {
    let scoreBoard = document.getElementById("score");
    scoreBoard.innerHTML = "Score: " + score;
}

function drawGameOver(gameOver) {
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
    if (e.keyCode === 32 && gameOver) {
        initialize();
        return;
    }

    handleArrowKeys(e, true);
}

function keyUp(e) {
    handleArrowKeys(e, false);
}

function handleArrowKeys(e, isKeyDown) {
    switch (e.keyCode) {
        case 37:    // left arrow
            leftPressed = isKeyDown;
            break;

        case 39:    // right arrow
            rightPressed = isKeyDown;
            break;
    }
}

function initialize() {
    bat = new Vector2d(width / 2 - batWidth / 2, height - 2 * batHeight);
    ball = new Vector2d(bat.x + batWidth / 2, bat.y - ballRadius);
    ballVelocity = new Vector2d(-2, -3.5);
    score = 0;
    gameOver = false;
    leftPressed = rightPressed = false;
    bricks = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            bricks.push({ active: true, color: row })
        }
    }

    // Todo: do not launch ball until space (or smth) is pressed, allow bat movement
}