import { GatewayIntentBits, Client, Partials, Collection } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { Player } from "discord-player";
import config from "./config.json" with { type: "json" };
import createRequiredFiles from "./lib/createRequiredFiles.js";
import cronJobs from "./lib/cronJobs.js";
import * as discordEvents from "./lib/discordEvents/index.js";
import incrementDays from "./lib/incrementDays.js";
import randomSounds from "./lib/randomSoundOnVC.js";
import { init } from "./openai/index.js";
import initRSS from "./lib/rssFeed.js";

// staszic stuff
import {
    sendMessages,
    editMessage,
    addReaction,
    sendSzczesliwyNumerekMessages,
    createSzczesliwyNumerekRoles,
    upgradeRoles,
    createFirstYearRoles,
} from "./lib/staszic/createReactionRoleMessages.js";

// mimuw
import { create, createReactionMessages } from "./lib/mimuw/create.js";
import rotateAvatar from "./lib/rotateAvatar.js";
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
client.commands = new Collection();
// @ts-expect-error
export const player = new Player(client);
player.extractors.loadDefault();

/**
 *
 * @param {string} dirPath
 * @param {string[]} arrayOfFiles
 * @returns {string[]}
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else if (file.endsWith(".js")) {
            arrayOfFiles.push(path.join(dirPath + "/", file));
        }
    });

    return arrayOfFiles;
}

async function updateSlashCommands() {
    /** @type {any[]} */
    const slashCommands = [];
    // for typescript slash command files
    const tsCommandFiles = getAllFiles("src/commands");
    console.log(tsCommandFiles);
    for (const file of tsCommandFiles) {
        console.log(file.substring(4).replaceAll("\\", "/"));
        /** @type {import("../types.js").SlashCommandFile} */
        const command = await import(`./${file.substring(4)}`);
        client.commands.set(command.data.name, command);
        slashCommands.push(command.data.toJSON());
        // This won't set the aliases in Discord?
        if ("aliases" in command && command.aliases != null) {
            for (const alias of command.aliases)
                client.commands.set(alias, command);
        }
    }
    // for typescript context menu interaction files
    const contextMenuFiles = fs.readdirSync(`./src/contextMenus`);
    console.log(contextMenuFiles);
    for (const file of contextMenuFiles) {
        const command = /** @type {SlashCommandFile} */ await import(
            `./contextMenus/${file}`
        );
        client.commands.set(command.data.name, command);
        slashCommands.push(command.data.toJSON());
    }
    await client.application?.commands.set(slashCommands);
}

client.once("ready", async () => {
    if (client.user == null) throw new Error("user does not exist on client");
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setStatus("online");
    // client.user.setActivity("💀", { type: "PLAYING" });
    await updateSlashCommands();

    createRequiredFiles();
    client.imageCdnChannel = /** @type {import("discord.js").TextChannel} */ (
        await client.channels.fetch(config.autoMemesChannel)
    );
    cronJobs(client);
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
