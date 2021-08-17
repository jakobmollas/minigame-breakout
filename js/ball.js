'use strict'

class Ball {
    pos;
    #radius = 0;
    #direction;
    numberOfBrickHits = 0;
    topWallHasBeenHit = false;
    topRowsHasBeenHit = false;

    constructor(x, y, radius, direction) {
        this.pos = new Vector2d(x, y);
        this.#radius = radius;
        this.#direction = direction;
    }

    get x() {
        return this.pos.x;
    }

    set x(value) {
        this.pos.x = value;
    }

    get y() {
        return this.pos.y;
    }

    set y(value) {
        this.pos.y = value;
    }

    get radius() {
        return this.#radius;
    }

    get heading() {
        return this.#direction.heading;
    }

    move(distance) {
        this.pos.add(Vector2d.mult(this.#direction, distance));
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
}