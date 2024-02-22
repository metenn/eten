/* eslint-disable @typescript-eslint/no-var-requires */
import { SlashCommandBuilder } from "@discordjs/builders";
import Discord from "discord.js";
import fs from "fs";
import path from "path";
import { Player } from "discord-player";
import config from "./config.json";
import createRequiredFiles from "./lib/createRequiredFiles";
import cronJobs from "./lib/cronJobs";
import * as discordEvents from "./lib/discordEvents";
import incrementDays from "./lib/incrementDays";
import initLibrusManager from "./lib/librusManager";
import randomSounds from "./lib/randomSoundOnVC";
import initThreadManager from "./lib/threadManager";
import { init } from "./openai";
import initRSS from "./lib/rssFeed";

// staszic stuff
import { sendMessages, editMessage, addReaction, sendSzczesliwyNumerekMessages, createSzczesliwyNumerekRoles, upgradeRoles, createFirstYearRoles } from "./lib/staszic/createReactionRoleMessages";

// mimuw
import { create, createReactionMessages } from "./lib/mimuw/create";
import rotateAvatar from "./lib/rotateAvatar";

// LOL
type SlashCommandFunction = ((interaction: Discord.CommandInteraction | Discord.ButtonInteraction | Discord.Message | Discord.ContextMenuInteraction, args?: string) => Promise<unknown>);
interface SlashCommandFile {
	__esModule: boolean;
	data: SlashCommandBuilder;
	execute: SlashCommandFunction;
	autocomplete?: ((interaction: Discord.AutocompleteInteraction) => Promise<unknown>);
	aliases?: string[];
	// pls delete
	onMessage?: SlashCommandFunction;
}
declare module "discord.js" {
	interface Client {
		commands: Discord.Collection<string, SlashCommandFile>;
		imageCdnChannel: Discord.TextChannel;
	}
}

export const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_VOICE_STATES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS], partials: ["MESSAGE", "CHANNEL", "REACTION"] });
client.commands = new Discord.Collection();
export const player = new Player(client);

function getAllFiles(dirPath: string, tsFiles: boolean, arrayOfFiles: Array<string> = []) {
	const files = fs.readdirSync(dirPath);

	files.forEach(function(file) {
		if (fs.statSync(dirPath + "/" + file).isDirectory()) {
			arrayOfFiles = getAllFiles(dirPath + "/" + file, tsFiles, arrayOfFiles);
		}
		else if (file.endsWith(".js") && file.startsWith("ts_") == tsFiles) {
			arrayOfFiles.push(path.join(dirPath, "/", file));
		}
	});

	return arrayOfFiles;
}

async function updateSlashCommands() {
	const slashCommands = [];
	// for javascript command files
	// const commandFiles: string[] = fs.readdirSync(`${__dirname}/commands`).filter((file: string) => (file.endsWith(".js") && !file.startsWith("ts_")));
	const commandFiles = getAllFiles(`${__dirname}/commands`, false);
	for (const file of commandFiles) {
		const command: SlashCommandFile = require(file);
		client.commands.set(command.data.name, command);
		slashCommands.push(command.data.toJSON());
		if ("aliases" in command && command.aliases != null) {
			for (const alias of command.aliases)
				client.commands.set(alias, command);
		}
	}
	// for typescript slash command files
	// const tsCommandFiles: string[] = fs.readdirSync(`${__dirname}/commands`).filter((file: string) => (file.endsWith(".js") && file.startsWith("ts_")));
	const tsCommandFiles = getAllFiles(`${__dirname}/commands`, true);
	for (const file of tsCommandFiles) {
		const command: SlashCommandFile = await import(file);
		client.commands.set(command.data.name, command);
		slashCommands.push(command.data.toJSON());
		// This won't set the aliases in Discord?
		if ("aliases" in command && command.aliases != null) {
			for (const alias of command.aliases)
				client.commands.set(alias, command);
		}
	}
	// for typescript context menu interaction files
	const contextMenuFiles: string[] = fs.readdirSync(`${__dirname}/contextMenus`);
	for (const file of contextMenuFiles) {
		const command: SlashCommandFile = await import(`${__dirname}/contextMenus/${file}`);
		client.commands.set(command.data.name, command);
		slashCommands.push(command.data.toJSON());
	}
	// const guild = await (await client.guilds.fetch("653601807481962534")).commands.set(slashCommands);
	// console.log(await client.application?.commands.set(slashCommands));
	await client.application?.commands.set(slashCommands);
}

client.once("ready", async () => {
	if (client.user == null)
		throw new Error("user does not exist on client");
	console.log(`Logged in as ${client.user.tag}`);
	client.user.setStatus("online");
	// client.user.setActivity("💀", { type: "PLAYING" });
	await updateSlashCommands();

	createRequiredFiles();
	client.imageCdnChannel = await client.channels.fetch(config.autoMemesChannel) as Discord.TextChannel;
	cronJobs(client);
	if (config.librus)
		//await initLibrusManager();
	await initThreadManager();
	await initRSS();
	await init();
	incrementDays();
	randomSounds();
	console.log("Ready!");
	// await rotateAvatar();

	// create();
	// createReactionMessages("1029111804061818941");
	// sendSzczesliwyNumerekMessages("1079803173717430332");
	// createSzczesliwyNumerekRoles();

	// Staszic 2023/2024:
	// upgradeRoles("930512190220435516", "1000439399110148227");
	// createFirstYearRoles("930512190220435516", "G");
	// sendMessages("932694140783833128");
});

client.on("messageReactionAdd", discordEvents.messageReactionAdd);
client.on("messageReactionRemove", discordEvents.messageReactionRemove);
client.on("messageCreate", discordEvents.messageCreate);
client.on("interactionCreate", discordEvents.interactionCreate);

client.login(config.token);
