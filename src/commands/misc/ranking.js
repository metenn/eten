import { EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption } from "discord.js";
import fs from "node:fs";
import { repeatingDigitsText } from "../../lib/types.js";

export const data = new SlashCommandBuilder()
	.setName("ranking")
	.setDescription("Rankingi gier")
	.addStringOption(
		new SlashCommandStringOption()
			.setName("gra")
			.setDescription("gra")
			.setRequired(true)
			.addChoices({ "name": "Piłkarzyki", "value": "pilkarzyki" })
			.addChoices({ "name": "Kwadraty", "value": "kwadraty" })
			.addChoices({ "name": "Drużynowe Pilkarzyki", "value": "teampilkarzyki" })
			.addChoices({ "name": "Najdluższy ruch", "value": "najdluzszyruch" })
			.addChoices({ "name": "Najdluższa gra w drużynowych piłkarzykach", "value": "najdluzszagrateampilkarzyki" })
			.addChoices({ "name": "Najdluższa gra w piłkarzykach", "value": "najdluzszagrapilkarzyki" })
			.addChoices({ "name": "Suma ruchów", "value": "sumaruchow" })
			.addChoices({ "name": "Przegrania w jajco", "value": "jajco" })
			.addChoices({ "name": "Wygrane zakłady", "value": "bets" })
			.addChoices({ "name": "Powtarzające się cyferki", "value": "dubs" })
			.addChoices({ "name": "Prawdopodobieństwo na cyferki", "value": "dubspercent" })
	)
	.addUserOption(
		new SlashCommandUserOption()
			.setName("gracz")
			.setDescription("Wyświetl wyniki szczególnego gracza")
			.setRequired(false)
	);

/**
 * 
 * @param {import("discord.js").ChatInputCommandInteraction} interaction 
 */
export async function execute(interaction) {
	const type = interaction.options.getString("gra");
	const mentionedUser = interaction.options.getUser("gracz", false);
	// why
	/** @type {any} */
	const fullRanking = JSON.parse(fs.readFileSync("./data/ranking.json", "utf8"));
	/** @type {import("../../../types.js").IRanking} */
	// @ts-expect-error
	const ranking = fullRanking[type];
	let rank = [];


	let desc = "";
	if (type == "najdluzszagrapilkarzyki" || type == "najdluzszagrateampilkarzyki" || type == "najdluzszyruch" || type == "sumaruchow" || type == "jajco" || type == "bets") {
		for (const [key, value] of Object.entries(ranking))
			rank.push({ uids: key, len: value });

		rank.sort(function (a, b) {
			return b["len"] - a["len"];
		});
		console.log(rank);
		rank = rank.slice(0, 50);
		console.log(rank);

		if (type == "jajco") {
			for (let i = 0; i < rank.length; i++) {
				const r = rank[i];
				desc += String(i + 1) + ". <@" + r["uids"] + ">: " + r["len"] + " przegranych\n";
			}
		}
		else if (type == "bets") {
			for (let i = 0; i < rank.length; i++) {
				const r = rank[i];
				desc += String(i + 1) + ". <@" + r["uids"] + ">: " + r["len"] + " wygranych\n";
			}
		}
		else if (type == "najdluzszyruch" || type == "sumaruchow") {
			for (let i = 0; i < rank.length; i++) {
				const r = rank[i];
				desc += String(i + 1) + ". <@" + r["uids"] + ">: " + r["len"] + " ruchów\n";
			}
		}
		else {
			for (let i = 0; i < Math.min(10, rank.length); i++) {
				const r = rank[i];
				const uids = r["uids"].split("#");
				let usrnames = "";
				if (type == "najdluzszagrapilkarzyki")
					usrnames = "<@" + uids[0] + "> i <@" + uids[1] + ">";
				else
					usrnames = "<@" + uids[0] + ">, <@" + uids[1] + ">, <@" + uids[2] + "> i <@" + uids[3] + ">";
				desc += String(i + 1) + ". " + usrnames + ": " + r["len"] + " ruchów\n";
			}
		}
	}
	else if (type === "dubs") {
		const dubRankinkg = /** @type {import("../../../types.js").IRanking} */(fullRanking).dubs;
		if (mentionedUser == null) {
			// Create array: {DiscordID, top number of repeating digits}
			// for easier sorting
			/** @type {Array<{ user: import("discord.js").Snowflake, topDub: number; }>} */
			const userTopDubs = [];
			for (const [userId, dubRecord] of Object.entries(dubRankinkg)) {
				let topDub = 0;
				for (const dubTier of Object.keys(dubRecord)) {
					if (Number(dubTier) > topDub)
						topDub = Number(dubTier);
				}
				userTopDubs.push({ user: userId, topDub: topDub });
			}

			// Sort based of top dub number first, if equal - quantity of that top dub
			userTopDubs.sort(function (a, b) {
				if (a.topDub === b.topDub)
					return dubRankinkg[b.user][b.topDub] - dubRankinkg[a.user][a.topDub];
				return b.topDub - a.topDub;
			});
			// Set description
			for (let i = 0; i < Math.min(15, userTopDubs.length); i++) {
				const userTopDub = userTopDubs[i];
				desc = desc.concat(`<@${userTopDub.user}>: ${repeatingDigitsText[userTopDub.topDub]} x${dubRankinkg[userTopDub.user][userTopDub.topDub]}\n`);
			}
		}
		else {
			// Generate description for user
			desc = `Statystyki <@${mentionedUser.id}>\n`;
			if (!(mentionedUser.id in dubRankinkg)) {
				desc = desc.concat("Nie doświadczył żadnych powtarzających się numerków");
			}
			else {
				// Sorted by top dub
				/** @type {Array<{ dubTier: number, count: number; }>} */
				const userDubsArr = [];
				for (const [dubTier, count] of Object.entries(dubRankinkg[mentionedUser.id])) {
					userDubsArr.push({ dubTier: Number(dubTier), count: count });
				}
				userDubsArr.sort(function (a, b) {
					return b.dubTier - a.dubTier;
				});
				for (const entry of userDubsArr) {
					if (entry.dubTier == 1)
						break;
					desc = desc.concat(`${repeatingDigitsText[entry.dubTier]} x${entry.count}\n`);
				}
				desc = desc.concat(`Bez powtarzania: ${dubRankinkg[mentionedUser.id][1]}`);
			}
		}
	}
	else if (type === "dubspercent") {
		const dubRankinkg = /** @type {import("../../../types.js").IRanking} */(fullRanking).dubs;
		// Create array: {DiscordID, top number of repeating digits}
		// for easier sorting
		/** @type {Array<{ user: import("discord.js").Snowflake, topDub: number; }>} */
		const userTopDubs = [];
		for (const [userId, dubRecord] of Object.entries(dubRankinkg)) {
			let topDub = 0;
			for (const dubTier of Object.keys(dubRecord)) {
				if (Number(dubTier) > topDub)
					topDub = Number(dubTier);
			}
			userTopDubs.push({ user: userId, topDub: topDub });
		}

		// Sort based of top dub number first, if equal - quantity of that top dub
		userTopDubs.sort(function (a, b) {
			if (a.topDub === b.topDub)
				return dubRankinkg[b.user][b.topDub] - dubRankinkg[a.user][a.topDub];
			return b.topDub - a.topDub;
		});
		const max = userTopDubs[0].topDub;
		// Count total occurences of numbers repeating N times
		const arr = /** @type {Array<number>} */(new Array(21)).fill(0);
		for (const dubRecord of Object.values(dubRankinkg)) {
			for (let i = 1; i <= max; i++) {
				if (i in dubRecord) {
					arr[i] += dubRecord[i];
				}
			}
		}
		// Count up the total of all occurences (for probability)
		let total = 0;
		for (let i = 1; i <= max; i++)
			total += arr[i];
		// Append desc
		for (let i = 1; i <= max; i++) {
			desc = desc.concat(`${repeatingDigitsText[i]}: ${((arr[i] / total) * 100).toFixed(3)}%\n`);
		}
	}
	else {
		for (const [key, value] of Object.entries(ranking)) {
			if (value["rating"] === undefined)
				value["rating"] = 1500;
			if (value["won"] + value["lost"] != 0)
				rank.push({ id: key, won: value["won"], lost: value["lost"], rating: value["rating"] });
		}

		rank.sort(function (a, b) {
			if (b["rating"] == a["rating"])
				return (b["won"] / (b["won"] + b["lost"])) - (a["won"] / (a["won"] + a["lost"]));
			return b["rating"] - a["rating"];
		});

		desc = "";
		for (let i = 0; i < rank.length; i++) {
			const r = rank[i];
			desc += String(i + 1) + ". <@" + r["id"] + "> ELO rating " + String(Math.round(r["rating"])) + " (" + r["won"] + " wygranych, " + r["lost"] + " przegranych)\n";
		}
	}

	let title = "Nie powinieneś tego widzieć.";
	if (type == "pilkarzyki")
		title = "Ranking piłkarzyków";
	else if (type == "kwadraty")
		title = "Ranking kwadratów";
	else if (type == "teampilkarzyki")
		title = "Ranking drużynowych piłkarzyków";
	else if (type == "najdluzszagrapilkarzyki")
		title = "Ranking najdłuższych gier piłkarzyków (max 10)";
	else if (type == "najdluzszagrateampilkarzyki")
		title = "Ranking najdłuższych gier drużynowych piłkarzyków (max 10)";
	else if (type == "najdluzszyruch")
		title = "Ranking najdłuższych ruchów";
	else if (type == "sumaruchow")
		title = "Ranking ilości ruchów";
	else if (type == "jajco")
		title = "Ranking przegranych w jajco";
	else if (type == "bets")
		title = "Ranking wygranych zakładów o godzine postowania ogłoszeń";
	else if (type === "dubs")
		title = "Ranking poświadczonych numerków";
	else if (type === "dubspercent")
		title = "Prawdopodobieństwo na doświadczenie numerka";

	const embed = new EmbedBuilder()
		.setColor(/** @type {import("discord.js").ColorResolvable} */("#" + Math.floor(Math.random() * 16777215).toString(16)))
		.setTitle(title)
		.setDescription(desc);

	interaction.reply({ embeds: [embed] });
}
