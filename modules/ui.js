import * as Colors from "./colors.js";

function drawGameStats(ctx, score, lives) {
    setFont(ctx, 1);

    let x = ctx.canvas.width / 2;
    let y = 30;

    ctx.fillStyle = Colors.statsText;
    ctx.fillText("SCORE: " + score + "   LIVES: " + lives, x, y);
}

function drawLevelUp(ctx) {
    drawGameMessage(ctx, "LEVEL UP");
}

function drawBallLost(ctx) {
    drawGameMessage(ctx, "BALL LOST");
}

function drawGameOver(ctx) {
    drawGameMessage(ctx, "GAME OVER");
}

function drawGameMessage(ctx, text) {
    setFont(ctx, 3);

    let x = ctx.canvas.width / 2;
    let y = ctx.canvas.height / 1.5;
    ctx.fillStyle = createGradient(ctx, y);
    ctx.fillText(text, x, y);
}

function createGradient(ctx, yCenter) {
    let g = ctx.createLinearGradient(0, yCenter - 20, 0, yCenter + 20);
    g.addColorStop("0", Colors.messageGradient1);
    g.addColorStop("0.45", Colors.messageGradient2);
    g.addColorStop("0.45", Colors.messageGradient3);
    g.addColorStop("1.0", Colors.messageGradient4);

    return g;
}

function setFont(ctx, sizeInRem) {
    ctx.font = `${sizeInRem}rem 'Press Start 2P'`;
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle';
}

export default { drawGameStats, drawLevelUp, drawBallLost, drawGameOver };