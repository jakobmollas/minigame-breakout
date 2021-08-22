import Rectangle from "./rectangle.js";

export default class Brick  {
    #color = "";
    #score = 0;
    #isTopRow = false;
    active = false;
    #rect;

    constructor(x, y, width, height, color, score, isTopRow, active = true) {
        this.#rect = new Rectangle(x, y, width, height);
        this.#color = color;
        this.#score = score;
        this.#isTopRow = isTopRow;
        this.active = active;
    }

    get color() { return this.#color; }
    get score() { return this.#score; }
    get isTopRow() { return this.#isTopRow; }
    get rectangle() { return this.#rect; }

    reset() {
        this.active = true;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.fillStyle = this.#color;
        ctx.fillRect(this.#rect.left, this.#rect.top, this.#rect.width - 1, this.#rect.height - 1);
    }
}