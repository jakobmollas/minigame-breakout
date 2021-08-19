export default class Rectangle {
    left = 0;
    top = 0;
    width = 0;
    height = 0;

    constructor(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }

    get right() { return this.left + this.width; }
    get bottom() { return this.top + this.height; }
}