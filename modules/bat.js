import Rectangle from "./rectangle.js";

export default class Bat extends Rectangle {
    #isSmall = false;
    #standardWidth = 0;
    color;

    constructor(left, top, width, height, color="#D45345") {
        super(left, top, width, height);
        this.#standardWidth = width;
        this.color = color;
    }

    get isSmall() {
        return this.#isSmall;
    }

    makeSmall() {
        this.width *= 2 / 3;
        this.#isSmall = true;
    }

    resetWidth() {
        this.width = this.#standardWidth;
        this.#isSmall = false;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.left, this.top, this.width, this.height);
    }
}