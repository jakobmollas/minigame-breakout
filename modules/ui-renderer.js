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

    drawGameStats(score, lives) {
        this.setFont(this.#ctx, 1);

        let x = this.#width / 2;
        let y = 30;
        
        this.#ctx.fillStyle = "#8E8E8E";
        this.#ctx.fillText("SCORE: " + score + "   LIVES: " + lives, x, y);
    }

    drawLevelUp() {
        this.drawGameMessage("LEVEL UP");
    }

    drawBallLost() {
        this.drawGameMessage("BALL LOST");
    }

    drawGameOver() {
        this.drawGameMessage("GAME OVER");
    }

    drawGameMessage(text) {
        this.setFont(this.#ctx, 3);

        let x = this.#width / 2;
        let y = this.#height / 1.5;
        this.#ctx.fillStyle = this.createGradient(y, 15);
        this.#ctx.fillText(text, x, y);
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
}