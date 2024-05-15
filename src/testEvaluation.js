// @ts-nocheck

import Board from "./pilkarzykiRenderer.js";
import ExtBoard from "./bot.js";
import fs from "node:fs";

const DRAW_BOARDS = true;

/**
 *
 * EVALUATION FUNCTIONS
 *
 */

import evalQuad from "./evaluationFunctions/evaluationQuad.js";
import evalQuadReverse from "./evaluationFunctions/evaluationQuadReverse.js";
import evalBFS from "./evaluationFunctions/evaluationBFS.js";
import evalBFSReverse from "./evaluationFunctions/evaluationBFSReverse.js";
import evalBFSCubic from "./evaluationFunctions/evaluationBFSCubic.js";
import evalBFSCubicReverse from "./evaluationFunctions/evaluationBFSCubicReverse.js";
import evalBFSfunny from "./evaluationFunctions/evaluationBFSfunny.js";
import evalBFSfunnyReverse from "./evaluationFunctions/evaluationBFSfunnyReverse.js";

function play(eval1, eval2, depth, cleanFiles) {
	console.log("Playing %s vs %s...", eval1.name, eval2.name);
	const b = new Board(50, 50, 50, [1, 1], [eval1.name, eval2.name], 0);
	const ext_board = [new ExtBoard(b, 9, 13, eval1), new ExtBoard(b, 9, 13, eval2)];

	const avg = [0, 0];
	const avgNodes = [0, 0];
	let n = 0;
	while (b.win == -1) {
		const start = performance.now();
		ext_board[b.turn].nodes = 0;
		const move = ext_board[b.turn].search(depth, b.turn, -2000, 2000)[1];
		const end = performance.now();
		console.log("%s searched %d nodes for %f ms (%f node/s)", (b.turn == 0 ? eval1.name : eval2.name), ext_board[b.turn].nodes, Math.round((end - start) * 100) / 100, Math.round(ext_board[b.turn].nodes / ((end - start) / 1000) * 100) / 100);
		n++;

		// each player played only half of all turns
		const m = (n + 1) / 2;
		avgNodes[b.turn] = (avgNodes[b.turn] * (m - 1) + ext_board[b.turn].nodes) / m;
		avg[b.turn] = (avg[b.turn] * (m - 1) + end - start) / m;

		if (move.length == 0) {
			b.win = 1 - b.win;
			continue;
		}

		for (const dir of move) {
			const ind = b.possibleMovesIndexes();
			if (!b.move(ind.indexOf(dir))) {
				console.log("AAaaaaaaaaaaaaa");
				break;
			}
		}
		ext_board[0].makeMove(move);
		ext_board[1].makeMove(move);

		// ext_board[0].save("testGraph.json")
		// b.save("board.json")

		if (DRAW_BOARDS)
			b.draw(n);
	}
	console.log("%s won! There were %d moves", (b.win == 0 ? eval1.name : eval2.name), n);
	console.log("Average time for %s was %f ms, for %s was %f ms",
		eval1.name, Math.round(avg[0] * 100) / 100, eval2.name, Math.round(avg[1] * 100) / 100);
	console.log("Average performance for %s was %f nodes/s, for %s was %f nodes/s\n",
		eval1.name, Math.round(avgNodes[0] * 100) / 100, eval2.name, Math.round(avgNodes[1] * 100) / 100);

	// clean files
	if (cleanFiles) {
		const path = "tmp/";
		const regex = /^boardPilkarzyki\d*[.]png$/;
		fs.readdirSync(path)
			.filter(f => regex.test(f))
			.map(f => fs.unlinkSync(path + f));
	}

	return b.win;
}

function testEval(evalArr, depth) {
	const n = evalArr.length;
	const allGames = n * (n - 1);
	console.log("Tournament with %d games (depth = %d):", allGames, depth);

	const won = [];
	for (let i = 0; i < n; ++i)
		won.push(0);

	const start = performance.now();
	for (let i = 0; i < n; ++i) {
		for (let j = 0; j < n; ++j) {
			if (i == j)
				continue;

			const winner = play(evalArr[i], evalArr[j], depth, true);
			++won[(winner == 0 ? i : j)];
		}
	}
	const end = performance.now();

	for (let i = 0; i < n; ++i)
		console.log("%s won %f% of games", evalArr[i].name, Math.round(won[i] / allGames * 10000) / 100);

	console.log("\nTournament took %d seconds", Math.round((end - start) / 1000));
}

// testEval([evalLinear, evalQuad, evalQuadSign, evalCubic, evalBFS, evalBFSCubic], 4)
// testEval([evalQuadSign, evalQuad, evalBFS, evalBFSCubic], 4)
testEval([evalQuad, evalQuadReverse, evalBFSfunny, evalBFSfunnyReverse, evalBFSCubic, evalBFSCubicReverse], 2);
