import Board from "../../lib/pilkarzyki/4players.js";
import fs from "node:fs";
import config from "../../config.json" with { type: "json" };
import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
    SlashCommandUserOption,
} from "discord.js";
import Elo from "elo-rating";

/** @typedef {{ [uid: string]: number; }} IUids */

/** @typedef {{ [id: string]: Board; }} IBoards */

/** @typedef {{uids: Array<string>;usernames: Array<string>;accepted: Array<string>;message?: import("discord.js").APIMessage | import("discord.js").Message<boolean>;}} IAccept */

/** @typedef {{[id: string]: IAccept;}} IAccepts */

/** @type {IUids} */
const uids = {};
/** @type {IBoards} */
const boards = {};
let gameID = 1;
let newAcceptID = 1;
/** @type {IAccepts} */
const accepts = {};

/**
 *
 * @param {number} id
 * @returns {ActionRowBuilder<ButtonBuilder>[] | undefined}
 */
function getButtons(id) {
    let indexes;
    try {
        indexes = boards[id].possibleMovesIndexes();
    } catch (error) {
        console.error(
            "Couldnt get possibleMovesIndexes. Boards probably doesnt exist",
        );
        return;
    }
    /** @type {ButtonStyle} */
    let style;
    if (boards[id].turn % 2 == 0) style = ButtonStyle.Primary;
    else style = ButtonStyle.Danger;

    const row1 = /** @type {ActionRowBuilder<ButtonBuilder>} */ (
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("teampilkarzyki#0")
                .setLabel("↖")
                .setStyle(style)
                .setDisabled(!indexes.includes(0)),
            new ButtonBuilder()
                .setCustomId("teampilkarzyki#1")
                .setLabel("⬆")
                .setStyle(style)
                .setDisabled(!indexes.includes(1)),
            new ButtonBuilder()
                .setCustomId("teampilkarzyki#2")
                .setLabel("↗")
                .setStyle(style)
                .setDisabled(!indexes.includes(2)),
        )
    );
    const row2 = /** @type {ActionRowBuilder<ButtonBuilder>} */ (
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("teampilkarzyki#3")
                .setLabel("⬅")
                .setStyle(style)
                .setDisabled(!indexes.includes(3)),
            new ButtonBuilder()
                .setCustomId("teampilkarzyki#disabled")
                .setLabel("xd")
                .setStyle(style)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId("teampilkarzyki#4")
                .setLabel("➡")
                .setStyle(style)
                .setDisabled(!indexes.includes(4)),
        )
    );
    const row3 = /** @type {ActionRowBuilder<ButtonBuilder>} */ (
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("teampilkarzyki#5")
                .setLabel("↙")
                .setStyle(style)
                .setDisabled(!indexes.includes(5)),
            new ButtonBuilder()
                .setCustomId("teampilkarzyki#6")
                .setLabel("⬇")
                .setStyle(style)
                .setDisabled(!indexes.includes(6)),
            new ButtonBuilder()
                .setCustomId("teampilkarzyki#7")
                .setLabel("↘")
                .setStyle(style)
                .setDisabled(!indexes.includes(7)),
        )
    );
    const row4 = /** @type {ActionRowBuilder<ButtonBuilder>} */ (
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("teampilkarzyki#remis")
                .setLabel("Remis")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("teampilkarzyki#surrender")
                .setLabel("Poddaj się")
                .setStyle(ButtonStyle.Secondary),
        )
    );

    return [row1, row2, row3, row4];
}

export const data = new SlashCommandBuilder()
    .setName("teampilkarzyki")
    .setDescription("Piłkarzyki drużynowe")
    .addUserOption(
        new SlashCommandUserOption()
            .setName("gracz2")
            .setDescription("Drugi gracz (razem z tobą w drużynie)")
            .setRequired(true),
    )
    .addUserOption(
        new SlashCommandUserOption()
            .setName("gracz3")
            .setDescription("Trzeci gracz (w przeciwnej drużynie)")
            .setRequired(true),
    )
    .addUserOption(
        new SlashCommandUserOption()
            .setName("gracz4")
            .setDescription("Czwarty gracz (w przeciwnej drużynie)")
            .setRequired(true),
    );

/**
 *
 * @param {import("discord.js").Interaction} interaction
 * @returns
 */
export async function execute(interaction) {
    if (interaction.isButton()) {
        interaction.customId = interaction.customId.slice(
            interaction.customId.indexOf("#") + 1,
        );

        if (interaction.customId.startsWith("accept")) {
            acceptManager(interaction);
            return;
        }

        if (uids[interaction.user.id] == undefined) return;

        if (interaction.customId == "surrender") {
            if (await surrenderManager(interaction)) return;
        } else if (interaction.customId == "remis") {
            if (await drawManager(interaction)) return;
        } else {
            if (await buttonManager(interaction))
                // shutup funcking eslint
                return;
        }

        let msg = "",
            components;
        const bid = uids[interaction.user.id];
        if (boards[bid].win == -1) {
            components = true;
            msg = `Tura: <@${boards[bid].turnUID}>`;
            if (boards[bid].remis.length > 0)
                msg += ` (${boards[bid].remis.length}/4 osoby poprosiły o remis)`;
            for (let i = 0; i <= 1; i++)
                if (boards[bid].surrender[i].length == 1)
                    msg += ` (<@${boards[bid].surrender[i]}> głosuje za poddaniem się)`;
        } else {
            components = false;
            msg = `<@${boards[bid].uids[boards[bid].win]}> i <@${boards[bid].uids[boards[bid].win + 2]}> wygrali!`;
        }

        sendBoard(
            bid,
            interaction.client,
            interaction.message,
            msg,
            components,
        );

        if (boards[bid].win != -1) {
            const winners = boards[bid].win;
            const losers = (winners + 1) % 2;

            /** @type {import("../../../types.js").IRanking} */
            const wholeRanking = JSON.parse(
                fs.readFileSync("./data/ranking.json", "utf-8"),
            );
            const ranking = wholeRanking.teampilkarzyki;
            const guids = boards[bid].uids;

            const tempuids = [...guids];
            let uidsString = "";
            for (const uid of tempuids.sort()) uidsString += uid + "#";
            uidsString = uidsString.substring(0, uidsString.length - 1);

            if (
                wholeRanking.najdluzszagrateampilkarzyki[uidsString] ===
                undefined
            )
                wholeRanking.najdluzszagrateampilkarzyki[uidsString] = 0;
            wholeRanking.najdluzszagrateampilkarzyki[uidsString] = Math.max(
                boards[bid].totalMoves,
                wholeRanking.najdluzszagrateampilkarzyki[uidsString],
            );

            const losersAverage =
                (ranking[guids[losers]].rating +
                    ranking[guids[losers + 2]].rating) /
                2;
            const winnersAverage =
                (ranking[guids[winners]].rating +
                    ranking[guids[winners + 2]].rating) /
                2;

            ranking[guids[winners]].rating = Elo.calculate(
                ranking[guids[winners]].rating,
                losersAverage,
                true,
            ).playerRating;
            ranking[guids[winners + 2]].rating = Elo.calculate(
                ranking[guids[winners + 2]].rating,
                losersAverage,
                true,
            ).playerRating;

            ranking[guids[losers]].rating = Elo.calculate(
                ranking[guids[losers]].rating,
                winnersAverage,
                false,
            ).playerRating;
            ranking[guids[losers + 2]].rating = Elo.calculate(
                ranking[guids[losers + 2]].rating,
                winnersAverage,
                false,
            ).playerRating;

            ranking[guids[losers]].lost++;
            ranking[guids[losers + 2]].lost++;
            ranking[guids[winners]].won++;
            ranking[guids[winners + 2]].won++;

            wholeRanking.teampilkarzyki = ranking;
            fs.writeFileSync(
                "./data/ranking.json",
                JSON.stringify(wholeRanking),
            );

            for (const uid of boards[bid].uids) delete uids[uid];
            delete boards[bid];
        }
        return;
    } else if (interaction.isChatInputCommand()) {
        const player1 = interaction.user;
        const player2 = interaction.options.getUser("gracz2");
        const player3 = interaction.options.getUser("gracz3");
        const player4 = interaction.options.getUser("gracz4");

        // @ts-expect-error
        const guids = [player1.id, player3.id, player2.id, player4.id];
        const usernames = [
            player1.username,
            // @ts-expect-error
            player3.username,
            // @ts-expect-error
            player2.username,
            // @ts-expect-error
            player4.username,
        ];

        if (uids[guids[0]]) {
            interaction.reply("Już grasz w grę");
            return;
        }
        for (let i = 1; i <= 3; i++) {
            if (uids[guids[i]]) {
                interaction.reply(`<@${guids[i]}> już gra w grę`);
                return;
            }
        }

        /** @type {{ [uid: string]: boolean; }} */
        const check = {};
        for (const uid of guids) {
            if (check[uid]) {
                interaction.reply("Osoby nie mogą się powtarzać");
                return;
            }
            check[uid] = true;
        }

        /** @type {import("../../../types.js").IRanking} */
        const wholeRanking = JSON.parse(
            fs.readFileSync("./data/ranking.json", "utf-8"),
        );
        const ranking = wholeRanking.teampilkarzyki;

        for (const uid of guids) {
            if (ranking[uid] === undefined)
                ranking[uid] = { lost: 0, won: 0, rating: 1500 };
        }

        wholeRanking.teampilkarzyki = ranking;
        fs.writeFileSync("./data/ranking.json", JSON.stringify(wholeRanking));

        /** @type {IAccept} */
        const newAccept = {
            usernames: usernames,
            uids: guids,
            accepted: [],
        };
        const buttonsID = newAcceptID;
        newAcceptID++;

        const row = /** @type {ActionRowBuilder<ButtonBuilder>} */ (
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Tak")
                    .setCustomId("teampilkarzyki#acceptYes#" + buttonsID)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel("Nie")
                    .setCustomId("teampilkarzyki#acceptNo#" + buttonsID)
                    .setStyle(ButtonStyle.Primary),
            )
        );
        const msg = `Drużynowe piłkarzyki: <@${guids[0]}> i <@${guids[2]}> przeciwko <@${guids[1]}> i <${guids[3]}>`;
        const message = await interaction.reply({
            content: msg,
            components: [row],
            fetchReply: true,
        });
        newAccept.message = message;

        accepts[buttonsID] = newAccept;
    }
}

/**
 *
 * @param {import("discord.js").ButtonInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function buttonManager(interaction) {
    const bid = uids[interaction.user.id];

    if (interaction.user.id != boards[bid].turnUID) return true;

    const indexes = boards[bid].possibleMovesIndexes();
    if (!indexes.includes(parseInt(interaction.customId))) return true;

    boards[bid].currMoveLen++;
    if (!boards[bid].move(indexes.indexOf(parseInt(interaction.customId))))
        return true;

    if (boards[bid].turnUID != interaction.user.id) {
        boards[bid].longestMove[interaction.user.id] = Math.max(
            boards[bid].longestMove[interaction.user.id],
            boards[bid].currMoveLen,
        );
        boards[bid].currMoveLen = 0;

        /** @type {import("../../../types.js").IRanking} */
        const ranking = JSON.parse(
            fs.readFileSync("./data/ranking.json", "utf-8"),
        );
        if (ranking.najdluzszyruch[interaction.user.id] == undefined)
            ranking.najdluzszyruch[interaction.user.id] = 0;
        ranking.najdluzszyruch[interaction.user.id] = Math.max(
            ranking.najdluzszyruch[interaction.user.id],
            boards[bid].longestMove[interaction.user.id],
        );
        fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));
    }

    return false;
}

/**
 *
 * @param {import("discord.js").ButtonInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function drawManager(interaction) {
    const bid = uids[interaction.user.id];
    if (boards[bid].remis.includes(interaction.user.id)) return true;

    boards[bid].remis.push(interaction.user.id);
    if (boards[bid].remis.length == 4) {
        sendBoard(bid, interaction.client, interaction.message, "Remis", false);

        /** @type {import("../../../types.js").IRanking} */
        const wholeRanking = JSON.parse(
            fs.readFileSync("./data/ranking.json", "utf-8"),
        );
        const guids = boards[bid].uids;

        const tempuids = [...guids];
        let uidsString = "";
        for (const uid of tempuids.sort()) uidsString += uid + "#";
        uidsString = uidsString.substring(0, uidsString.length - 1);

        if (wholeRanking.najdluzszagrateampilkarzyki[uidsString] === undefined)
            wholeRanking.najdluzszagrateampilkarzyki[uidsString] = 0;
        wholeRanking.najdluzszagrateampilkarzyki[uidsString] = Math.max(
            boards[bid].totalMoves,
            wholeRanking.najdluzszagrateampilkarzyki[uidsString],
        );
        fs.writeFileSync("./data/ranking.json", JSON.stringify(wholeRanking));

        for (const uid of boards[bid].uids) delete uids[uid];
        delete boards[bid];
        return true;
    }
    return false;
}

/**
 *
 * @param {import("discord.js").ButtonInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function surrenderManager(interaction) {
    const bid = uids[interaction.user.id];

    if (
        boards[bid].surrender[
            boards[bid].uids.indexOf(interaction.user.id) % 2
        ].includes(interaction.user.id)
    )
        return true;
    boards[bid].surrender[
        boards[bid].uids.indexOf(interaction.user.id) % 2
    ].push(interaction.user.id);

    if (
        boards[bid].surrender[boards[bid].uids.indexOf(interaction.user.id) % 2]
            .length == 2
    ) {
        const losers = boards[bid].uids.indexOf(interaction.user.id) % 2;
        const winners = (losers + 1) % 2;

        sendBoard(
            bid,
            interaction.client,
            interaction.message,
            `<@${boards[bid].uids[losers]}> i <@${boards[bid].uids[losers + 2]}> poddali się`,
            false,
        );

        /** @type {import("../../../types.js").IRanking} */
        const wholeRanking = JSON.parse(
            fs.readFileSync("./data/ranking.json", "utf-8"),
        );
        const ranking = wholeRanking.teampilkarzyki;
        const guids = boards[bid].uids;

        const tempuids = [...guids];
        let uidsString = "";
        for (const uid of tempuids.sort()) uidsString += uid + "#";
        uidsString = uidsString.substring(0, uidsString.length - 1);

        if (wholeRanking.najdluzszagrateampilkarzyki[uidsString] == undefined)
            wholeRanking.najdluzszagrateampilkarzyki[uidsString] = 0;
        wholeRanking.najdluzszagrapilkarzyki[uidsString] = Math.max(
            wholeRanking.najdluzszagrapilkarzyki[uidsString],
            boards[bid].totalMoves,
        );

        const losersAverage =
            (ranking[guids[losers]].rating +
                ranking[guids[losers + 2]].rating) /
            2;
        const winnersAverage =
            (ranking[guids[winners]].rating +
                ranking[guids[winners + 2]].rating) /
            2;
        ranking[guids[winners]].rating = Elo.calculate(
            ranking[guids[winners]].rating,
            losersAverage,
            true,
        ).playerRating;
        ranking[guids[winners + 2]].rating = Elo.calculate(
            ranking[guids[winners + 2]].rating,
            losersAverage,
            true,
        ).playerRating;

        ranking[guids[losers]].rating = Elo.calculate(
            ranking[guids[losers]].rating,
            winnersAverage,
            false,
        ).playerRating;
        ranking[guids[losers + 2]].rating = Elo.calculate(
            ranking[guids[losers + 2]].rating,
            winnersAverage,
            false,
        ).playerRating;

        ranking[guids[losers]].lost++;
        ranking[guids[losers + 2]].lost++;
        ranking[guids[winners]].won++;
        ranking[guids[winners + 2]].won++;

        wholeRanking.teampilkarzyki = ranking;
        fs.writeFileSync("./data/ranking.json", JSON.stringify(wholeRanking));

        for (const uid of boards[bid].uids) delete uids[uid];
        delete boards[bid];
        return true;
    }
    return false;
}

/**
 *
 * @param {import("discord.js").ButtonInteraction} interaction
 * @returns
 */
async function acceptManager(interaction) {
    const bUids = interaction.customId.split("#");
    const acceptID = bUids[1];
    const accept = accepts[acceptID];

    if (accept === undefined) return;

    if (!accept.uids.includes(interaction.user.id)) return;

    if (interaction.customId.startsWith("acceptNo")) {
        /** @type {import("discord.js").Message} */ (accept.message).edit({
            content: `${interaction.user.username} nie zaakceptował gry`,
            components: [],
        });
        delete accepts[acceptID];
        return;
    } else {
        if (accept.accepted.includes(interaction.user.id)) return;
        accept.accepted.push(interaction.user.id);

        if (accept.accepted.length != 4) {
            const guids = accept.uids;
            const msg = `Drużynowe piłkarzyki: <@${guids[0]}> i <@${guids[2]}> przeciwko <@${guids[1]}> i <@${guids[3]}> (${accept.accepted.length}/4 osób zaakceptowało)`;
            const row = /** @type {ActionRowBuilder<ButtonBuilder>} */ (
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel("Tak")
                        .setCustomId("teampilkarzyki#acceptYes#" + acceptID)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setLabel("Nie")
                        .setCustomId("teampilkarzyki#acceptNo#" + acceptID)
                        .setStyle(ButtonStyle.Danger),
                )
            );
            interaction.update({ content: msg, components: [row] });
            return;
        } else {
            delete accepts[acceptID];

            for (const uid of accept.uids) {
                for (const [id, acc] of Object.entries(accepts)) {
                    if (acc.uids.includes(uid)) {
                        /** @type {import("discord.js").Message} */ (
                            acc.message
                        ).edit({
                            // @ts-expect-error
                            content: acc.message.content,
                            components: [],
                        });
                        delete accepts[id];
                    }
                }
            }

            const gid = gameID;
            gameID++;
            for (const uid of accept.uids) uids[uid] = gid;

            boards[gid] = new Board(
                50,
                50,
                50,
                3,
                accept.uids,
                accept.usernames,
                gid,
            );
            sendBoard(
                gid,
                interaction.client,
                interaction.message,
                `Tura: <@${boards[gid].turnUID}>`,
            );
        }
    }
}

/**
 *
 * @param {number} id
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").APIMessage | import("discord.js").Message<boolean>} message
 * @param {string} content
 * @param {boolean} components
 * @param {import("discord.js").CommandInteraction|undefined} interaction
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

    const attachment = new AttachmentBuilder(
        `./tmp/boardTeamPilkarzyki${id}.png`,
    );
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
        message = await /** @type {import("discord.js").Message} */ (
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
