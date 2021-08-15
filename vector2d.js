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

    heading() {
        return Math.atan2(this.y, this.x);
    }

    setHeading(radians) {
        const magnitude = this.mag();
        this.x = Math.cos(radians) * magnitude;
        this.y = Math.sin(radians) * magnitude;
        return this;
    }

    mag() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }

    rotate(radians) {
        let newHeading = this.heading() + radians;
        return this.setHeading(newHeading);
        // const magnitude = this.mag();
        // this.x = Math.cos(newHeading) * magnitude;
        // this.y = Math.sin(newHeading) * magnitude;
        
        //return this;
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

