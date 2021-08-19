export default class GameTime {
    #deltaTime = 0;
    #deltaTimeFactor = 0;
    #fps = 0;
    #lastTimestamp = 0;

    constructor() {
    }

    update() {
        this.#deltaTime = this.#lastTimestamp ? performance.now() - this.#lastTimestamp : 0;
        this.#lastTimestamp = performance.now();
        this.#deltaTimeFactor = this.#deltaTime / 1000;
        this.#fps = this.#deltaTime > 0 ? 1000 / this.#deltaTime : 0;
    }

    get deltaTime() {
        return this.#deltaTime;
    }

    get deltaTimeFactor() {
        return this.#deltaTimeFactor;
    }

    get fps() {
        return this.#fps;
    }
}