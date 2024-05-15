import Point from "./Point.js";

export default class Edge {
	/** @type {number} */
	// @ts-expect-error
	index;
	/** @type {Point} */
	pointA;
	/** @type {Point} */
	pointB;
	/** @type {number} */
	spacing;
	/** @type {number} */
	offX;
	/** @type {number} */
	offY;
	color = "#fff";

	/**
	 * 
	 * @param {Point} pointA 
	 * @param {Point} pointB 
	 * @param {number} spacing 
	 * @param {number} offsetX 
	 * @param {number} offsetY 
	 * @param {string} color 
	 */
	constructor(pointA, pointB, spacing, offsetX, offsetY, color = "#fff") {
		this.pointA = pointA;
		this.pointB = pointB;
		this.spacing = spacing;
		this.offX = offsetX;
		this.offY = offsetY;
		this.color = color;
	}

	/**
	 * 
	 * @param {*} ctx 
	 */
	draw(ctx) {
		ctx.strokeStyle = this.color;
		ctx.beginPath();
		ctx.moveTo(this.offX + this.spacing * (this.pointA.x - 1), this.offY + this.spacing * (this.pointA.y - 1));
		ctx.lineTo(this.offX + this.spacing * (this.pointB.x - 1), this.offY + this.spacing * (this.pointB.y - 1));
		ctx.stroke();
	}
}
