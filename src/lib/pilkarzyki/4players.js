import { createCanvas } from "canvas";
import fs from "node:fs";
import BaseBoard from "./BaseBoard.js";
import Edge from "./Edge.js";
import Point from "./Point.js";

export default class Board extends BaseBoard {
    /** @type {string[][]} */
    surrender = [[], []];

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

        const settings =
            /** @type {import("../../../types.js").IUserSettings} */ (
                JSON.parse(fs.readFileSync("./data/userSettings.json", "utf8"))
            );

        this.colors = ["#5865f2", "#f04747", "#5865f2", "#f04747"];
        for (let i = 0; i < this.uids.length; i++) {
            if (
                settings[this.uids[i]] !== undefined &&
                settings[this.uids[i]]["color"] !== undefined
            )
                // @ts-expect-error
                this.colors[i] = settings[this.uids[i]]["color"];
        }

        for (const uid of this.uids) this.longestMove[uid] = 0;

        this.ball = new Point(-1, 6, 6, this.spacing, this.offX, this.offY);
        this.canvas = createCanvas(
            this.offX * 2 + 10 * this.spacing,
            offsetY * 2 + 10 * spacing,
        );
        this.ctx = this.canvas.getContext("2d");

        this.points = [];
        this.pos = new Array(13);
        for (let i = 0; i < this.pos.length; i++) this.pos[i] = new Array(13);

        let ind = 0;
        for (let y = 0; y <= 12; y++) {
            for (let x = 0; x <= 12; x++) {
                const outside = this.isPointOutside(x, y);
                const border = this.isPointOnBorder(x, y);

                this.pos[x][y] = ind;
                this.points.push(
                    new Point(
                        ind,
                        x,
                        y,
                        this.spacing,
                        this.offX,
                        this.offY,
                        "#fff",
                        border,
                        outside,
                    ),
                );
                ind++;
            }
        }

        for (const x of [4, 5, 8, 9]) {
            for (const y of [2, 10]) {
                const pointA = new Point(
                    this.pos[x - 1][y],
                    x - 1,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                const pointB = new Point(
                    this.pos[x][y],
                    x,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                this.edges.push(
                    new Edge(
                        pointA,
                        pointB,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
                this.edges.push(
                    new Edge(
                        pointB,
                        pointA,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
            }
        }
        for (const x of [6, 7]) {
            for (const y of [1, 11]) {
                const pointA = new Point(
                    this.pos[x - 1][y],
                    x - 1,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                const pointB = new Point(
                    this.pos[x][y],
                    x,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                this.edges.push(
                    new Edge(
                        pointA,
                        pointB,
                        this.spacing,
                        this.offX,
                        this.offY,
                        y == 1 ? this.colors[1] : this.colors[3],
                    ),
                );
                this.edges.push(
                    new Edge(
                        pointB,
                        pointA,
                        this.spacing,
                        this.offX,
                        this.offY,
                        y == 1 ? this.colors[1] : this.colors[3],
                    ),
                );
            }
        }
        for (const y of [4, 5, 8, 9]) {
            for (const x of [2, 10]) {
                const pointA = new Point(
                    this.pos[x][y - 1],
                    x,
                    y - 1,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                const pointB = new Point(
                    this.pos[x][y],
                    x,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                this.edges.push(
                    new Edge(
                        pointA,
                        pointB,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
                this.edges.push(
                    new Edge(
                        pointB,
                        pointA,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
            }
        }
        for (const y of [6, 7]) {
            for (const x of [1, 11]) {
                const pointA = new Point(
                    this.pos[x][y - 1],
                    x,
                    y - 1,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                const pointB = new Point(
                    this.pos[x][y],
                    x,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                this.edges.push(
                    new Edge(
                        pointA,
                        pointB,
                        this.spacing,
                        this.offX,
                        this.offY,
                        x == 1 ? this.colors[0] : this.colors[2],
                    ),
                );
                this.edges.push(
                    new Edge(
                        pointB,
                        pointA,
                        this.spacing,
                        this.offX,
                        this.offY,
                        x == 1 ? this.colors[0] : this.colors[2],
                    ),
                );
            }
        }
        for (const y of [2, 11]) {
            for (const x of [5, 7]) {
                const pointA = new Point(
                    this.pos[x][y - 1],
                    x,
                    y - 1,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                const pointB = new Point(
                    this.pos[x][y],
                    x,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                this.edges.push(
                    new Edge(
                        pointA,
                        pointB,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
                this.edges.push(
                    new Edge(
                        pointB,
                        pointA,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
            }
        }
        for (const y of [3, 10]) {
            for (const x of [3, 9]) {
                const pointA = new Point(
                    this.pos[x][y - 1],
                    x,
                    y - 1,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                const pointB = new Point(
                    this.pos[x][y],
                    x,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                this.edges.push(
                    new Edge(
                        pointA,
                        pointB,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
                this.edges.push(
                    new Edge(
                        pointB,
                        pointA,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
            }
        }
        for (const x of [2, 11]) {
            for (const y of [5, 7]) {
                const pointA = new Point(
                    this.pos[x - 1][y],
                    x - 1,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                const pointB = new Point(
                    this.pos[x][y],
                    x,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                this.edges.push(
                    new Edge(
                        pointA,
                        pointB,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
                this.edges.push(
                    new Edge(
                        pointB,
                        pointA,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
            }
        }
        for (const x of [3, 10]) {
            for (const y of [3, 9]) {
                const pointA = new Point(
                    this.pos[x - 1][y],
                    x - 1,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                const pointB = new Point(
                    this.pos[x][y],
                    x,
                    y,
                    this.spacing,
                    this.offX,
                    this.offY,
                );
                this.edges.push(
                    new Edge(
                        pointA,
                        pointB,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
                this.edges.push(
                    new Edge(
                        pointB,
                        pointA,
                        this.spacing,
                        this.offX,
                        this.offY,
                    ),
                );
            }
        }

        for (const point of this.points) {
            if (!point.border) continue;

            for (const dir of this.directions) {
                const newX = point.x + dir[0];
                const newY = point.y + dir[1];
                const newPoint = this.points[this.pos[newX][newY]];

                // THIS MAY OR MAY NOT WORK IDFK
                if (
                    (point.x == newX && newPoint.border) ||
                    (point.y == newY && newPoint.border) ||
                    newPoint.outside
                )
                    newPoint.edges.push(this.pos[newX][newY]);
            }
        }

        this.points[this.pos[4][2]].edges.push(this.pos[5][1]);
        this.points[this.pos[8][2]].edges.push(this.pos[7][1]);

        this.points[this.pos[4][10]].edges.push(this.pos[5][11]);
        this.points[this.pos[8][10]].edges.push(this.pos[7][11]);

        this.points[this.pos[2][4]].edges.push(this.pos[1][5]);
        this.points[this.pos[2][8]].edges.push(this.pos[1][7]);

        this.points[this.pos[10][4]].edges.push(this.pos[11][5]);
        this.points[this.pos[10][8]].edges.push(this.pos[11][7]);

        this.points[this.pos[3][2]].edges.push(this.pos[2][3]);
        this.points[this.pos[2][3]].edges.push(this.pos[3][2]);

        this.points[this.pos[2][9]].edges.push(this.pos[3][10]);
        this.points[this.pos[3][10]].edges.push(this.pos[2][9]);

        this.points[this.pos[9][2]].edges.push(this.pos[10][3]);
        this.points[this.pos[10][3]].edges.push(this.pos[9][2]);

        this.points[this.pos[9][10]].edges.push(this.pos[10][9]);
        this.points[this.pos[10][9]].edges.push(this.pos[9][10]);
    }

    paintGradient() {
        this.ctx.lineWidth = 0;

        for (let player = 0; player <= 3; player++) {
            const uid = this.uids[player];

            let grd;
            if (player == 0)
                grd = this.getGradient(
                    this.offX,
                    this.canvas.height / 2,
                    this.canvas.width / 2,
                    this.canvas.height / 2,
                    uid,
                );
            else if (player == 1)
                grd = this.getGradient(
                    this.canvas.width / 2,
                    this.offY,
                    this.canvas.width / 2,
                    this.canvas.height / 2,
                    uid,
                );
            else if (player == 2)
                grd = this.getGradient(
                    this.canvas.width - this.offX,
                    this.canvas.height / 2,
                    this.canvas.width / 2,
                    this.canvas.height / 2,
                    uid,
                );
            else if (player == 3)
                grd = this.getGradient(
                    this.canvas.width / 2,
                    this.canvas.height - this.offY,
                    this.canvas.width / 2,
                    this.canvas.height / 2,
                    uid,
                );

            if (grd == undefined) continue;

            this.ctx.fillStyle = grd;
            this.ctx.beginPath();
            if (player == 0) {
                this.ctx.moveTo(
                    this.offX + this.spacing * 2,
                    this.offY + this.spacing * 8,
                );
                this.ctx.lineTo(this.offX, this.offY + this.spacing * 8);
                this.ctx.lineTo(this.offX, this.offY + this.spacing * 2);
                this.ctx.lineTo(
                    this.offX + this.spacing * 2,
                    this.offY + this.spacing * 2,
                );
            } else if (player == 1) {
                this.ctx.moveTo(
                    this.offX + this.spacing * 2,
                    this.offY + this.spacing * 2,
                );
                this.ctx.lineTo(this.offX + this.spacing * 2, this.offY);
                this.ctx.lineTo(this.offX + this.spacing * 8, this.offY);
                this.ctx.lineTo(
                    this.offX + this.spacing * 8,
                    this.offY + this.spacing * 2,
                );
            } else if (player == 2) {
                this.ctx.moveTo(
                    this.offX + this.spacing * 8,
                    this.offY + this.spacing * 2,
                );
                this.ctx.lineTo(
                    this.offX + this.spacing * 10,
                    this.offY + this.spacing * 2,
                );
                this.ctx.lineTo(
                    this.offX + this.spacing * 10,
                    this.offY + this.spacing * 8,
                );
                this.ctx.lineTo(
                    this.offX + this.spacing * 8,
                    this.offY + this.spacing * 8,
                );
            } else if (player == 3) {
                this.ctx.moveTo(
                    this.offX + this.spacing * 8,
                    this.offY + this.spacing * 8,
                );
                this.ctx.lineTo(
                    this.offX + this.spacing * 8,
                    this.offY + this.spacing * 10,
                );
                this.ctx.lineTo(
                    this.offX + this.spacing * 2,
                    this.offY + this.spacing * 10,
                );
                this.ctx.lineTo(
                    this.offX + this.spacing * 2,
                    this.offY + this.spacing * 8,
                );
            }

            this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.closePath();
            this.ctx.fill();

            // this probably should be in loop but idk
            this.ctx.clearRect(
                this.offX,
                this.offY + 2 * this.spacing,
                this.spacing,
                2 * this.spacing,
            );
            this.ctx.clearRect(
                this.offX,
                this.offY + 6 * this.spacing,
                this.spacing,
                2 * this.spacing,
            );

            this.ctx.clearRect(
                this.offX + 2 * this.spacing,
                this.offY,
                2 * this.spacing,
                this.spacing,
            );
            this.ctx.clearRect(
                this.offX + 6 * this.spacing,
                this.offY,
                2 * this.spacing,
                this.spacing,
            );

            this.ctx.clearRect(
                this.offX + 9 * this.spacing,
                this.offY + 2 * this.spacing,
                this.spacing,
                2 * this.spacing,
            );
            this.ctx.clearRect(
                this.offX + 9 * this.spacing,
                this.offY + 6 * this.spacing,
                this.spacing,
                2 * this.spacing,
            );

            this.ctx.clearRect(
                this.offX + 2 * this.spacing,
                this.offY + 9 * this.spacing,
                2 * this.spacing,
                this.spacing,
            );
            this.ctx.clearRect(
                this.offX + 6 * this.spacing,
                this.offY + 9 * this.spacing,
                2 * this.spacing,
                this.spacing,
            );
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.paintGradient();
        this.ctx.textAlign = "center"; // these 3 lines should be in constructor
        this.ctx.font = "30px Arial";
        this.ctx.lineWidth = this.thickness;

        this.ctx.save();
        this.ctx.translate(
            this.offX - this.offX / 2 + 10,
            this.canvas.height / 2,
        );
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillStyle = this.colors[0];
        this.ctx.fillText(this.usernames[0], 0, 0);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(
            this.canvas.width / 2,
            this.offY - this.offY / 2 + 10,
        );
        this.ctx.fillStyle = this.colors[1];
        this.ctx.fillText(this.usernames[1], 0, 0);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(
            this.canvas.width - this.offX / 2 - 10,
            this.canvas.height / 2,
        );
        this.ctx.rotate(+Math.PI / 2);
        this.ctx.fillStyle = this.colors[2];
        this.ctx.fillText(this.usernames[2], 0, 0);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(
            this.canvas.width / 2,
            this.canvas.height - this.offY / 2 - 10,
        );
        this.ctx.rotate(Math.PI);
        this.ctx.fillStyle = this.colors[3];
        this.ctx.fillText(this.usernames[3], 0, 0);
        this.ctx.restore();

        for (const point of this.points) point.draw(this.ctx, this.thickness);

        for (const edge of this.edges) edge.draw(this.ctx);

        this.ctx.strokeStyle = this.colors[this.turn];
        this.ctx.fillStyle = this.colors[this.turn];

        this.ctx.beginPath();
        this.ctx.arc(
            this.offX + this.spacing * (this.ball.x - 1),
            this.offY + this.spacing * (this.ball.y - 1),
            5,
            0,
            2 * Math.PI,
            false,
        );
        this.ctx.fill();
        this.ctx.stroke();

        const data = this.canvas
            .toDataURL()
            .replace(/^data:image\/\w+;base64,/, "");
        const buf = Buffer.from(data, "base64");
        fs.writeFileSync(`tmp/boardTeamPilkarzyki${this.id}.png`, buf);
    }

    /**
     *
     * @param {number} index
     * @returns {boolean}
     */
    move(index) {
        const moves = this.possibleMoves();
        if (index >= moves.length || this.win != -1) return false;

        this.points[this.pos[this.ball.x][this.ball.y]].edges.push(
            moves[index],
        );
        this.points[moves[index]].edges.push(
            this.pos[this.ball.x][this.ball.y],
        );

        // removed if
        this.edges.push(
            new Edge(
                this.points[moves[index]],
                this.points[this.pos[this.ball.x][this.ball.y]],
                this.spacing,
                this.offX,
                this.offY,
                this.colors[this.turn],
            ),
        );

        this.totalMoves++;

        const ranking = /** @type {import("../../../types.d.ts").IRanking} */ (
            JSON.parse(fs.readFileSync("./data/ranking.json", "utf8"))
        );
        if (ranking.sumaruchow[this.uids[this.turn]] === undefined)
            ranking.sumaruchow[this.uids[this.turn]] = 0;
        ranking.sumaruchow[this.uids[this.turn]]++;
        fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));

        const point = this.points[moves[index]];
        this.ball.x = point.x;
        this.ball.y = point.y;

        if (this.ball.x == 1 || this.ball.x == 11) this.win = 1;
        if (this.ball.y == 1 || this.ball.y == 11) this.win = 0;

        if (this.points[moves[index]].edges.length == 1)
            this.turn = (this.turn + 1) % 4;
        if (this.points[moves[index]].edges.length == 8)
            this.win = (this.turn + 1) % 2;

        return true;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isPointOutside(x, y) {
        if (
            (y == 1 && x >= 1 && x <= 4) ||
            (y == 1 && x >= 8 && x <= 11) ||
            (y == 11 && x >= 1 && x <= 4) ||
            (y == 11 && x >= 8 && x <= 11) ||
            (x == 1 && y >= 1 && y <= 4) ||
            (x == 1 && y >= 8 && y <= 11) ||
            (x == 11 && y >= 1 && y <= 4) ||
            (x == 11 && y >= 8 && y <= 11) ||
            (x == 2 && y == 2) ||
            (x == 10 && y == 2) ||
            (x == 2 && y == 10) ||
            (x == 10 && y == 10) ||
            y == 0 ||
            y == 12 ||
            x == 0 ||
            x == 12
        )
            return true;
        return false;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isPointOnBorder(x, y) {
        if (
            (y == 2 && x >= 3 && x <= 5) ||
            (y == 2 && x >= 7 && x <= 9) ||
            (y == 10 && x >= 3 && x <= 5) ||
            (y == 10 && x >= 7 && x <= 9) ||
            (x == 2 && y >= 3 && y <= 5) ||
            (x == 2 && y >= 7 && y <= 9) ||
            (x == 10 && y >= 3 && y <= 5) ||
            (x == 10 && y >= 7 && y <= 9) ||
            (y == 1 && x >= 5 && x <= 7) ||
            (y == 11 && x >= 5 && x <= 7) ||
            (x == 1 && y >= 5 && y <= 7) ||
            (x == 11 && y >= 5 && y <= 7) ||
            (x == 3 && y == 3) ||
            (x == 9 && y == 3) ||
            (x == 3 && y == 9) ||
            (x == 9 && y == 9)
        )
            return true;
        return false;
    }
}
