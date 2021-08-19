export default class Bat {
    x = 0;
    y = 0;
    #width = 0;
    #height = 0;
    #isSmall = false;
    #standardWidth = 0;

    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.#standardWidth = width;
        this.#width = width;
        this.#height = height;
    }

    get isSmall() {
        return this.#isSmall;
    }

    get width() {
        return this.#width;
    }

    get height() {
        return this.#height;
    }

    makeSmall() {
        this.#width *= 2/3;
        this.#isSmall = true;
    }

    resetWidth() {
        this.#width = this.#standardWidth;
        this.#isSmall = false;
    }
}