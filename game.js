import { default as Collisions, PointOfImpact } from './modules/collisions.js';
import Point2d from './modules/point2d.js';
import Vector2d from './modules/vector2d.js';
import Ball from './modules/ball.js';
import Bat from './modules/bat.js';
import Brick from './modules/brick.js';
import GameTime from './modules/gametime.js';
import Rectangle from './modules/rectangle.js';
import UiRenderer from './modules/ui-renderer.js';

// todo: move all state to separate class?

const borderWidth = 10;
const gameAreaWidth = 540;
const gameAreaHeight = 360;
const fullWidth = gameAreaWidth + 2*borderWidth;  
const fullHeight = gameAreaHeight + borderWidth;

const columns = 18;
const rows = 10;

const brickWidth = 30;
const brickHeight = 15;

const speed1 = 150; // pixels per second
const speed2 = 210;
const speed3 = 270;
const speed4 = 360;

const ballRadius = 5;
const initialBallDirection = new Vector2d(0.7, -1);
const batHeight = 0.5 * brickHeight;
const batInitialWidth = 3 * brickWidth;

const GameState = { LAUNCHING: 0, RUNNING: 1, LEVEL_UP: 2, BALL_LOST: 3, GAME_OVER: 4 };

let bat = new Bat(gameAreaWidth / 2 - batInitialWidth / 2, gameAreaHeight - 2 * batHeight, batInitialWidth, batHeight, "#D45345");
let ball = new Ball(0, 0, ballRadius, initialBallDirection);
let bricks = createBricks();

let score, lives, gameSpeed, level, state;
let numberOfBrickHits, topWallHasBeenHit, topRowsHasBeenHit;

let ctx, uiRenderer;
let inputCenterX = 0;
const gameTime = new GameTime();

window.onload = function () {
    ctx = setupCanvasContext();
    uiRenderer = new UiRenderer(ctx, fullWidth, fullHeight);

    document.addEventListener("touchmove", touchMove);
    document.addEventListener("touchend", touchEnd);
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);

    startNewGame();

    window.requestAnimationFrame(mainLoop);
}

function setupCanvasContext() {
    let canvas = document.getElementById("game-canvas");
    canvas.width = fullWidth;
    canvas.height = fullHeight;

    let dpr = 1 / (window.devicePixelRatio || 1);
    canvas.width = canvas.width * dpr;
    canvas.height = canvas.height * dpr;

    let ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    return ctx;
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
        updateBallColor();
    }

    if (state === GameState.RUNNING) {
        handleBallToWallCollision();
        handleBallToBatCollision();
        handleBallToBrickCollision();

        handleSpeedUp();
        handleBatSize();
        handleBallLost();
        handleLevelUp();
        handleGameOver();
    }
}

function render() {
    clearBackground();
    drawBorders();

    // game objects are drawn in an area excluding borders
    ctx.save();
    ctx.translate(borderWidth, borderWidth);
    bricks.forEach(b => b.draw(ctx));
    bat.draw(ctx);
    ball.draw(ctx);
    ctx.restore();

    uiRenderer.drawGameStats(score, lives);

    switch (state) {
        case GameState.LEVEL_UP:
            uiRenderer.drawLevelUp();
            break;

        case GameState.BALL_LOST:
            uiRenderer.drawBallLost();
            break;

        case GameState.GAME_OVER:
            uiRenderer.drawGameOver();
            break;
    }
}

function moveBat() {
    bat.x = clamp(inputCenterX - bat.width / 2, 0, gameAreaWidth - bat.width)
}

function moveBall() {
    if (state === GameState.RUNNING) {
        ball.move(gameSpeed * gameTime.deltaTimeFactor);
        return;
    }

    positionBallOnTopOfBat(ball, bat);
}

function updateBallColor() {
    // Match color of bricks at current row
    const rowNumber = getCellFromXY(ball.x, ball.y).y;
    ball.color = getRowColor(rowNumber);
}

function positionBallOnTopOfBat(ball, bat) {
    ball.x = bat.x + bat.width / 2;
    ball.y = bat.y - ball.radius;
}

function handleBallToWallCollision() {
    const gameArea = new Rectangle(0, 0, gameAreaWidth, gameAreaHeight);
    const pointOfImpact = Collisions.ballToInnerRectangle(ball, gameArea);

    switch (pointOfImpact) {
        case PointOfImpact.LEFT:
        case PointOfImpact.RIGHT:
            bounceBallAgainstHorizontalWall(ball);
            break;

        case PointOfImpact.TOP:
            bounceBallAgainstTopWall(ball);
            break;

        case PointOfImpact.BOTTOM:
            ball.isLost = true;
            break;
    }
}

function bounceBallAgainstHorizontalWall(ball) {
    ball.invertX();
    ball.x = clamp(ball.x, ball.radius, gameAreaWidth - ball.radius);
}

function bounceBallAgainstTopWall(ball) {
    ball.invertY();
    ball.y = ball.radius;
    topWallHasBeenHit = true;
}

function handleBallToBatCollision() {
    const pointOfImpact = Collisions.ballToRectangle(ball, bat.rectangle);
    if (pointOfImpact !== PointOfImpact.TOP)
        return;

    ball.invertY();
    ball.y = bat.y - ball.radius;

    // let point of impact affect bounce direction
    const impactRotation = ((ball.x - bat.x) / bat.width - 0.5) * 4;

    // clamp to some min/max angles to avoid very shallow angles
    const newHeading = clamp(ball.heading + impactRotation, -Math.PI * 0.80, -Math.PI * 0.20);
    ball.setHeading(newHeading);
}

function handleBallToBrickCollision() {
    const bricksToCheck = getBricksAtBallPosition(ball, bricks);

    for (let brick of bricksToCheck.filter(b => b?.active)) {
        const pointOfImpact = Collisions.ballToRectangle(ball, brick.rectangle);
        switch (pointOfImpact) {
            case PointOfImpact.LEFT:
            case PointOfImpact.RIGHT:
                ball.invertX();
                break;

            case PointOfImpact.TOP:
            case PointOfImpact.BOTTOM:
                ball.invertY();
                break;

            default:
                continue;
        }

        topRowsHasBeenHit = topRowsHasBeenHit || brick.isTopRow;
        numberOfBrickHits++;
        score += brick.score;
        brick.active = false;

        return;
    }
}

/**
 * Get bricks at ball position plus above/below/left/right, 
 * regardless if they are active or not
 */
function getBricksAtBallPosition(ball, bricks) {
    let targetBricks = [];
    let c = getCellFromXY(ball.x, ball.y);
    targetBricks.push(getBrickAtCell(bricks, c.x, c.y - 1));
    targetBricks.push(getBrickAtCell(bricks, c.x, c.y + 1));
    targetBricks.push(getBrickAtCell(bricks, c.x - 1, c.y));
    targetBricks.push(getBrickAtCell(bricks, c.x + 1, c.y));
    targetBricks.push(getBrickAtCell(bricks, c.x, c.y));

    return targetBricks;
}

function handleSpeedUp() {
    if (numberOfBrickHits === 4 && gameSpeed < speed2) {
        gameSpeed = speed2;
    }
    else if (numberOfBrickHits === 12 && gameSpeed < speed3) {
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

function handleBallLost() {
    if (ball.isLost) {
        state = GameState.BALL_LOST;
    }
}

function handleLevelUp() {
    if (level < 2 && activeBricks().length <= 0) {
        state = GameState.LEVEL_UP;
    }
}

function handleGameOver() {
    const isGameOver =
        (lives <= 1 && state === GameState.BALL_LOST) ||
        (level >= 2 && activeBricks().length <= 0);

    state = isGameOver ? GameState.GAME_OVER : state;
}

function clearBackground() {
    ctx.fillStyle = "#00000055";
    ctx.fillRect(0, 0, fullWidth, fullHeight);
}

function drawBorders() {
    ctx.fillStyle = "#8E8E8E";
    ctx.fillRect(0, 0, borderWidth, fullHeight);
    ctx.fillRect(0, 0, fullWidth, borderWidth);
    ctx.fillRect(fullWidth-borderWidth, 0, borderWidth, fullHeight);
}

function touchEnd(e) {
    e.preventDefault();
    handleRestart();
}

function touchMove(e) {
    let xPos = e.changedTouches[0]?.pageX ?? 0;
    inputCenterX = map(xPos, 0, window.innerWidth, 0, gameAreaWidth);
}

function mouseMove(e) {
    e.preventDefault();
    inputCenterX = map(e.pageX, 0, window.innerWidth, 0, gameAreaWidth);
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
    score = 0;
    lives = 5;
    level = 1;
    gameSpeed = speed1;
    state = GameState.LAUNCHING;
}

function levelUp() {
    // keep much of current state (speed, bat size etc) on level up
    ball.reset();
    resetBricks();

    level++;
    state = GameState.LAUNCHING;
}

function newBall() {
    bat.reset();
    ball.reset();
    ball.isLost = false;

    lives--;
    numberOfBrickHits = 0;
    topRowsHasBeenHit = false;
    topWallHasBeenHit = false;
    gameSpeed = speed1;
    state = GameState.LAUNCHING;
}

function createBricks() {
    let bricks = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const x = col * brickWidth;
            const y = row * brickHeight;
            const color = getRowColor(row);
            const score = getRowScore(row);
            const isTopRow = row >= 4 && row <= 5;
            const active = row > 3;

            bricks.push(
                new Brick(
                    x, y,
                    brickWidth, brickHeight,
                    color, score, isTopRow, active));
        }
    }

    return bricks;
}

function resetBricks() {
    bricks.forEach(b => b.reset());
}

function getRowColor(rowNumber) {
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

function getRowScore(rowNumber) {
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

function getCellFromXY(x, y) {
    let col = Math.floor(x / brickWidth);
    let row = Math.floor(y / brickHeight);

    return new Point2d(col, row);
}

function getBrickAtCell(bricks, col, row) {
    return bricks[row * columns + col];
}

function activeBricks() {
    return bricks.filter(b => b?.active);
}

function clamp(value, min, max) {
    if (value > max) return max;
    if (value < min) return min;
    return value;
}

function map(value, inputMin, inputMax, outputMin, outputMax) {
    return (value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin;
}