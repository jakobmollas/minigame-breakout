export default class Vector2d {
    x = 0;
    y = 0;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static fromAngle(angle, length = 1) {
        return new Vector2d(length * Math.cos(angle), length * Math.sin(angle));
    };

    clone() {
        return new Vector2d(this.x, this.y);
    }

    get heading() {
        return Math.atan2(this.y, this.x);
    }

    setHeading(radians) {
        const magnitude = this.mag;
        this.x = Math.cos(radians) * magnitude;
        this.y = Math.sin(radians) * magnitude;
        return this;
    }

    get mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    static isHeadingBetween(heading, angle1, angle2) {
        return angle1 <= angle2
            ? angle2 - angle1 <= Math.PI
                ? angle1 <= heading && heading <= angle2
                : angle2 <= heading || heading <= angle1
            : angle1 - angle2 <= Math.PI
                ? angle2 <= heading && heading <= angle1
                : angle1 <= heading || heading <= angle2;
    }

    rotate(radians) {
        const newHeading = this.heading() + radians;
        return this.setHeading(newHeading);
    };

    add(other) {
        this.x += other.x || 0;
        this.y += other.y || 0;

        return this;
    }

    subtract(other) {
        this.x -= other.x || 0;
        this.y -= other.y || 0;

        return this;
    }

    multiply(length) {
        this.x *= length;
        this.y *= length;

        return this;
    }

    static multiply(vector, length) {
        return vector.clone().multiply(length);
    }

    invertX() {
        this.x = -this.x;
        return this;
    }

    invertY() {
        this.y = -this.y;
        return this;
    }

    invert() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }
}