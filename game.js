'use strict'

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
let batX = 0;
let batY = 0;
let ballX = 0;
let ballY = 0;
let ballDirX = 0;
let ballDirY = 0;
let score = 0;
let gameOver = false;
let leftPressed = false;
let rightPressed = false;
let bricks = [];

// Todo: remove?
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

    // move
    let movementX = leftPressed ? -1 : 0;
    movementX = rightPressed ? 1 : movementX;
    batX += movementX * 15;

    if (batX < 0) {
        batX = 0;
    }
    if (batX + batWidth > width) {
        batX = width - batWidth;
    }

    // ball
    ballX += ballDirX;
    ballY += ballDirY;

    // check wall collision
    if (ballX < 0 + ballRadius || ballX > width - ballRadius) { ballDirX = -ballDirX; }
    if (ballY < 0 + ballRadius || ballY > height - ballRadius) { ballDirY = -ballDirY; }

    // bounce off of bat
    if (ballY + ballRadius > batY) {
        if (ballX >= batX && ballX <= batX + batWidth) {
            // Todo: Change angle based on point of impact
            // var xDiff = ballX - batX;
            // var relDiff = xDiff / batWidth - 0.5;
            // console.log(relDiff);
            ballDirY = -ballDirY;
            //ballDirX += relDiff * 5;
            //ballDirY -= relDiff * 5;
        }
    }

    // check brick collision, remove brick, bounce, increment score, increment speed, check for game over/new level etc
    checkBrickCollision();

    // todo: check lost ball, remove life, check game over etc.
}

function checkBrickCollision() {
    // Todo: Improve collision logic, account for the full ball, not just center
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            let brick = bricks[row * columns + col];
            if (!brick.active) {
                continue;
            }

            if (ballX >= col*brickWidth && 
                ballX <= col*brickWidth + brickWidth && 
                ballY >= topMargin + row*brickHeight && 
                ballY <= topMargin +row*brickHeight + brickHeight) {
                brick.active = false;
                ballDirY = -ballDirY;
                //ballDirX = -ballDirX;
                return;
            }
            // context.fillStyle = getBrickColor(row);
            // if (brick.active) {
            //     context.fillRect(col * brickWidth, row * brickHeight + topMargin, brickWidth - 1, brickHeight - 1);
            // }
        }
    }
}

function render() {
    // background
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // bricks
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            let brick = bricks[row * columns + col];
            context.fillStyle = getBrickColor(row);
            if (brick.active) {
                context.fillRect(col * brickWidth, row * brickHeight + topMargin, brickWidth - 1, brickHeight - 1);
            }
        }
    }

    // player bat
    context.fillStyle = "#D45345";
    context.fillRect(batX, batY, batWidth, batHeight);

    // ball
    context.fillStyle = "#D45345";
    context.beginPath();
    context.arc(ballX, ballY, 5, 0, 2*Math.PI);
    context.fill();

    // scoring etc.
    showScore(score);
    showGameOver(gameOver);
    showFps();
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

function showScore(score) {
    let scoreBoard = document.getElementById("score");
    scoreBoard.innerHTML = "Score: " + score;
}

function showGameOver(gameOver) {
    if (!gameOver) {
        return;
    }

    context.font = "7rem consolas";
    context.fillText("GAME", 70, 180);
    context.fillText("OVER", 70, 300);
}

function showFps() {
    let stats = document.getElementById("fps");
    stats.innerHTML = "FPS: " + fps.toFixed() + " (" + deltaTime.toFixed() + " ms)";
}

function keyDown(e) {
    // space
    if (e.keyCode === 32 && gameOver) {
        initialize();
        return;
    }

    switch (e.keyCode) {
        case 37:    // left arrow
            leftPressed = true;
            break;

        case 39:    // right arrow
            rightPressed = true;
            break;
    }
}

function keyUp(e) {
    switch (e.keyCode) {
        case 37:    // left arrow
            leftPressed = false;
            break;

        case 39:    // right arrow
            rightPressed = false;
            break;
    }
}

function initialize() {
    batX = width / 2 - batWidth / 2;
    batY = height - 2 * batHeight;
    ballX = ballY = 300;
    ballDirX = ballDirY = 5;
    score = 0;
    gameOver = false;
    leftPressed = rightPressed = false;
    bricks = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            bricks.push({ active: true, color: row })
        }
    }
}