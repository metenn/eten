// @ts-nocheck
module.exports = function evaluationQuadReverse(board) {
    // right goal
    if (board.ball[0] == 11) return 1000;

    // left goal
    if (board.ball[0] == 1) return -1000;

    // very poor evaluation...
    // TODO: make it not poor
    return -1 * (board.ball[0] - 6) * (board.ball[0] - 6);
};
