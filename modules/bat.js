import Rectangle from "./rectangle.js";

export default class Bat {
    #isSmall = false;
    #standardWidth = 0;
    color;
    #rect;

    constructor(x, y, width, height, color="#D45345") {
        this.#standardWidth = width;
        this.color = color;

        this.#rect = new Rectangle(x, y, width, height);
    }

    get x() { return this.#rect.left; }
    set x(value) { this.#rect.left = value; }
    get y() { return this.#rect.top; }
    get width() { return this.#rect.width; }
    get isSmall() {return this.#isSmall;}
    get rectangle() { return this.#rect; }

    makeSmall() {
        this.#rect.width *= 2 / 3;
        this.#isSmall = true;
    }

    resetWidth() {
        this.#rect.width = this.#standardWidth;
        this.#isSmall = false;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.#rect.left, this.#rect.top, this.#rect.width, this.#rect.height);
    }
}