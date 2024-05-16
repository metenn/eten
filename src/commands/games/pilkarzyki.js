import Elo from "elo-rating";
import fs from "node:fs";
import { performance } from "perf_hooks";
import ExtBoard from "../../bot.js";
import config from "../../config.json" with { type: "json" };
import Board from "../../lib/pilkarzyki/2players.js";
import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
    SlashCommandUserOption,
} from "discord.js";

/** @typedef {{[uid: string]: number}} Iuids */

/** @typedef {{ [bid: number]: { gameID: number, ext_board: ExtBoard, depth: number, playerTurn: boolean; }; }} IBots */

/** @typedef {{[id: string]: Board;}} IBoards */

/** @typedef { {usernames: Array<string>, uids: Array<string>, to: string, from: string, message?: import("discord.js").APIMessage | import("discord.js").Message<boolean>;} } IAccept */
// to: string, // uid
// from: string, // uid

/** @type {Iuids} */
const uids = {};
/** @type {IBots} */
const bots = {};
/** @type {IBoards} */
const boards = {};
let gameID = 1;
let botID = 1;
/** @type {IAccept[]} */
let accepts = [];

/**
 *
 * @param {number} ms
 * @returns
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 *
 * @param {number} id
 * @returns {Array<ActionRowBuilder<ButtonBuilder>> | undefined}
 */
function getButtons(id) {
    let indexes;
    try {
        indexes = boards[id].possibleMovesIndexes();
    } catch (error) {
        console.log(
            `Couldnt get move indexes for board_id = ${id} (probably doesnt exist)`,
        );
        return;
    }
    /** @type {ButtonStyle} */
    let style;
    if (boards[id].turn == 0) style = ButtonStyle.Primary;
    else style = ButtonStyle.Danger;

    const row1 = /** @type {ActionRowBuilder<ButtonBuilder>} */ (
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("pilkarzyki#0")
                .setLabel("↖")
                .setStyle(style)
                .setDisabled(!indexes.includes(0)),
            new ButtonBuilder()
                .setCustomId("pilkarzyki#1")
                .setLabel("⬆")
                .setStyle(style)
                .setDisabled(!indexes.includes(1)),
            new ButtonBuilder()
                .setCustomId("pilkarzyki#2")
                .setLabel("↗")
                .setStyle(style)
                .setDisabled(!indexes.includes(2)),
        )
    );
    const row2 = /** @type {ActionRowBuilder<ButtonBuilder>} */ (
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("pilkarzyki#3")
                .setLabel("⬅")
                .setStyle(style)
                .setDisabled(!indexes.includes(3)),
            new ButtonBuilder()
                .setCustomId("pilkarzyki#disabled")
                .setLabel("xd")
                .setStyle(style)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId("pilkarzyki#4")
                .setLabel("➡")
                .setStyle(style)
                .setDisabled(!indexes.includes(4)),
        )
    );
    const row3 = /** @type {ActionRowBuilder<ButtonBuilder>} */ (
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("pilkarzyki#5")
                .setLabel("↙")
                .setStyle(style)
                .setDisabled(!indexes.includes(5)),
            new ButtonBuilder()
                .setCustomId("pilkarzyki#6")
                .setLabel("⬇")
                .setStyle(style)
                .setDisabled(!indexes.includes(6)),
            new ButtonBuilder()
                .setCustomId("pilkarzyki#7")
                .setLabel("↘")
                .setStyle(style)
                .setDisabled(!indexes.includes(7)),
        )
    );
    const row4 = /** @type {ActionRowBuilder<ButtonBuilder>} */ (
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("pilkarzyki#remis")
                .setLabel("Remis")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("pilkarzyki#surrender")
                .setLabel("Poddaj się")
                .setStyle(ButtonStyle.Secondary),
        )
    );

    return [row1, row2, row3, row4];
}

export const data = new SlashCommandBuilder()
    .setName("pilkarzyki")
    .setDescription("Pilkarzyki")
    .addSubcommand((subcommand) =>
        subcommand
            .setName("player")
            .setDescription("Gra z innym graczem")
            .addUserOption(
                new SlashCommandUserOption()
                    .setName("gracz")
                    .setDescription("Drugi gracz")
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName("bot")
            .setDescription("Gra z botem")
            .addIntegerOption((option) =>
                option
                    .setName("depth")
                    .setDescription(
                        "Głębokość patrzenia (max. " +
                            config.pilkarzykiBot.maxDepth +
                            ")",
                    )
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(config.pilkarzykiBot.maxDepth),
            ),
    );

/**
 *
 * @param {import("discord.js").Interaction} interaction
 * @returns
 */
export async function execute(interaction) {
    if (interaction.isButton()) {
        const mainMessage = await interaction.update({
            content: interaction.message.content,
            fetchReply: true,
        });
        interaction.customId = interaction.customId.slice(
            interaction.customId.indexOf("#") + 1,
        );

        if (interaction.customId.startsWith("accept")) {
            acceptManager(interaction, mainMessage);
            return;
        }

        const uid = interaction.user.id;
        const id = uids[uid];

        if (uids[interaction.user.id] == undefined) return;

        if (interaction.customId == "surrender") {
            surrenderManager(interaction, mainMessage);
            return;
        } else if (interaction.customId == "remis") {
            if (await remisManager(interaction, mainMessage)) return;
        } else if (!boards[id].withBot) {
            await buttonWithoutBot(interaction);
        } else {
            await buttonWithBot(interaction, mainMessage);
            return;
        }

        let msg,
            components = true;

        if (boards[id].win == -1) {
            msg = `Tura: <@${boards[id].turnUID}>`;

            if (boards[id].remis.length > 0)
                msg += ` (${boards[id].remis.length}/2 osoby poprosiły o remis)`;
        } else {
            msg = `<@${boards[id].uids[boards[id].win]}> wygrał!`;
            components = false;
        }

        sendBoard(id, interaction.client, mainMessage, msg, components);

        if (boards[id].win != -1) {
            const gameuids = boards[id].uids;
            updateLongestGame(id, gameuids);
            /** @type {import("../../../types.js").IRanking} */
            const ranking = JSON.parse(
                fs.readFileSync("./data/ranking.json", "utf8"),
            );

            const player1 = ranking.pilkarzyki[gameuids[0]].rating;
            const player2 = ranking.pilkarzyki[gameuids[1]].rating;

            let newRating;
            if (boards[id].win == 0) {
                newRating = Elo.calculate(player1, player2, true);
                ranking.pilkarzyki[gameuids[0]].won++;
                ranking.pilkarzyki[gameuids[1]].lost++;
            } else {
                newRating = Elo.calculate(player1, player2, false);
                ranking.pilkarzyki[gameuids[0]].lost++;
                ranking.pilkarzyki[gameuids[1]].won++;
            }

            ranking.pilkarzyki[gameuids[0]].rating = newRating["playerRating"];
            ranking.pilkarzyki[gameuids[1]].rating =
                newRating["opponentRating"];

            fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));

            delete boards[id];
            delete uids[gameuids[0]];
            delete uids[gameuids[1]];
        }
        return;
    } else if (interaction.isChatInputCommand()) {
        const message = await interaction.deferReply({ fetchReply: true });
        let usernames;
        const id = gameID;
        gameID++;

        if (interaction.options.getSubcommand() == "player") {
            const secondUser = interaction.options.getUser("gracz");
            // @ts-expect-error
            const uid2 = secondUser.id;
            const uid1 = interaction.user.id;
            // @ts-expect-error
            usernames = [interaction.user.username, secondUser.username];

            if (uids[uid1] != undefined) {
                interaction.editReply("Już grasz w grę");
                return;
            }
            if (uids[uid2] != undefined) {
                interaction.editReply(`<@${uid2}> już gra w grę`);
                return;
            }
            if (uid1 == uid2) {
                interaction.editReply("Nie możesz grać z samym sobą");
                return;
            }

            for (const accept of accepts) {
                if (accept.to == uid2 && accept.from == uid1) {
                    await interaction.editReply("Już wyzwałeś tą osobę");
                    return;
                }
            }

            /** @type {import("../../../types.js").IRanking} */
            const ranking = JSON.parse(
                fs.readFileSync("./data/ranking.json", "utf8"),
            );
            if (ranking.pilkarzyki[uid1] == undefined)
                ranking.pilkarzyki[uid1] = {
                    lost: 0,
                    won: 0,
                    rating: 1500,
                };
            if (ranking.pilkarzyki[uid2] == undefined)
                ranking.pilkarzyki[uid2] = {
                    lost: 0,
                    won: 0,
                    rating: 1500,
                };

            fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));

            /** @type {IAccept} */
            const newAccept = {
                usernames: usernames,
                uids: [uid1, uid2],
                to: uid2,
                from: uid1,
            };

            const row = /** @type {ActionRowBuilder<ButtonBuilder>} */ (
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel("Tak")
                        .setCustomId(
                            "pilkarzyki#acceptYes#" + uid1 + "#" + uid2,
                        )
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setLabel("Nie")
                        .setCustomId("pilkarzyki#acceptNo#" + uid1 + "#" + uid2)
                        .setStyle(ButtonStyle.Danger),
                )
            );

            newAccept.message = await interaction.editReply({
                content: `<@${uid2}>: ${usernames[0]} chce z tobą zagrać`,
                components: [row],
            });

            accepts.push(newAccept);
        } else if (interaction.options.getSubcommand() == "bot") {
            const uid = interaction.user.id;
            const bid = botID;
            const depth = interaction.options.getInteger("depth"); // required in eval, dont remove
            botID++;
            usernames = [interaction.user.username, "Bot"];

            let evalFunctionPath = undefined;
            for (const func of config.pilkarzykiBot.evaluationFunctionConfig) {
                if (eval(func.condition)) {
                    evalFunctionPath = func.path;
                }
            }

            if (evalFunctionPath === undefined) {
                interaction.editReply(
                    "Nie znaleziono odpowiedniej funkcjievaluacyjnej (być może config jest źle skonfigurowany albo ja nie umiem pisać Etena jak zwykle)",
                );
                return;
            }
            evalFunctionPath =
                evalFunctionPath[
                    Math.floor(Math.random() * evalFunctionPath.length)
                ];
            console.log("evalFunctionPath = " + evalFunctionPath);

            uids[uid] = id;
            boards[id] = new Board(
                50,
                50,
                50,
                3,
                [uid, bid.toString()],
                usernames,
                id,
                true,
            );
            bots[bid] = {
                gameID: id,
                ext_board: new ExtBoard(
                    boards[id],
                    9,
                    13,
                    await import(evalFunctionPath),
                ),
                // @ts-expect-error
                depth: depth,
                playerTurn: true,
            };

            sendBoard(
                id,
                interaction.client,
                message,
                `Tura: <@${boards[id].turnUID}>`,
                true,
                interaction,
            );
            return;
        }
    }
}

/**
 *
 * @param {import("discord.js").ButtonInteraction} interaction
 * @param {import("discord.js").APIMessage | import("discord.js").Message<boolean>} mainMessage
 * @returns
 */
async function acceptManager(interaction, mainMessage) {
    const buttonUids = interaction.customId.split("#");
    const inviter = buttonUids[1];
    const invited = buttonUids[2];

    if (invited != interaction.user.id) return;

    if (interaction.customId.startsWith("acceptNo")) {
        const accept = getAcceptByUids(inviter, invited);
        if (accept == undefined) return;

        const msg = `${accept.usernames[1]} nie zaakceptował gry z ${accept.usernames[0]}`;
        await /** @type {import("discord.js").Message} */ (accept.message).edit(
            {
                content: msg,
                components: [],
            },
        );
        removeAcceptByUids(inviter, invited);
        return;
    } else {
        const accept = getAcceptByUids(inviter, invited);
        if (accept == undefined) return;

        /** @type {IAccept[]} */
        const newAccepts = [];
        for (const acc of accepts) {
            if (acc.to != invited && acc.from != inviter) {
                newAccepts.push(acc);
            } else {
                /** @type {import("discord.js").Message} */ (acc.message).edit({
                    content: /** @type {import("discord.js").Message} */ (
                        acc.message
                    ).content,
                    components: [],
                });
            }
        }
        accepts = newAccepts;

        const id = gameID;
        gameID++;
        uids[invited] = id;
        uids[inviter] = id;
        boards[id] = new Board(
            50,
            50,
            50,
            3,
            [inviter, invited],
            accept.usernames,
            id,
        );

        sendBoard(
            id,
            interaction.client,
            mainMessage,
            `Tura: <@${boards[id].turnUID}>`,
        );
    }
}

/**
 *
 * @param {import("discord.js").ButtonInteraction} interaction
 * @param {import("discord.js").APIMessage | import("discord.js").Message<boolean>} mainMessage
 * @returns
 */
async function surrenderManager(interaction, mainMessage) {
    const uid = interaction.user.id;
    const id = uids[uid];

    if (boards[id].withBot) {
        sendBoard(
            id,
            interaction.client,
            mainMessage,
            `<@${uid}> poddał się`,
            false,
        );
        /** @type {number} */
        const bid = parseInt(boards[id].uids[1 - boards[id].uids.indexOf(uid)]);

        delete bots[bid];
        delete boards[id];
        delete uids[uid];
        return;
    } else {
        const gameuids = boards[id].uids;
        updateLongestGame(id, gameuids);
        /** @type {import("../../../types.js").IRanking} */
        const ranking = JSON.parse(
            fs.readFileSync("./data/ranking.json", "utf8"),
        );

        const rating1 = ranking.pilkarzyki[gameuids[0]].rating;
        const rating2 = ranking.pilkarzyki[gameuids[1]].rating;

        let winner, win;
        if (gameuids[0] == uid) {
            winner = gameuids[1];
            win = false;
        } else {
            winner = gameuids[0];
            win = true;
        }

        const newRating = Elo.calculate(rating1, rating2, win);
        ranking.pilkarzyki[gameuids[0]].rating = newRating["playerRating"];
        ranking.pilkarzyki[gameuids[1]].rating = newRating["opponentRating"];

        ranking.pilkarzyki[uid].lost++;
        ranking.pilkarzyki[winner].won++;
        fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));

        sendBoard(
            id,
            interaction.client,
            mainMessage,
            `<@${winner}> wygrał przez poddanie się przeciwnika.`,
            false,
        );
        delete boards[id];
        delete uids[winner];
        delete uids[uid];
    }
}

/**
 *
 * @param {import("discord.js").ButtonInteraction} interaction
 * @param {import("discord.js").APIMessage | import("discord.js").Message<boolean>} mainMessage
 * @returns {Promise<boolean>}
 */
async function remisManager(interaction, mainMessage) {
    const uid = interaction.user.id;
    const id = uids[uid];

    if (boards[id].withBot) return true;
    if (boards[id].remis.includes(uid)) return true;

    boards[id].remis.push(uid);
    if (boards[id].remis.length == 2) {
        const gameuids = boards[id].uids;
        await sendBoard(id, interaction.client, mainMessage, "Remis", false);
        updateLongestGame(id, boards[id].uids);

        delete boards[id];
        delete uids[gameuids[0]];
        delete uids[gameuids[1]];
        return true;
    }
    return false;
}

/**
 *
 * @param {import("discord.js").ButtonInteraction} interaction
 * @returns
 */
async function buttonWithoutBot(interaction) {
    const uid = interaction.user.id;
    const id = uids[uid];

    if (uid != boards[id].turnUID) return;

    const indexes = boards[id].possibleMovesIndexes();
    if (!indexes.includes(parseInt(interaction.customId))) return;

    boards[id].currMoveLen++;
    if (!boards[id].move(indexes.indexOf(parseInt(interaction.customId)))) {
        console.error("Move wasnt possible");
        return;
    }

    if (boards[id].turnUID != uid) {
        boards[id].longestMove[uid] = Math.max(
            boards[id].longestMove[uid],
            boards[id].currMoveLen,
        );
        boards[id].currMoveLen = 0;

        /** @type {import("../../../types.js").IRanking} */
        const ranking = JSON.parse(
            fs.readFileSync("./data/ranking.json", "utf8"),
        );
        if (ranking.najdluzszyruch[uid] == undefined)
            ranking.najdluzszyruch[uid] = 0;
        ranking.najdluzszyruch[uid] = Math.max(
            ranking.najdluzszyruch[uid],
            boards[id].longestMove[uid],
        );
        fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));
    }
}

/**
 *
 * @param {import("discord.js").ButtonInteraction} interaction
 * @param {import("discord.js").APIMessage | import("discord.js").Message<boolean>} mainMessage
 * @returns
 */
async function buttonWithBot(interaction, mainMessage) {
    const uid = interaction.user.id;
    const id = uids[uid];
    const bid = parseInt(boards[id].uids[1 - boards[id].uids.indexOf(uid)]);

    if (bots[bid].playerTurn == false) return;

    const indexes = boards[id].possibleMovesIndexes();

    if (!indexes.includes(parseInt(interaction.customId))) return;
    if (!boards[id].move(indexes.indexOf(parseInt(interaction.customId)))) {
        console.error("Move wasnt possible");
        return;
    }

    bots[bid].ext_board.makeMove([interaction.customId]);

    let msg,
        components = true;
    if (boards[id].win != -1) {
        if (boards[id].uids[boards[id].win] == uid) msg = `<@${uid}> wygrał!`;
        else msg = "Bot wygrał!";
    } else if (boards[id].turnUID == uid) msg = `Tura: <@${uid}>`;
    else {
        components = false;
        msg = "Bot myśli...";
    }

    sendBoard(id, interaction.client, mainMessage, msg, components);

    if (boards[id].win != -1) {
        delete bots[bid];
        delete boards[id];
        delete uids[uid];
        return;
    }
    if (boards[id].turnUID == uid) return;

    bots[bid].playerTurn = false;

    const start = performance.now();
    bots[bid].ext_board.nodes = 0;
    const move = bots[bid].ext_board.search(
        bots[bid].depth,
        boards[id].turn,
        -2000,
        2000,
    )[1];
    const end = performance.now();

    if (move.length == 0) {
        sendBoard(
            id,
            interaction.client,
            mainMessage,
            `<@${uid}> wygrał!`,
            false,
        );
        delete bots[bid];
        delete boards[id];
        delete uids[uid];
        return;
    }

    const nodes = bots[bid].ext_board.nodes;
    msg = `Bot myślał ${Math.round(((end - start) * 100) / 100)}ms i policzył ${nodes} nodów (${Math.round((nodes / ((end - start) / 1000)) * 100) / 100} nodes/s)`;
    sendBoard(id, interaction.client, mainMessage, msg);
    console.log(
        Math.round((end - start) * 100) / 100 +
            "ms, " +
            nodes +
            " nodes, " +
            Math.round((nodes / ((end - start) / 1000)) * 100) / 100 +
            " nodes/s",
        move,
    );

    let num = 0;
    for (const dir of move) {
        num++;
        await sleep(500);

        const ind = boards[id].possibleMovesIndexes();
        if (!boards[id].move(ind.indexOf(dir))) {
            console.log("AaAAAAAAAAAAaAAAA A aaA wszystko sie jebie");
            return;
        }

        if (num == move.length) continue;

        await sendBoard(id, interaction.client, mainMessage, msg);
    }

    bots[bid].ext_board.makeMove(move);

    if (boards[id].win != -1) {
        if (boards[id].uids[boards[id].win] == uid) msg = `<@${uid}> wygrał!`;
        else msg = "Bot wygrał!";

        sendBoard(id, interaction.client, mainMessage, msg, false);
        delete bots[bid];
        delete boards[id];
        delete uids[uid];
        return;
    }

    sendBoard(id, interaction.client, mainMessage, `Tura: <@${uid}>`);
    bots[bid].playerTurn = true;
}

/**
 *
 * @param {number} gameid
 * @param {string[]} gameuids
 */
function updateLongestGame(gameid, gameuids) {
    /** @type {import("../../../types.js").IRanking} */
    const ranking = JSON.parse(fs.readFileSync("./data/ranking.json", "utf8"));
    const tempuids = [...gameuids];
    let uidsString = "";

    for (const tuid of tempuids.sort()) uidsString += tuid + "#";
    uidsString = uidsString.substring(0, uidsString.length - 1);

    if (ranking.najdluzszagrapilkarzyki[uidsString] == undefined)
        ranking.najdluzszagrapilkarzyki[uidsString] = 0;
    ranking.najdluzszagrapilkarzyki[uidsString] = Math.max(
        boards[gameid].totalMoves,
        ranking.najdluzszagrapilkarzyki[uidsString],
    );

    fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));
}

/**
 *
 * @param {string} inviter
 * @param {string} invited
 * @returns {IAccept | undefined}
 */
function getAcceptByUids(inviter, invited) {
    for (const accept of accepts)
        if (accept.to == invited && accept.from == inviter) return accept;
    return undefined;
}

/**
 *
 * @param {string} inviter
 * @param {string} invited
 * @returns {boolean}
 */
function removeAcceptByUids(inviter, invited) {
    for (let i = 0; i < accepts.length; i++) {
        if (accepts[i].to == invited && accepts[i].from == inviter) {
            accepts.splice(i, 1);
            return true;
        }
    }
    return false;
}

/**
 *
 * @param {number} id
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").APIMessage | import("discord.js").Message<boolean>} message
 * @param {string} content
 * @param {boolean} components
 * @param {import("discord.js").CommandInteraction | undefined} interaction
 */
async function sendBoard(
    id,
    client,
    message,
    content,
    components = true,
    interaction = undefined,
) {
    try {
        boards[id].draw();
    } catch {
        console.error("Couldnt draw board (Probably doesnt exist)");
    }

    const attachment = new AttachmentBuilder(`./tmp/boardPilkarzyki${id}.png`);
    const img = await /** @type {import("discord.js").TextChannel} */ (
        // @ts-expect-error
        client.guilds.cache
            .get(config.junkChannel.guild)
            .channels.cache.get(config.junkChannel.channel)
    ).send({ files: [attachment] });
    // @ts-expect-error
    content += `\n${img.attachments.first().url}`;
    const messagePayload = {
        content: content,
        components: components ? getButtons(id) ?? [] : [],
    };

    if (interaction) message = await interaction.editReply(messagePayload);
    else
        message = await /** @type {import("discord.js").Message<boolean>} */ (
            message
        ).edit(messagePayload);

    try {
        boards[id].message =
            /** @type {import("discord.js").Message<boolean>} */ (message);
    } catch (error) {
        console.error(
            "Couldn't set boards[id].message (probably boards[id] doesnt exist)",
        );
    }
}
