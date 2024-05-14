import { createCanvas } from "canvas";
import fs from "node:fs";
import Edge from "../pilkarzyki/Edge.js";
import Point from "../pilkarzyki/Point.js";
import BaseBoard from "../pilkarzyki/BaseBoard.js";

export default class Board extends BaseBoard {
	/**
	 * @type {number[][]}
	 */
	counted;
	/**
	 * @type {number[]}
	 */
	scores;

	/**
	 * 
	 * @param {number} spacing 
	 * @param {number} offsetX 
	 * @param {number} offsetY 
	 * @param {number} thickness 
	 * @param {string[]} uids 
	 * @param {string[]} usernames 
	 * @param {number} id 
	 */
	constructor(spacing, offsetX, offsetY, thickness, uids, usernames, id = 0) {
		super(spacing, offsetX, offsetY, thickness, uids, usernames, id);
		this.scores = [0, 0, 0];

		/** @type {import("../../../types.js").IUserSettings} */
		const settings = JSON.parse(fs.readFileSync("./data/userSettings.json", "utf-8"));
		this.colors = ["#5865f2", "#f04747"];

		for (let i = 0; i < this.uids.length; i++) {
			if (settings[this.uids[i]] !== undefined && settings[this.uids[i]].color !== undefined)
				this.colors[i] = settings[this.uids[i]].color;
		}

		this.canvas = createCanvas(this.offX * 2 + 3 * this.spacing, this.offY * 2 + 3 * this.spacing);
		this.ctx = this.canvas.getContext("2d");

		const points: Array<Point> = [];
		const pos = new Array(5);
		for (let i = 0; i < pos.length; i++)
			pos[i] = new Array(5);

		const counted = new Array(4); // WHAT IS COUNTED?????? WHAT DID I WRITE??? HOW THIS WORK???????????
		for (let i = 0; i < counted.length; i++)
			counted[i] = new Array(4);
		for (let i = 1; i <= 3; i++) {
			for (let j = 1; j <= 3; j++)
				counted[i][j] = 0;
		}
		this.counted = counted;

		let ind = 1;
		points.push(new Point(0, 0, 0, 0, 0, 0));
		for (let y = 1; y <= 4; y++) {
			for (let x = 1; x <= 4; x++) {
				pos[x][y] = ind;
				points.push(new Point(ind, x, y, this.spacing, this.offX, this.offY));
				ind++;
			}
		}
		this.pos = pos;
		this.points = points;

		this.edges = [];
	}

	draw() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.textAlign = "center";
		this.ctx.font = "20px Arial";
		this.ctx.lineWidth = this.thickness;

		// draw indexes
		this.ctx.fillStyle = "#fff";
		for (let i = 1; i <= 4; i++) {
			this.ctx.fillText(String.fromCharCode(i + 64), this.offX + (i - 1) * this.spacing, this.offY / 2);
			this.ctx.fillText(i.toString(), this.offX / 2, this.offY + (i - 1) * this.spacing + 5);
		}

		// draw points
		for (const point of this.points) {
			point.draw(this.ctx, this.thickness);
		}

		// draw edges
		for (const edge of this.edges) {
			edge.draw(this.ctx);
		}

		// some magic
		for (let y = 1; y <= 3; y++) {
			for (let x = 1; x <= 3; x++) {
				if (this.counted[x][y] == 0)
					continue;
				if (this.counted[x][y] == 1)
					this.ctx.fillStyle = this.colors[0];
				else
					this.ctx.fillStyle = this.colors[1];

				this.ctx.fillRect(this.offX + this.spacing * (x - 1), this.offY + this.spacing * (y - 1), this.spacing, this.spacing);
			}
		}

		const data = this.canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
		const buf = Buffer.from(data, "base64");
		fs.writeFileSync(`./tmp/boardKwadraty${this.id}.png`, buf);
	}

	/**
	 * 
	 * @param {string} mv 
	 * @returns 
	 */
	move(mv) {
		if (mv.length != 4)
			return false;

		mv = mv.toLowerCase();
		const ptA = mv.substring(0, 2);
		const ptB = mv.substring(2);

		if (!(["a", "b", "c", "d"].includes(ptA[0])) ||
            !(["a", "b", "c", "d"].includes(ptB[0])) ||
            !(["1", "2", "3", "4"].includes(ptA[1])) ||
            !(["1", "2", "3", "4"].includes(ptB[1])))
			return false;

		const pointA = new Point(0, ptA[0].charCodeAt(0) - 96, parseInt(ptA[1]), this.spacing, this.offX, this.offY);
		const pointB = new Point(0, ptB[0].charCodeAt(0) - 96, parseInt(ptB[1]), this.spacing, this.offX, this.offY);

		if (!(pointA.x == pointB.x || pointA.y == pointB.y) || Math.abs(pointA.x - pointB.x) > 1 || Math.abs(pointA.y - pointB.y) > 1)
			return false;

		if (this.points[this.pos[pointA.x][pointA.y]].edges.includes(this.pos[pointB.x][pointB.y]))
			return false;

		this.edges.push(new Edge(pointA, pointB, this.spacing, this.offX, this.offY));
		this.points[this.pos[pointA.x][pointA.y]].edges.push(this.pos[pointB.x][pointB.y]);
		this.points[this.pos[pointB.x][pointB.y]].edges.push(this.pos[pointA.x][pointA.y]);

		let added = false;
		for (let y = 1; y <= 3; y++) {
			for (let x = 1; x <= 3; x++) {
				if (this.counted[x][y] == 0 &&
                    this.points[this.pos[x][y]].edges.includes(this.pos[x + 1][y]) &&
                    this.points[this.pos[x + 1][y]].edges.includes(this.pos[x + 1][y + 1]) &&
                    this.points[this.pos[x + 1][y + 1]].edges.includes(this.pos[x][y + 1]) &&
                    this.points[this.pos[x][y + 1]].edges.includes(this.pos[x][y])) {
					added = true;
					this.counted[x][y] = this.turn + 1;
					this.scores[this.turn]++;
				}
			}
		}

		if (!added)
			this.turn = (this.turn + 1) % 2;
		if (this.edges.length >= 24)
			this.win = (this.scores[0] > this.scores[1] ? 0 : 1);


		return true;
	}

	removeBoard() {
		try {
			fs.unlinkSync("./tmp/boardKwadraty" + this.id + ".png");
		}
		catch (error) {
			console.log(error);
		}
	}
}
