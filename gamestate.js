'use strict'

class GameState {
    bat;
    ball;
    ballDirection;
    batWidth;
    score;
    lives;
    gameSpeed;
    level;
    numberOfHits;
    topWallHasBeenHit;
    topRowsHasBeenHit;
    gameOver;
    running;
    bricks = [];

    constructor() {
        this.initialize();
    }

    initialize() {
        batWidth = batLargeWidth;
        bat = new Point2d(width / 2 - batWidth / 2, height - 2 * batHeight);
        ball = new Vector2d(bat.x + batWidth / 2, bat.y - ballRadius);
        ballDirection = new Vector2d(0.7, -1);
        score = 0;
        lives = 5;
        gameSpeed = speed1;
        level = 1;
        numberOfHits = 0;
        topWallHasBeenHit = false;
        topRowsHasBeenHit = false;
        gameOver = false;
        running = false;
    
        bricks = createBricks();
    }
}