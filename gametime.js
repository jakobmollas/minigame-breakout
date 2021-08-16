'use strict'

class GameTime {
    deltaTime = 0;
    deltaTimeFactor = 0;
    fps = 0;
    lastTimestamp = 0;

    constructor() {
    }

    update() {
        this.deltaTime = this.lastTimestamp ? performance.now() - this.lastTimestamp : 0;
        this.lastTimestamp = performance.now();
        this.deltaTimeFactor = this.deltaTime > 0 ? 1 / this.deltaTime : 0;
        this.fps = this.deltaTime > 0 ? 1000 / this.deltaTime : 0;
    }
}