'use strict'

class Brick {
    #left = 0;
    #right = 0;
    #top = 0;
    #bottom = 0;
    #width = 0;
    #height = 0;
    #color = "";
    active = false;

    constructor(left, top, width, height, color, active) {
        this.#left = left;
        this.#right = left + width;
        this.#top = top;
        this.#bottom = top + height;
        this.#width = width;
        this.#height = height;
        this.#color = color;
        this.active = active;
    }

    get left() { return this.#left; }
    get right() { return this.#right; }
    get top() { return this.#top; }
    get bottom() { return this.#bottom; }
    get width() { return this.#width; }
    get height() { return this.#height; }
    get color() { return this.#color; }
}