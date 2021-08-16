'use strict'

class Brick {
    #left = 0;
    #right = 0;
    #top = 0;
    #bottom = 0;
    #width = 0;
    #height = 0;
    #column = 0;
    #row = 0;
    #color = "";
    #score = 0;
    active = false;

    constructor(left, top, width, height, column, row, color, score, active) {
        this.#left = left;
        this.#right = left + width;
        this.#top = top;
        this.#bottom = top + height;
        this.#width = width;
        this.#height = height;
        this.#column = column;
        this.#row = row;
        this.#color = color;
        this.#score = score;
        this.active = active;
    }

    get left() { return this.#left; }
    get right() { return this.#right; }
    get top() { return this.#top; }
    get bottom() { return this.#bottom; }
    get width() { return this.#width; }
    get column() { return this.#column; }
    get row() { return this.#row; }
    get height() { return this.#height; }
    get color() { return this.#color; }
    get score() { return this.#score; }
}