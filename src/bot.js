// @ts-nocheck
import PriorityQueue from "js-priority-queue";
import fs from "node:fs";

const directions = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
// var DEBUG = false

const SAVE_PATH = "tmp/";

export default class ExtBoard {
	constructor(board, size_hor, size_ver, evalFunc) {
		this.ball = [board.ball.x, board.ball.y];
		this.graph = new Array(size_ver);
		this.size_ver = size_ver;
		this.size_hor = size_hor;
		for (let x = 0; x < size_ver; ++x) {
			this.graph[x] = new Array(size_hor);
			for (let y = 0; y < size_hor; ++y)
				this.graph[x][y] = new Array(8);
		}
		for (let x = 1; x < size_ver - 1; ++x) {
			for (let y = 1; y < size_hor - 1; ++y) {
				if (x == 1 && !this.isGoal([x, y]))
					continue;
				if (x == 11 && !this.isGoal([x, y]))
					continue;
				for (let i = 0; i < 8; ++i)
					this.graph[x][y][i] = true;
				for (const i of board.possibleMovesIndexes(x, y))
					this.graph[x][y][i] = false;
			}
		}
		// possibly not necessary
		// this.graph[1][3] = [true, true, true, true, true, true, true, true]
		// this.graph[1][4] = [true, true, true, true, true, true, true, true]
		// this.graph[1][5] = [true, true, true, true, true, true, true, true]

		// this.graph[11][3] = [true, true, true, true, true, true, true, true]
		// this.graph[11][4] = [true, true, true, true, true, true, true, true]
		// this.graph[11][5] = [true, true, true, true, true, true, true, true]

		// this.vis = new Array(size_ver)
		// for (var x = 0; x < size_ver; ++x)
		// 	this.vis[x] = new Array(size_hor)

		this.turn = board.turn;
		if (evalFunc === null)
			evalFunc = evalFunctionDefault;
		this.evalFunc = evalFunc;

		this.nodes = 0;
	}

	save(filename) {
		const data = JSON.stringify(this.graph) + "\n#\n" + JSON.stringify(this.ball);
		fs.writeFileSync(SAVE_PATH + filename, data);
	}

	load(filename) {
		const data = fs.readFileSync(SAVE_PATH + filename, { encoding: "utf8" }).split("#");
		this.graph = JSON.parse(data[0]);
		this.ball = JSON.parse(data[1]);
	}

	createArray(a, b = 1, c = 1, defaultVal = 0) {
		const res = Array(a);
		if (b > 1) {
			for (let i = 0; i < a; ++i) {
				res[i] = Array(b);
				if (c > 1) {
					for (let j = 0; j < b; ++j) {
						res[i][j] = Array(c);
						for (let k = 0; k < c; ++k)
							res[i][j][k] = defaultVal;

					}
				}
				else {
					for (let j = 0; j < b; ++j)
						res[i][j] = defaultVal;

				}
			}
		}
		else {
			for (let i = 0; i < a; ++i)
				res[i] = defaultVal;

		}
		return res;
	}

	moved(point, i) {
		return [point[0] + directions[i][0], point[1] + directions[i][1]];
	}

	possibleDirections(point) {
		const res = [];
		for (let i = 0; i < 8; ++i) {
			if (this.graph[point[0]][point[1]][i] === false)
				res.push(i);
		}
		return res;
	}

	makeMove(move) {
		for (const dir of move) {
			if (this.graph[this.ball[0]][this.ball[1]][dir])
				console.log("OH NO: there is already edge %o --- %o", this.ball, this.moved(this.ball, dir));

			this.graph[this.ball[0]][this.ball[1]][dir] = true;
			this.ball = this.moved(this.ball, dir);
			this.graph[this.ball[0]][this.ball[1]][7 - dir] = true;
		}
		this.turn = 1 - this.turn;
	}

	unmakeMove(move) {
		for (const dir of move.reverse()) {
			if (!this.graph[this.ball[0]][this.ball[1]][7 - dir])
				console.log("OH NO: there was no edge %o --- %o", this.ball, this.moved(this.ball, 7 - dir));

			this.graph[this.ball[0]][this.ball[1]][7 - dir] = false;
			this.ball = this.moved(this.ball, 7 - dir);
			this.graph[this.ball[0]][this.ball[1]][dir] = false;
		}
		move.reverse();
		this.turn = 1 - this.turn;
	}

	single(s, t, canGoFurther, player) {
		++this.xd;
		if (s[0] == t[0] && s[1] == t[1])
			return [[this.evalFunc(this), []]];

		if (s[0] == 1 || s[0] == 11) {
			if (t[0] == 1 || t[0] == 11)
				return [[this.evalFunc(this), []]];
			return null;
		}

		// this.vis[s[0]][s[1]] = true
		// if (DEBUG) console.log(s)

		const queue = new PriorityQueue({
			comparator: function(a, b) {
				return (player === 0 ? 1 : -1) * (a[0] - b[0]);
			}
		});

		if (canGoFurther) {
			// if (DEBUG) console.log(s + ": " + this.possibleDirections(s))
			for (const i of this.possibleDirections(s)) {

				const v = this.moved(s, i);
				// if (DEBUG) console.log(s, i, directions[i])
				// if (DEBUG) console.log(s + " -> " + v)
				// if (this.vis[v[0]][v[1]]) {
				// 	if (DEBUG) console.log("visited " + v)
				// 	continue
				// }

				canGoFurther = false;
				for (let j = 0; j < 8; ++j) {
					if (this.graph[v[0]][v[1]][j]) {
						canGoFurther = true;
						break;
					}
				}
				// if (DEBUG) console.log(v + ' ' + canGoFurther)
				this.makeMove([i]);

				const path = this.single(v, t, canGoFurther, player);
				this.unmakeMove([i]);
				if (path !== null && path.length > 0) {
					if (t[0] == 1 || t[0] == 11)
						return [[path[0][0], [i].concat(path[0][1])]];


					for (const tmp_path of path) {
						if (tmp_path === null)
							continue;

						queue.queue([tmp_path[0], [i].concat(tmp_path[1])]);
						if (queue.length > 50)
							queue.dequeue();
					}
				}
			}
		}

		// this.vis[s[0]][s[1]] = false
		const res = [];
		while (queue.length)
			res.push(queue.dequeue());
		return res;
	}

	// s ~> t
	findPath(s, t, player) {
		this.xd = 0;
		// for (var x = 0; x < this.size_ver; ++x) {
		// 	for (var y = 0; y < this.size_hor; ++y) {
		// 		this.vis[x][y] = false

		// 	}
		// }
		return this.single(s, t, true, player);
	}

	BFS(start) {
		const points = [];
		const vis = this.createArray(this.size_ver, this.size_hor, 1, false);

		const queue = [];
		queue.push(start);
		vis[start[0]][start[1]] = true;

		while (queue.length) {
			const v = queue.shift();

			for (const i of this.possibleDirections(v)) {
				const w = this.moved(v, i);
				let canGoFurther = false;
				for (let j = 0; j < 8; ++j) {
					if (this.graph[w[0]][w[1]][j]) {
						canGoFurther = true;
						break;
					}
				}
				if (this.isGoal(w))
					canGoFurther = false;

				if (!vis[w[0]][w[1]]) {
					vis[w[0]][w[1]] = true;
					points.push(w);
					if (canGoFurther)
						queue.push(w);
				}
			}
		}

		return points;
	}

	isGoal(point) {
		if (point[0] == 1 && (point[1] == 3 || point[1] == 4 || point[1] == 5))
			return true;
		if (point[0] == 11 && (point[1] == 3 || point[1] == 4 || point[1] == 5))
			return true;
		return false;
	}

	generateMoves() {
		const points = this.BFS(this.ball);
		return points;
	}

	// quite good optimalization
	orderMoves(moves, player) {
		const forcing = [];
		const res = [];
		for (const point of moves) {
			if (point[0] == (player === 0 ? 11 : 1))
				forcing.push(point);
			else
				res.push(point);
		}
		return forcing.concat(res);
	}

	search(depth, player, alpha, beta) {
		++this.nodes;

		let best = [(player ? 2000 : -2000), []];

		const evaluation = this.evalFunc(this);
		if ((depth == 0) || (Math.abs(evaluation) == 1000))
			return [evaluation, []];

		// var losing = this.BFS((player==0 ? [1, 4] : [11, 4]))
		// var points = this.BFS(this.ball)

		// maybe it's better to go through points with no edges here
		// for (var x = 1; x < this.size_ver-1; ++x) {
		// 	for (var y = 1; y < this.size_hor-1; ++y) {

		for (const [x, y] of this.orderMoves(this.generateMoves(), player)) {
			// if (this.ball[0] == x && this.ball[1] == y)
			// 	continue
			// if (losing.indexOf([x, y]) != -1)
			// 	continue

			let end = true;
			for (const dir of this.graph[x][y]) {
				if (dir == true || dir == null) {
					end = false;
					break;
				}
			}

			if (!end && !this.isGoal([x, y]))
				continue;

			// if (losing.indexOf([x, y]) != -1)
			// 	continue

			const paths = this.findPath(this.ball, [x, y], player);
			if (this.xd > 1000000) {
				console.log("FindPath %d (player %d) from [%d, %d] to [%d, %d]", this.xd, player, this.ball[0], this.ball[1], x, y);
				this.save("lol.json");
			}
			for (const [_, path] of paths.reverse()) {
				if (path !== null && path.length > 0) {
					this.makeMove(path);

					if (player == 0) {
						const val = this.search(depth - 1, 1 - player, alpha, beta);
						if (val[0] > best[0])
							best = [val[0], path];

						// else if (val[0] == best[0] && val[1][0]+1>best[0][1])
						// 	best = [val[0], [val[1][0]+1, path]]
						if (best[0] >= beta) {
							this.unmakeMove(path);
							return best;
						}
						alpha = Math.max(alpha, best[0]);
					}
					else {
						const val = this.search(depth - 1, 1 - player, alpha, beta);
						if (val[0] < best[0])
							best = [val[0], path];

						// else if (val[0] == best[0] && val[1][0]+1>best[0][1])
						// 	best = [val[0], [val[1][0]+1, path]]
						if (alpha >= best[0]) {
							this.unmakeMove(path);
							return best;
						}
						beta = Math.min(beta, best[0]);
					}
					this.unmakeMove(path);
				}
			}
		}

		return best;
	}
};

// var b = new Board(50, 50, 50, [1, 1], ['a', 'b'], 0)
// b.loadFromGraph(JSON.parse(fs.readFileSync('data/lol.json', {encoding: 'utf8'}).split('#')[0]))
// b.draw()

// var ext_board = new ExtBoard(b, 9, 13, require('./evaluationFunctions/evaluationBFSReverse.js'))
// ext_board.load('lol.json')
// ext_board.makeMove([7, 1, 0, 4])
// console.log(require('./evaluationFunctions/evaluationBFSReverse.js')(ext_board))
// console.log(ext_board.findPath([3, 4], [4, 3], 0))

// var sr=0
// var n=0
// var i = 0
// while (b.win == -1) {
// 	var start=performance.now()
// 	var move = ext_board[b.turn].search(4, b.turn, -2000, 2000)[1]
// 	var end=performance.now()
// 	n++
// 	sr=(sr*(n-1)+Math.round((end-start)*100)/100)/n
// 	console.log("Time: ", Math.round((end-start)*100)/100, 'ms',
// 				'Avg: ', Math.round(sr*100)/100+'ms')
// 	console.log(b.turn, move)

// 	for (var dir of move) {
// 		var ind = b.possibleMovesIndexes()
// 		if (!b.move(ind.indexOf(dir))) {
// 			console.log("AAaaaaaaaaaaaaa")
// 			break
// 		}
// 	}
// 	ext_board[0].makeMove(move)
// 	ext_board[1].makeMove(move)
// 	b.draw(i)
// 	i = i + 1
// }
// console.log(b.win)


// var ext_board = new ExtBoard(b, 9, 13, require('./evaluationFunctions/evaluationQuadReverse.js'))
// console.log(ext_board.generateMoves())
// ext_board.load("graph.json")
// console.log(ext_board.findPath([4, 4], [2, 1]))
// console.log(ext_board.xd)

// module.exports = {}
