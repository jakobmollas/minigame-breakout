'use strict'

class Bat {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    #isSmall = false;

    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get isSmall() {
        return this.#isSmall;
    }

    makeSmall() {
        this.width *= 2/3;
        this.#isSmall = true;
    }
}