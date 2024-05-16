import { MessageType } from "discord.js";
import fs from "node:fs";

/** @type {string|undefined} */
let coChannel = undefined;
/** @type {any} */
let coUsers;

/**
 *
 * @param {import("discord.js").Message<boolean>} message
 */
async function deleteMessage(message) {
    message.delete().catch((error) => console.error(error));
}

/**
 *
 * @param {import("discord.js").Message<boolean>} message
 */
function updateMessage(message) {
    message.edit("jajco");
}

/**
 *
 * @param {import("discord.js").Client<boolean>} client
 */
async function coCountdown(client) {
    try {
        if (coUsers.count == 0) clearInterval(coUsers.interval);

        if (coUsers.count >= 0) {
            /** @type {import("discord.js").TextChannel} */ (
                // @ts-expect-error
                client.channels.cache.get(coChannel)
            )
                .send(String(coUsers.count))
                .then((message) => {
                    setTimeout(
                        deleteMessage.bind(null, message),
                        10000 + parseInt(message.content) * 1000,
                    );
                });

            coUsers.count--;
            if (coUsers.count >= 0) return;
        }
        const msg = "<@" + coUsers.jajco + "> skisł*ś";

        const ranking = JSON.parse(
            fs.readFileSync("./data/ranking.json", "utf-8"),
        );
        if (ranking["jajco"][coUsers.jajco] === undefined)
            ranking["jajco"][coUsers.jajco] = 0;
        ranking["jajco"][coUsers.jajco]++;

        fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));

        /** @type {import("discord.js").TextChannel} */ (
            // @ts-expect-error
            client.channels.cache.get(coChannel)
        ).send(msg);
        coChannel = undefined;
        coUsers = undefined;
    } catch (error) {
        console.log(error);
    }
}

/**
 *
 * @param {import("discord.js").Message} message
 */
export async function run(message) {
    // const settings = require(`${process.cwd()}/data/settings.json`)
    const settings = JSON.parse(
        fs.readFileSync("./data/settings.json", "utf-8"),
    );
    let isBanned = false;

    if (
        settings.jajco &&
        // @ts-expect-error
        (settings.jajco.bannedGuilds.includes(message.guild.id) ||
            settings.jajco.bannedUsers.includes(message.author.id))
    )
        isBanned = true;

    const messageLower = message.content.toLowerCase();
    if (
        (messageLower.endsWith(" co") ||
            messageLower.endsWith(" co?") ||
            messageLower == "co" ||
            messageLower == "co?") &&
        coChannel === undefined &&
        !isBanned
    ) {
        coUsers = {
            jajco: message.author.id,
            daszek: [],
            count: 10,
            interval: undefined,
            messages: [],
        };
        coChannel = message.channel.id;

        coUsers.interval = setInterval(
            coCountdown.bind(null, message.client),
            1000,
        );

        const msg = await message.channel.send(
            "https://cdn.discordapp.com/attachments/917846513831534732/1036414875519418388/jajco-szkielet.gif",
        );
        setTimeout(updateMessage.bind(null, msg), 25000);
    } else if (message.content == "^" && coChannel !== undefined) {
        coUsers.daszek.push(message.author.id);
    } else if (
        coChannel !== undefined &&
        message.author.id === coUsers.jajco &&
        message.mentions.users.size > 0 &&
        !coUsers.daszek.includes(message.mentions.users.keys().next().value) &&
        message.type != MessageType.Reply
    ) {
        const uid = message.mentions.users.keys().next().value;
        if (uid == message.client.user.id) {
            if (
                Math.random() <= 0.01 &&
                !coUsers.daszek.includes("257119850026106880")
            ) {
                message.channel.send("<@257119850026106880>");
                coUsers.jajco = "257119850026106880";
                return;
            } else {
                message.channel.send("Twoja stara");
                return;
            }
        }
        coUsers.jajco = uid;
    }
}
