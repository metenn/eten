import fs from "fs";
import Discord, { ColorResolvable, CommandInteraction } from "discord.js";
import { SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders";
import { IRanking } from "../lib/types";

export const data = new SlashCommandBuilder()
	.setName("ranking")
	.setDescription("Rankingi gier")
	.addStringOption(
		new SlashCommandStringOption()
			.setName("gra")
			.setDescription("gra")
			.setRequired(true)
			.addChoice("Piłkarzyki", "pilkarzyki")
			.addChoice("Kwadraty", "kwadraty")
			.addChoice("Drużynowe Pilkarzyki", "teampilkarzyki")
			.addChoice("Najdluższy ruch", "najdluzszyruch")
			.addChoice("Najdluższa gra w drużynowych piłkarzykach", "najdluzszagrateampilkarzyki")
			.addChoice("Najdluższa gra w piłkarzykach", "najdluzszagrapilkarzyki")
			.addChoice("Suma ruchów", "sumaruchow")
			.addChoice("Przegrania w jajco", "jajco")
			.addChoice("Wygrane zakłady", "bets")
	);

export async function execute(interaction: CommandInteraction) {
	const type = interaction.options.getString("gra");
	const ranking: IRanking = JSON.parse(fs.readFileSync("./data/ranking.json", "utf8"))[type];
	const rank = [];


	let desc = "";
	if (type == "najdluzszagrapilkarzyki" || type == "najdluzszagrateampilkarzyki" || type == "najdluzszyruch" || type == "sumaruchow" || type == "jajco" || type == "bets") {
		for (const [key, value] of Object.entries(ranking))
			rank.push({ uids: key, len: value });

		rank.sort(function(a, b) {
			return b["len"] - a["len"];
		});

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
	else {
		for (const [key, value] of Object.entries(ranking)) {
			if (value["rating"] === undefined)
				value["rating"] = 1500;
			if (value["won"] + value["lost"] != 0)
				rank.push({ id: key, won: value["won"], lost: value["lost"], rating: value["rating"] });
		}

		rank.sort(function(a, b) {
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

	let title;
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

	const embed = new Discord.MessageEmbed()
		.setColor(("#" + Math.floor(Math.random() * 16777215).toString(16)) as ColorResolvable)
		.setTitle(title)
		.setDescription(desc);

	interaction.reply({ embeds: [embed] });
}
