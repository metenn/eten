import Point from "./Point.js";
import Edge from "./Edge.js";
import fs from "node:fs";

export default class BaseBoard {
	id = 0;
	/** @type {string[]} */
	remis = [];
	/** @type {string[]} */
	usernames = [];
	/** @type {string[]} */
	uids = [];
	turn = 0;
	win = -1;
	/** @type {number} */
	thickness;
	/** @type {number} */
	spacing;
	/** @type {number} */
	offX;
	/** @type {number} */
	offY;
	/** @type {string[]} */
	colors = [];
	/** @type {Point} */
	// @ts-expect-error
	ball;
	/** @type {import("canvas").Canvas} */
	// @ts-expect-error
	canvas;
	/** @type {import("canvas").CanvasRenderingContext2D} */
	// @ts-expect-error
	ctx;
	/** @type {Point[]} */
	points = [];
	/** @type {Edge[]} */
	edges = [];
	/** @type {number[][]} */
	pos = [];
	directions = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
	/** @type {import("discord.js").Message|undefined} */
	message;
	totalMoves = 0;
	/** @type {import("../../../types.js").ILongestMove} */
	longestMove = {};
	currMoveLen = 0;

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
		this.spacing = spacing;
		this.offX = offsetX;
		this.offY = offsetY;
		this.thickness = thickness;
		this.uids = uids;
		this.usernames = usernames;
		this.id = id;
	}

	/**
	 * Get indexes of this.directions which are legal moves from given position.
	 * @param {number} x x coordinate of the position
	 * @param {number} y y coordinate of the position
	 * @returns {number[]} Array of indexes of this.directions. If index exists in the returned array, it is possible to move there
	 */
	possibleMovesIndexes(x = this.ball.x, y = this.ball.y) {
		const moves = [];

		for (let i = 0; i < this.directions.length; i++) {
			const dir = this.directions[i];
			if (!this.points[this.pos[x][y]].edges.includes(this.pos[x + dir[0]][y + dir[1]]))
				moves.push(i);
		}

		return moves;
	}

	/**
	 * Get ids of Point which are legal to move on from given position
	 * @param {number} x x coordinate of the position
	 * @param {number} y y coordinate of the position
	 * @returns {number[]} Array of ids of Points, which are a legal move
	 */
	possibleMoves(x = this.ball.x, y = this.ball.y) {
		const indexes = this.possibleMovesIndexes(x, y);
		const moves = [];
		for (const index of indexes)
			moves.push(this.pos[x + this.directions[index][0]][y + this.directions[index][1]]);

		return moves;
	}

	/**
	 * 
	 * @param {number} begX 
	 * @param {number} begY 
	 * @param {number} endX 
	 * @param {number} endY 
	 * @param {string} uid 
	 * @returns {import("canvas").CanvasGradient | undefined}
	 */
	getGradient(begX, begY, endX, endY, uid) {
		const settings = /** @type {import("../../../types.js").IUserSettings} */ (JSON.parse(fs.readFileSync("./data/userSettings.json", "utf8")));

		if (settings[uid] === undefined || settings[uid].gradient === undefined)
			return undefined;

		const grd = this.ctx.createLinearGradient(begX, begY, endX, endY);
		// @ts-expect-error
		if (settings[uid].gradient.special == "rainbow") {
			grd.addColorStop(0, "red");
			grd.addColorStop(1 / 6, "orange");
			grd.addColorStop(2 / 6, "yellow");
			grd.addColorStop(3 / 6, "green");
			grd.addColorStop(4 / 6, "blue");
			grd.addColorStop(5 / 6, "violet");
			grd.addColorStop(1, "rgba(127,0,255,0)");
		}
		// @ts-expect-error
		else if (settings[uid].gradient.special == "random") {
			let color = Math.floor(Math.random() * 16777215);
			if (color < 0)
				color = 0;
			if (color > 16777215)
				color = 16777215;

			grd.addColorStop(0, "#" + color.toString(16).padStart(6, "0"));
			grd.addColorStop(1, "rgba(" + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", 0)");
		}
		else {
			// @ts-expect-error
			grd.addColorStop(0, settings[this.uids[0]]["gradient"]["from"]);
			// @ts-expect-error
			grd.addColorStop(1, settings[this.uids[0]]["gradient"]["to"]);
		}

		return grd;
	}

	/**
	 * @returns {string}
	 */
	get turnUID() {
		return this.uids[this.turn];
	}

	/**
	 * 
	 * @param {string} file 
	 */
	save(file) {
		const data =
            JSON.stringify(this.points) + "\n#\n" +
            JSON.stringify(this.pos) + "\n#\n" +
            JSON.stringify(this.edges) + "\n#\n" +
            JSON.stringify(this.ball) + "\n#\n" +
            JSON.stringify(this.turn) + "\n#\n";

		fs.writeFileSync(file, data);
	}

	/**
	 * 
	 * @param {string} file 
	 */
	load(file) {
		const data = fs.readFileSync(file, { encoding: "utf8" }).split("#");

		this.points = JSON.parse(data[0]);
		this.pos = JSON.parse(data[1]);
		this.edges = JSON.parse(data[2]);
		this.ball = JSON.parse(data[3]);
		this.turn = JSON.parse(data[4]);
	}

	/**
	 * 
	 * @param {boolean[][][]} graph 
	 */
	loadFromGraph(graph) {
		for (let x = 1; x <= 11; x++) {
			for (let y = 1; y <= 7; y++) {
				for (const i in this.directions) {
					if (graph[x][y][i] === null)
						break;
					if (!graph[x][y][i])
						continue;

					const dir = this.directions[i];
					const nX = x + dir[0];
					const nY = y + dir[1];

					this.points[this.pos[x][y]].edges.push(this.pos[nX][nY]);
					this.edges.push(new Edge(this.points[this.pos[x][y]], this.points[this.pos[nX][nY]], this.spacing, this.offX, this.offY));
				}
			}
		}
	}
}
