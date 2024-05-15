import Board from "../../lib/kwadraty/renderer.js";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Client, CommandInteraction, Message, TextChannel, SlashCommandBuilder, SlashCommandUserOption, AttachmentBuilder } from "discord.js";
import fs from "fs";
import Elo from "elo-rating";
import config from "../../config.json" with { type: "json" };;

/** @typedef {{ usernames: Array<string>, uids: Array<string>, from: string, to: string, message?: import("discord.js").APIMessage|import("discord.js").Message<boolean>; }} IAccept */

/** @type {{ [uid: string]: number }} */
const uids = {};
/** @type {{ [id: number]: Board }} */
const boards = {};
/** @type {IAccept[]} */
let accepts = [];
let gameID = 1;

function getButtons() {

	const row = /** @type {ActionRowBuilder<ButtonBuilder>} */ (new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId("kwadraty#remis")
				.setLabel("Remis")
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId("kwadraty#surrender")
				.setLabel("Poddaj się")
				.setStyle(ButtonStyle.Danger)
		));

	return [row];
}

export const data = new SlashCommandBuilder()
	.setName("kwadraty")
	.setDescription("Ta gra co Staś pokazywał w pierwszej klasie")
	.addUserOption(
		new SlashCommandUserOption()
			.setName("gracz")
			.setDescription("Drugi gracz")
			.setRequired(true)
	);

/**
 * 
 * @param {import("discord.js").Interaction} interaction
 * @returns 
 */
export async function execute(interaction) {
	if (interaction.isButton()) {
		interaction;
		const mainMessage = await interaction.update({ content: interaction.message.content, fetchReply: true });
		interaction.customId = interaction.customId.slice(interaction.customId.indexOf("#") + 1);

		if (interaction.customId.startsWith("accept")) {
			acceptManager(interaction, mainMessage);
			return;
		}

		if (!uids[interaction.user.id])
			return;

		if (interaction.customId == "surrender") {
			surrenderManager(interaction, mainMessage);
			return;
		}

		if (interaction.customId == "remis") {
			remisManager(interaction, mainMessage);
			return;
		}
	}
	else if (interaction.isChatInputCommand()) {
		const secondUser = interaction.options.getUser("gracz");
		const uid1 = interaction.user.id;
		// @ts-expect-error
		const uid2 = secondUser.id;
		// @ts-expect-error
		const usernames = [interaction.user.username, secondUser.username];

		if (uids[uid1]) {
			interaction.reply("Już grasz w grę");
			return;
		}
		if (uids[uid2]) {
			interaction.reply(`<@${uid2}> już gra w grę`);
			return;
		}

		if (uid1 == uid2) {
			interaction.reply("Nie możesz grać z samym sobą");
			return;
		}

		for (const accept of accepts) {
			if (accept.to == uid2 && accept.from == uid1) {
				await interaction.reply("Już wyzwałeś tą osobę");
				return;
			}
		}

		/** @type {import("../../../types.js").IRanking} */
		const ranking = JSON.parse(fs.readFileSync("./data/ranking.json", "utf-8"));
		if (ranking.kwadraty[uid1] === undefined)
			ranking.kwadraty[uid1] = { lost: 0, won: 0, rating: (ranking.kwadraty[uid1].rating ? ranking.kwadraty[uid1].rating : 1500) };

		if (ranking.kwadraty[uid2] === undefined)
			ranking.kwadraty[uid2] = { lost: 0, won: 0, rating: (ranking.kwadraty[uid2].rating ? ranking.kwadraty[uid2].rating : 1500) };

		fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));

		/** @type {IAccept} */
		const accept = {
			usernames: usernames,
			uids: [uid1, uid2],
			to: uid2,
			from: uid1
		};

		const row = /** @type {ActionRowBuilder<ButtonBuilder>} */ (new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setLabel("Tak")
					.setCustomId("kwadraty#acceptYes#" + uid1 + "#" + uid2)
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setLabel("Nie")
					.setCustomId("kwadraty#acceptNo#" + uid1 + "#" + uid2)
					.setStyle(ButtonStyle.Danger)
			));

		accept.message = await interaction.reply({
			fetchReply: true,
			content: `<@${uid2}>: ${usernames[0]} chce z tobą zagrać`,
			components: [row]
		});

		accepts.push(accept);
	}
}

/**
 * 
 * @param {import("discord.js").Message} message 
 * @returns 
 */
export async function onMessage(message) {
	const uid = message.author.id;

	if (!uids[uid])
		return;

	const id = uids[uid];

	if (boards[id].turnUID != uid)
		return;

	if (!boards[id].move(message.content))
		return;

	let msg, components;
	if (boards[id].win == -1) {
		msg = `Tura: <@${boards[id].turnUID}> `;
		if (boards[id].remis.length > 0)
			msg += ` (${boards[id].remis.length}/2 osoby poprosiły o remis)`;

	}
	else {
		msg = `<@${boards[id].uids[boards[id].win]}> wygrał`;
	}

	if (boards[id].win == -1)
		components = true;
	else
		components = false;

	// @ts-expect-error
	await sendBoard(id, message.client, boards[id].message, msg, components);

	message.delete();

	if (boards[id].win != -1) {
		/** @type {import("../../../types.js").IRanking} */
		const ranking = JSON.parse(fs.readFileSync("./data/ranking.json", "utf-8"));
		const gameuids = boards[id].uids;

		const player1 = ranking.kwadraty[gameuids[0]].rating;
		const player2 = ranking.kwadraty[gameuids[1]].rating;

		let newRating;
		if (boards[id].win == 0) {
			newRating = Elo.calculate(player1, player2, true);
			ranking.kwadraty[gameuids[0]].won++;
			ranking.kwadraty[gameuids[1]].lost++;
		}
		else {
			newRating = Elo.calculate(player1, player2, false);
			ranking.kwadraty[gameuids[0]].lost++;
			ranking.kwadraty[gameuids[1]].won++;
		}

		ranking.kwadraty[gameuids[0]].rating = newRating["playerRating"];
		ranking.kwadraty[gameuids[1]].rating = newRating["opponentRating"];

		fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));

		boards[id].removeBoard();
		delete boards[id];
		delete uids[gameuids[0]];
		delete uids[gameuids[1]];
	}
}

/**
 * 
 * @param {import("discord.js").ButtonInteraction} interaction 
 * @param {import("discord.js").APIMessage|import("discord.js").Message<boolean>} mainMessage 
 * @returns 
 */
async function remisManager(interaction, mainMessage) {
	const uid = interaction.user.id, id = uids[uid];

	if (boards[id].remis.includes(uid))
		return;

	boards[id].remis.push(uid);
	if (boards[id].remis.length == 2) {
		await sendBoard(id, interaction.client, mainMessage, "Remis", false);

		const guids = boards[id].uids;
		boards[id].removeBoard();
		delete boards[id];
		delete uids[guids[0]];
		delete uids[guids[1]];
	}
}

/**
 * 
 * @param {import("discord.js").ButtonInteraction} interaction 
 * @param {import("discord.js").APIMessage|import("discord.js").Message<boolean>} mainMessage 
 * @returns 
 */
async function surrenderManager(interaction, mainMessage) {
	const uid = interaction.user.id;
	/** @type {import("../../../types.js").IRanking} */
	const ranking = JSON.parse(fs.readFileSync("./data/ranking.json", "utf-8"));
	const gameuids = boards[uids[uid]].uids;

	const rating1 = ranking.kwadraty[gameuids[0]].rating;
	const rating2 = ranking.kwadraty[gameuids[1]].rating;

	let winner, win;
	if (gameuids[0] == interaction.user.id) {
		winner = gameuids[1];
		win = false;
	}
	else {
		winner = gameuids[0];
		win = true;
	}

	const newRating = Elo.calculate(rating1, rating2, win);

	ranking.kwadraty[gameuids[0]].rating = newRating["playerRating"];
	ranking.kwadraty[gameuids[1]].rating = newRating["opponentRating"];

	ranking.kwadraty[interaction.user.id].lost++;
	ranking.kwadraty[winner].won++;
	fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));

	await sendBoard(uids[uid], interaction.client, mainMessage, `<@${winner}> wygrał przez poddanie się przeciwnika`, false);
	boards[uids[uid]].removeBoard();
	delete boards[uids[uid]];
	delete uids[winner];
	delete uids[uid];
}

/**
 * 
 * @param {import("discord.js").ButtonInteraction} interaction 
 * @param {import("discord.js").APIMessage|import("discord.js").Message<boolean>} mainMessage 
 * @returns 
 */
async function acceptManager(interaction, mainMessage) {
	const uidsButton = interaction.customId.split("#");
	const from = uidsButton[1];
	const to = uidsButton[2];

	if (to != interaction.user.id)
		return;

	if (interaction.customId.startsWith("acceptNo")) {
		for (let i = 0; i < accepts.length; i++) {
			const accept = accepts[i];
			if (accept.to == to && accept.from == from) {
				const msg = `${accept.usernames[1]} nie zaakceptował gry z ${accept.usernames[0]}`;
				/** @type {Message} */(accept.message).edit({ content: msg, components: [] });
				accepts.splice(i, 1);
				return;
			}
		}
	}
	else {
		let accept = undefined;
		for (const a of accepts) {
			if (a.to == to && a.from == from) {
				accept = a;
				break;
			}
		}

		if (!accept)
			return;

		const newAccepts = [];
		for (const a of accepts) {
			if (a.from != from && a.to != to)
				newAccepts.push(a);
			else
				// @ts-expect-error
				/** @type {Message} */(a.message).edit({ content: a.message.content, components: [] });
		}

		accepts = newAccepts;
		const id = gameID;
		gameID++;
		uids[from] = id;
		uids[to] = id;

		boards[id] = new Board(50, 50, 50, 3, [from, to], accept.usernames, id);
		boards[id].message = /** @type {Message} */(mainMessage);

		sendBoard(id, interaction.client, mainMessage, `Tura: <@${boards[id].turnUID}>\n`);
	}
}

/**
 * 
 * @param {number} id 
 * @param {Client} client 
 * @param {import("discord.js").APIMessage|import("discord.js").Message<boolean>} message 
 * @param {string} content 
 * @param {boolean} components 
 * @param {import("discord.js").CommandInteraction | undefined} interaction 
 */
async function sendBoard(id, client, message, content, components = true, interaction = undefined) {
	try {
		boards[id].draw();
	}
	catch {
		console.error("Couldnt draw board (Probably doesnt exist)");
	}

	const attachment = new AttachmentBuilder(`./tmp/boardKwadraty${id}.png`);
	// @ts-expect-error
	const img = await /** @type {import("discord.js").TextChannel} */ (client.guilds.cache.get(config.junkChannel.guild).channels.cache.get(config.junkChannel.channel)).send({ files: [attachment] });
	// @ts-expect-error
	content += `\n${img.attachments.first().url}`;
	const messagePayload = {
		content: content,
		components: (components ? getButtons() : [])
	};

	if (interaction)
		message = await interaction.editReply(messagePayload);
	else
		message = await /** @type {Message} */(message).edit(messagePayload);

	try {
		boards[id].message = /** @type {Message<boolean>} */(message);
	}
	catch (error) {
		console.error("Couldn't set boards[id].message (probably boards[id] doesnt exist)");
	}
}
