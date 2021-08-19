import Vector2d from "./vector2d.js"

const PointOfImpact = { "NONE": 0, "LEFT": 1, "RIGHT": 2, "TOP": 3, "BOTTOM": 4 };

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
    if (!intersects(ball, ball.radius, rectangle))
        return PointOfImpact.NONE;

    const radius = ball.radius;
    const r = rectangle;

    // Divide rectangle into 4 angular sectors based on ball position 
    // and all 4 rectangle corners, taking ball radius into consideration,
    // these are used to determine collision direction.
    // Vectors are calculated counter-clockwise starting at upper right corner.
    let h1 = new Vector2d(r.right + radius, r.top - radius).subtract(ball).heading;
    let h2 = new Vector2d(r.left - radius, r.top - radius).subtract(ball).heading;
    let h3 = new Vector2d(r.left - radius, r.bottom + radius).subtract(ball).heading;
    let h4 = new Vector2d(r.right + radius, r.bottom + radius).subtract(ball).heading;

    // edge case - if ball is exactly aligned with rectangle top, 
    // h1/h2 angle will be positive 0-PI, negate in that case
    h2 = ball.y === (r.top - radius) ? -h2 : h2;

    let invertedBallHeading = Vector2d.fromAngle(ball.heading).invert().heading;
    if (Vector2d.isHeadingBetween(invertedBallHeading, h1, h2)) return PointOfImpact.TOP;
    if (Vector2d.isHeadingBetween(invertedBallHeading, h2, h3)) return PointOfImpact.LEFT;
    if (Vector2d.isHeadingBetween(invertedBallHeading, h3, h4)) return PointOfImpact.BOTTOM;
    else return PointOfImpact.RIGHT;
}

function intersects(ball, radius, rectangle) {
    const halfWidth = rectangle.width / 2;
    const halfHeight = rectangle.height / 2;

    let distX = Math.abs(ball.x - (rectangle.left + halfWidth));
    let distY = Math.abs(ball.y - (rectangle.top + halfHeight));

    if (distX > (halfWidth + radius) ||
        distY > (halfHeight + radius)) {
        return false;
    }

    if (distX <= (halfWidth + radius) ||
        distY <= (halfHeight + radius)) {
        return true;
    }

    let cornerDistance_sq =
        Math.pow((distX - halfWidth), 2) +
        Math.pow((distY - halfHeight), 2);

    return cornerDistance_sq <= radius * radius;
}

export {PointOfImpact};
export default {ballToInnerRectangle, ballToRectangle, PointOfImpact};