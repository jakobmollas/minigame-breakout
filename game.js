'use strict'

// Todo: use deltatime for calculations
// Todo: add scoring
// todo: add live counter, decrease lives
// todo: add speed-up as per original game
// Todo: Make canvas and all sizes dynamic, to support high dpi screens?
// Todo: Refactor

// todo: add fast speed, for example holding ctrl?
// Todo: do not launch ball until space (or smth) is pressed, allow bat movement
// Todo: scale to device width? With max width? 
// Todo: add support for mobile devices, for example tap to launch/restart, swipe to move etc.
// Todo: Only check brick collisions when reasonable, no need to check when above/belov brick area? Maybe check at current pos plus all bricks around that pos?

const columns = 18;
const rows = 10;
const brickWidth = 30;
const brickHeight = 15;
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
let batSpeed = 10;
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
    checkBallToBatCollision();
    checkBallToBrickCollision();
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
    bat.x += movementX * batSpeed;

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
        ball.x = ballRadius;
    }
    else if (ball.x > width - ballRadius) {
        ballVelocity.invertX();
        ball.x = width - ballRadius;
    }

    if (ball.y < 0 + ballRadius) {
        ballVelocity.invertY();
        ball.y = ballRadius;
    }
    else if (ball.y > height - ballRadius) {
        ballVelocity.invertY();
        ball.y = height - ballRadius;
    }
}

function checkBallToBatCollision() {
    if (ball.y + ballRadius < bat.y) {
        return;
    }

    if (ball.x < bat.x || ball.x > bat.x + batWidth) {
        return;
    }

    ballVelocity.invertY();
    ball.y = bat.y - ballRadius;

    // let point of impact affect bounce direction
    let impactRotation = ((ball.x - bat.x) / batWidth - 0.5) * 4;

    // clamp to some min/max angles to avoid very shallow angles
    let newHeading = clamp(ballVelocity.heading() + impactRotation, -Math.PI * 0.75, -Math.PI * 0.25);
    ballVelocity.setHeading(newHeading);
}

function checkBallToBrickCollision() {
    // Todo: Check brick at ball pos, then bricks above/below/left/right, then diagonal bricks, this will remove a few edge cases

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            let brick = bricks[row * columns + col];
            if (!brick.active)
                continue;

            if (!intersects(ball, ballRadius, new Vector2d(brick.left, brick.top), brickWidth, brickHeight))
                continue;

            // divide brick into 4 angular sectors based on ball position and all 4 brick corners, taking ball radius into consideration
            // these are used to determine if the impact is vertical or horizontal
            // vectors are calculated counter-clockwise starting at upper right corner
            let h1 = new Vector2d(brick.right + ballRadius, brick.top - ballRadius).subtract(ball).heading();
            let h2 = new Vector2d(brick.left - ballRadius, brick.top - ballRadius).subtract(ball).heading();
            let h3 = new Vector2d(brick.left - ballRadius, brick.bottom + ballRadius).subtract(ball).heading();
            let h4 = new Vector2d(brick.right + ballRadius, brick.bottom + ballRadius).subtract(ball).heading();

            let invertedBallHeading = ballVelocity.clone().invert().heading();
            if (isAngleBetween(invertedBallHeading, h1, h2) ||
                isAngleBetween(invertedBallHeading, h3, h4)) {
                ballVelocity.invertY();
            }
            else {
                ballVelocity.invertX();
            }

            brick.active = false;

            return;
        }
    }
}

function drawBackground() {
    context.fillStyle = "#00000055";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBricks() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            let brick = bricks[row * columns + col];
            context.fillStyle = getBrickColor(row);
            if (brick.active) {
                context.fillRect(col * brickWidth, row * brickHeight, brickWidth - 1, brickHeight - 1);
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
        case 4: return "#D25444";
        case 5: return "#D07137";
        case 6: return "#BA7B2C";
        case 7: return "#A49A26";
        case 8: return "#439348";
        case 9: return "#3F4FCE";
        default: return "#3F4FCE";
    }
}

function intersects(circle, radius, rectangle, rectWidth, rectHeight) {
    const halfWidth = rectWidth / 2;
    const halfHeight = rectHeight / 2;

    let distX = Math.abs(circle.x - (rectangle.x + halfWidth));
    let distY = Math.abs(circle.y - (rectangle.y + halfHeight));

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
    stats.innerHTML = "Ball heading: " + ballVelocity.heading().toFixed(2);
    //stats.innerHTML = "FPS: " + fps.toFixed() + " (" + deltaTime.toFixed() + " ms)";
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
    ballVelocity = new Vector2d(-3, -4.5);
    score = 0;
    gameOver = false;
    leftPressed = rightPressed = false;
    bricks = createBricks();
}

function createBricks() {
    let bricks = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            let left = col * brickWidth;
            let top = row * brickHeight;
            let color = getBrickColor(row);
            let active = row > 3;
            bricks.push(new Brick(left, top, brickWidth, brickHeight, color, active));
        }
    }

    return bricks;
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