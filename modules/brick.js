import Rectangle from "./rectangle.js";

export default class Brick extends Rectangle {
    #column = 0;
    #row = 0;
    #color = "";
    #score = 0;
    #isTopRow = false;
    active = false;

    constructor(left, top, width, height, column, row, color, score, isTopRow, active) {
        super(left, top, width, height);

        this.#column = column;
        this.#row = row;
        this.#color = color;
        this.#score = score;
        this.#isTopRow = isTopRow;
        this.active = active;
    }

    get column() { return this.#column; }
    get row() { return this.#row; }
    get color() { return this.#color; }
    get score() { return this.#score; }
    get isTopRow() { return this.#isTopRow; }
}