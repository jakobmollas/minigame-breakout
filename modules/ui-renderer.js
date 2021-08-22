import Point2d from "./point2d.js";

export default class UiRenderer {
    #ctx;
    #width;
    #height;

    constructor(ctx, width, height) {
        this.#ctx = ctx;
        this.#width = width;
        this.#height = height;
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

    drawGameStats(score, lives) {
        this.setFont(this.#ctx, 1);

        let x = this.getCenterCoordinates().x;
        let y = 30;
        
        this.#ctx.fillStyle = "#8E8E8E";
        this.#ctx.fillText("SCORE: " + score + "   LIVES: " + lives, x, y);
    }

    drawFancyOverlay(text) {
        this.setFont(this.#ctx, 3);

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

    setFont(ctx, sizeInRem) {
        ctx.font = `${sizeInRem}rem 'Press Start 2P'`;
        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';
    }

    getCenterCoordinates() {
        return new Point2d(this.#width / 2, this.#height / 1.5);
    }
}