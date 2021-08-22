import Vector2d from "./vector2d.js";

export default class Ball {
    #pos;
    #radius = 0;
    #direction;
    #initialHeading;
    isLost = false;
    color;

    constructor(x, y, radius, direction) {
        this.#pos = new Vector2d(x, y);
        this.#radius = radius;
        this.#direction = direction;
        this.#initialHeading = direction.heading;
    }

    get x() { return this.#pos.x; }
    set x(value) { this.#pos.x = value; }
    get y() { return this.#pos.y; }
    set y(value) { this.#pos.y = value; }
    get radius() { return this.#radius; }
    get heading() { return this.#direction.heading; }

    move(distance) {
        this.#pos.add(Vector2d.multiply(this.#direction, distance));
    }

    invertX() {
        this.#direction.invertX();
    }

    invertY() {
        this.#direction.invertY();
    }

    setHeading(heading) {
        this.#direction.setHeading(heading);
    }

    reset() {
        this.#direction.setHeading(this.#initialHeading);
        this.isLost = false;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.#pos.x, this.#pos.y, this.#radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}