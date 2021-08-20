import Vector2d from "./vector2d.js"

const PointOfImpact = { NONE: 0, LEFT: 1, RIGHT: 2, TOP: 3, BOTTOM: 4 };

/* returns PointOfImpact */
function ballToInnerRectangle(ball, rectangle) {
    if (ball.x < ball.radius) return PointOfImpact.LEFT;
    if (ball.x > rectangle.width - ball.radius) return PointOfImpact.RIGHT;
    if (ball.y < ball.radius) return PointOfImpact.TOP;
    if (ball.y > rectangle.height - ball.radius) return PointOfImpact.BOTTOM;

    return PointOfImpact.NONE;
}

/* returns PointOfImpact */
function ballToRectangle(ball, rectangle) {
    if (!ballIntersectsRectangle(ball, rectangle))
        return PointOfImpact.NONE;

    const angles = getBallToRectangleAngles(ball, rectangle);

    // Compare (inverted) ball heading with angles calculated in previous step
    // to be able to determine at which side the ball hit the rectangle
    let invertedBallHeading = Vector2d.fromAngle(ball.heading).invert().heading;

    if (Vector2d.isHeadingBetween(invertedBallHeading, angles.a1, angles.a2)) return PointOfImpact.TOP;
    if (Vector2d.isHeadingBetween(invertedBallHeading, angles.a2, angles.a3)) return PointOfImpact.LEFT;
    if (Vector2d.isHeadingBetween(invertedBallHeading, angles.a3, angles.a4)) return PointOfImpact.BOTTOM;
    return PointOfImpact.RIGHT;
}

/**
* Divide rectangle into 4 angular sectors based on ball position 
* and all 4 rectangle corners, taking ball radius into consideration.
* @returns 4 angles, counter-clockwise starting at upper right corner.
*/
function getBallToRectangleAngles(ball, rectangle) {
    const b = ball;
    const r = rectangle;

    const a1 = new Vector2d(r.right + b.radius, r.top - b.radius).subtract(b).heading;
    let a2 = new Vector2d(r.left - b.radius, r.top - b.radius).subtract(b).heading;
    const a3 = new Vector2d(r.left - b.radius, r.bottom + b.radius).subtract(b).heading;
    const a4 = new Vector2d(r.right + b.radius, r.bottom + b.radius).subtract(b).heading;

    // edge case - if ball is exactly aligned with rectangle top, 
    // angle a1-a2 will be positive 0-PI, negate sign in that case
    a2 = b.y === (r.top - b.radius) ? -a2 : a2;

    return { a1, a2, a3, a4 };
}

/**
 * Check if a ball/circle intersects/overlaps a rectangle in any way, 
 * taking ball radius into consideration.
 * @returns true if ball intersects rectangle
 */
function ballIntersectsRectangle(ball, rectangle) {
    const halfWidth = rectangle.width / 2;
    const halfHeight = rectangle.height / 2;

    let distX = Math.abs(ball.x - (rectangle.left + halfWidth));
    let distY = Math.abs(ball.y - (rectangle.top + halfHeight));

    // Out of bounds completely?
    if (distX > (halfWidth + ball.radius) ||
        distY > (halfHeight + ball.radius)) {
        return false;
    }

    // Clean horizontal/vertical intersection?
    if (distX <= (halfWidth + ball.radius) ||
        distY <= (halfHeight + ball.radius)) {
        return true;
    }

    let cornerDistance_sq =
        Math.pow((distX - halfWidth), 2) +
        Math.pow((distY - halfHeight), 2);

    // Intersection at corner?
    return cornerDistance_sq <= ball.radius * ball.radius;
}

export { PointOfImpact };
export default { ballToInnerRectangle, ballToRectangle, PointOfImpact };