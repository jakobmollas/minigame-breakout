import Point2d from "./point2d.js";

export default class Renderer {
    #stats;
    #ctx;
    #width;
    #height;

    constructor(stats, ctx, width, height) {
        this.#stats = stats;
        this.#ctx = ctx;
        this.#width = width;
        this.#height = height;
    }

    drawBackground() {
        this.#ctx.fillStyle = "#00000055";
        this.#ctx.fillRect(0, 0, this.#width, this.#height);
    }

    drawGameStats(score, lives) {
        this.#stats.innerHTML = "SCORE: " + score + " LIVES: " + lives;
    }

    drawLevelUp() {
        this.drawFancyOverlay("LEVEL UP");
    }

    drawBallLost() {
        this.drawFancyOverlay("BALL LOST");
    }

    drawGameOver() {
        this.drawFancyOverlay("GAME OVER");
    }

    drawFancyOverlay(text) {
        this.drawOverlay(3, text);
    }

    drawOverlay(sizeInRem, text) {
        this.#ctx.font = `${sizeInRem}rem 'Press Start 2P'`;
        this.#ctx.textAlign = "center";
        this.#ctx.textBaseline = 'middle';

        let c = this.getCenterCoordinates();
        
        this.#ctx.fillStyle = this.createGradient(c.y, 15);
        this.#ctx.fillText(text, c.x, c.y);
    }

    createGradient(yCenter, verticalOffset) {
        let g = this.#ctx.createLinearGradient(0, yCenter - verticalOffset, 0, yCenter + verticalOffset);
        g.addColorStop("0", "#D25444");
        g.addColorStop("0.2", "#D07137");
        g.addColorStop("1.0", "#3F4FCE");

        return g;
    }

    getCenterCoordinates() {
        return new Point2d(this.#width / 2, this.#height / 1.5);
    }
}