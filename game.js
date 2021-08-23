import Ball from './modules/ball.js';
import Bat from './modules/bat.js';
import Brick from './modules/brick.js';
import GameTime from './modules/gametime.js';
import UiRenderer from './modules/ui-renderer.js';
import Point2d from './modules/point2d.js';
import Rectangle from './modules/rectangle.js';
import { default as Collisions, PointOfImpact } from './modules/collisions.js';
import * as Constants from './modules/constants.js';
import * as Colors from "./modules/colors.js";

const GameState = { LAUNCHING: 0, RUNNING: 1, LEVEL_UP: 2, BALL_LOST: 3, GAME_OVER: 4 };
const gameTime = new GameTime();

let ball, bat, bricks;
let score, lives, gameSpeed, level, gameState;
let numberOfBrickHits, topWallHasBeenHit, topRowsHasBeenHit;
let ctx, uiRenderer;
let inputCenterX = 0;

window.onload = function () {
    ctx = setupCanvasContext();
    uiRenderer = new UiRenderer(ctx, Constants.fullWidth, Constants.fullHeight);

    document.addEventListener("touchmove", touchMove);
    document.addEventListener("touchend", touchEnd);
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mousedown", mouseDown);

    createGameObjects();
    startNewGame();

    window.requestAnimationFrame(mainLoop);
}

function setupCanvasContext() {
    let canvas = document.getElementById("game-canvas");
    canvas.width = Constants.fullWidth;
    canvas.height = Constants.fullHeight;

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
    if (gameState === GameState.LAUNCHING || gameState === GameState.RUNNING) {
        moveBat();
        moveBall();
        updateBallColor();
    }

    if (gameState === GameState.RUNNING) {
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
    ctx.translate(Constants.borderWidth, Constants.borderWidth);
    bricks.forEach(b => b?.draw(ctx));
    bat.draw(ctx);
    ball.draw(ctx);
    ctx.restore();

    uiRenderer.drawGameStats(score, lives);

    switch (gameState) {
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
    bat.x = clamp(inputCenterX - bat.width / 2, 0, Constants.gameAreaWidth - bat.width)
}

function moveBall() {
    if (gameState === GameState.RUNNING) {
        ball.move(gameSpeed * gameTime.deltaTimeFactor);
        return;
    }

    positionBallOnTopOfBat(ball, bat);
}

function updateBallColor() {
    // Match color of bricks at current row
    const rowNumber = getBrickCoordsFromGameAreaXY(ball.x, ball.y).y;
    ball.color = getRowColor(rowNumber);
}

function positionBallOnTopOfBat(ball, bat) {
    ball.x = bat.x + bat.width / 2;
    ball.y = bat.y - ball.radius;
}

function handleBallToWallCollision() {
    const gameArea = new Rectangle(0, 0, Constants.gameAreaWidth, Constants.gameAreaHeight);
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
    ball.x = clamp(ball.x, ball.radius, Constants.gameAreaWidth - ball.radius);
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
        brick.hit();

        return;
    }
}

/**
 * Try get bricks at ball position plus above/below/left/right
 */
function getBricksAtBallPosition(ball, bricks) {
    let targetBricks = [];
    let bc = getBrickCoordsFromGameAreaXY(ball.x, ball.y);

    let above = getBrickAtCell(bricks, bc.x, bc.y - 1);
    let below = getBrickAtCell(bricks, bc.x, bc.y + 1);
    let left = getBrickAtCell(bricks, bc.x - 1, bc.y);
    let right = getBrickAtCell(bricks, bc.x + 1, bc.y);
    let center = getBrickAtCell(bricks, bc.x, bc.y);

    if (above) targetBricks.push(above);
    if (below) targetBricks.push(below);
    if (left) targetBricks.push(left);
    if (right) targetBricks.push(right);
    if (center) targetBricks.push(center);

    return targetBricks;
}

function handleSpeedUp() {
    if (numberOfBrickHits === 4 && gameSpeed < Constants.speed2) {
        gameSpeed = Constants.speed2;
    }
    else if (numberOfBrickHits === 12 && gameSpeed < Constants.speed3) {
        gameSpeed = Constants.speed3;
    }
    else if (topRowsHasBeenHit && gameSpeed < Constants.speed4) {
        gameSpeed = Constants.speed4;
    }
}

function handleBatSize() {
    if (topWallHasBeenHit && !bat.isSmall) {
        bat.makeSmall();
    }
}

function handleBallLost() {
    if (ball.isLost) {
        gameState = GameState.BALL_LOST;
    }
}

function handleLevelUp() {
    if (level < 2 && activeBricks().length <= 0) {
        gameState = GameState.LEVEL_UP;
    }
}

function handleGameOver() {
    const isGameOver =
        (lives <= 1 && gameState === GameState.BALL_LOST) ||
        (level >= 2 && activeBricks().length <= 0);

    gameState = isGameOver ? GameState.GAME_OVER : gameState;
}

function clearBackground() {
    ctx.fillStyle = Colors.background;
    ctx.fillRect(0, 0, Constants.fullWidth, Constants.fullHeight);
}

function drawBorders() {
    ctx.fillStyle = Colors.border;
    ctx.fillRect(0, 0, Constants.borderWidth, Constants.fullHeight);
    ctx.fillRect(0, 0, Constants.fullWidth, Constants.borderWidth);
    ctx.fillRect(Constants.fullWidth - Constants.borderWidth, 0, Constants.borderWidth, Constants.fullHeight);
}

function touchEnd(e) {
    e.preventDefault();
    handleRestart();
}

function touchMove(e) {
    let xPos = e.changedTouches[0]?.pageX ?? 0;
    inputCenterX = map(xPos, 0, window.innerWidth, 0, Constants.gameAreaWidth);
}

function mouseMove(e) {
    e.preventDefault();
    inputCenterX = map(e.pageX, 0, window.innerWidth, 0, Constants.gameAreaWidth);
}

function mouseDown(e) {
    e.preventDefault();
    handleRestart();
}

function handleRestart() {
    switch (gameState) {
        case GameState.LAUNCHING:
            gameState = GameState.RUNNING;
            break;

        case GameState.LEVEL_UP:
            levelUp();
            break;

        case GameState.BALL_LOST:
            nextBall();
            break;

        case GameState.GAME_OVER:
            startNewGame();
            return;
    }
}

function createGameObjects() {
    ball = new Ball(0, 0, Constants.ballRadius, Constants.initialBallDirection);

    bat = new Bat(
        Constants.gameAreaWidth / 2 - Constants.batWidth / 2,
        Constants.gameAreaHeight - 2 * Constants.batHeight,
        Constants.batWidth,
        Constants.batHeight,
        Colors.bat);

    bricks = createBricks();
}

function startNewGame() {
    score = 0;
    lives = 5;
    level = 1;

    prepareNextBall();
}

function levelUp() {
    // keep speed, bat size etc. on level up
    ball.reset();
    resetBricks();

    level++;
    gameState = GameState.LAUNCHING;
}

function nextBall() {
    lives--;
    prepareNextBall();
}

function prepareNextBall() {
    bat.reset();
    ball.reset();

    numberOfBrickHits = 0;
    topRowsHasBeenHit = false;
    topWallHasBeenHit = false;
    gameSpeed = Constants.speed1;
    gameState = GameState.LAUNCHING;
}

function createBricks() {
    let bricks = [];
    for (let row = 0; row < Constants.rows; row++) {
        for (let col = 0; col < Constants.columns; col++) {
            const x = col * Constants.brickWidth;
            const y = row * Constants.brickHeight;
            const color = getRowColor(row);
            const score = getRowScore(row);
            const isTopRow = row < 2;

            const brick = row > 3
                ? new Brick(x, y,
                    Constants.brickWidth, Constants.brickHeight,
                    color, score, isTopRow)
                : null;

            bricks.push(brick);
        }
    }

    return bricks;
}

function resetBricks() {
    bricks.forEach(b => b?.reset());
}

function getRowColor(rowNumber) {
    switch (rowNumber) {
        case 4: return Colors.brick1;
        case 5: return Colors.brick2;
        case 6: return Colors.brick3;
        case 7: return Colors.brick4;
        case 8: return Colors.brick5;
        case 9: return Colors.brick6;

        default: return Colors.brick1;
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

function getBrickCoordsFromGameAreaXY(x, y) {
    let col = Math.floor(x / Constants.brickWidth);
    let row = Math.floor(y / Constants.brickHeight);

    return new Point2d(col, row);
}

function getBrickAtCell(bricks, col, row) {
    return bricks[row * Constants.columns + col];
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