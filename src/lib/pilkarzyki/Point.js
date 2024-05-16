export default class Point {
    /** @type {number} */
    index;
    /** @type {number} */
    x;
    /** @type {number} */
    y;
    /** @type {number} */
    spacing;
    /** @type {number} */
    offX;
    /** @type {number} */
    offY;
    /** @type {boolean} */
    border;
    /** @type {boolean} */
    outside;
    /** @type {number[]} */
    edges = [];
    color = "#fff";

    /**
     *
     * @param {number} index
     * @param {number} x
     * @param {number} y
     * @param {number} spacing
     * @param {number} offsetX
     * @param {number} offsetY
     * @param {string} color
     * @param {boolean} border
     * @param {boolean} outside
     */
    constructor(
        index,
        x,
        y,
        spacing,
        offsetX,
        offsetY,
        color = "#fff",
        border = false,
        outside = false,
    ) {
        this.index = index;
        this.x = x;
        this.y = y;
        this.spacing = spacing;
        this.offX = offsetX;
        this.offY = offsetY;
        this.color = color;
        this.border = border;
        this.outside = outside;
    }

    /**
     *
     * @param {*} ctx
     * @param {number} thickness
     * @returns
     */
    draw(ctx, thickness) {
        if (this.outside) return;

        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.offX + this.spacing * (this.x - 1) - thickness / 2,
            this.offY + this.spacing * (this.y - 1) - thickness / 2,
            thickness,
            thickness,
        );
    }
}
