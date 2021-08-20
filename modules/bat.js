import Rectangle from "./rectangle.js";

export default class Bat extends Rectangle {
    #isSmall = false;
    #standardWidth = 0;

    constructor(left, top, width, height) {
        super(left, top, width, height);
        this.#standardWidth = width;
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
}