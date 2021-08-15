'use strict'

// uses radians

class Vector2d {
    x = 0;
    y = 0;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static fromAngle(angle, length = 1) {
        return new Vector2d(length * Math.cos(angle), length * Math.sin(angle), 0);
    };

    add(other) {
        this.x += other.x || 0;
        this.y += other.y || 0;

        return this;
    }

    invertX() {
        this.x = -this.x;
        return this;
    }

    invertY() {
        this.y = -this.y;
        return this;
    }
}

