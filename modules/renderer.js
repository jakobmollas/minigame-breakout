export default class Renderer {
    #stats;
    #ctx;
    #canvas;

    constructor(stats, context) {
        this.#stats = stats;
        this.#ctx = context;
        this.#canvas = context.canvas;
    }

    drawBackground() {
        this.#ctx.fillStyle = "#00000055";
        this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
    }
    
    drawBricks(bricks) {
        for (let brick of bricks.filter(b => b?.active)) {
            this.#ctx.fillStyle = brick.color;
            this.#ctx.fillRect(brick.left, brick.top, brick.width - 1, brick.height - 1);
        }
    }
    
    drawBat(bat) {
        this.#ctx.fillStyle = "#D45345";
        this.#ctx.fillRect(bat.left, bat.top, bat.width, bat.height);
    }
    
    drawBall(ball, getBallColor) {
        this.#ctx.fillStyle = getBallColor(ball);
        this.#ctx.beginPath();
        this.#ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
        this.#ctx.fill();
    }
    
    drawGameStats(score, lives) {
        this.#stats.innerHTML = "SCORE: " + score + " LIVES: " + lives;
    }
    
    drawLevelUp() {
        this.drawOverlay("LEVEL UP");
    }
    
    drawBallLost() {
        this.drawOverlay("BALL LOST");
    }
    
    drawGameOver() {
        this.drawOverlay("GAME OVER");
    }
    
    drawOverlay(text) {
        this.#ctx.font = "3rem 'Press Start 2P'";
        this.#ctx.textAlign = "center";
        this.#ctx.textBaseline = 'middle';
    
        let x = this.#canvas.width / 2;
        let y = this.#canvas.height / 1.5;
    
        var g = this.#ctx.createLinearGradient(0, y - 15, 0, y + 15);
        g.addColorStop("0", "#D25444");
        g.addColorStop("0.2", "#D07137");
        g.addColorStop("1.0", "#3F4FCE");
        
        this.#ctx.fillStyle = g;
        this.#ctx.fillText(text, x, y);
    }
}