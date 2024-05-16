import fs from "node:fs";
import config from "../../config.json" with { type: "json" };
import {
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandUserOption,
} from "discord.js";

/**
 *
 * @param {import("../../../types.js").ISettingsWhere[]} array
 * @param {import("../../../types.js").ISettingsWhere} dict
 * @returns
 */
function includesDict(array, dict) {
    for (const a of array) {
        if (JSON.stringify(dict) === JSON.stringify(a)) return true;
    }
    return false;
}

export const data = new SlashCommandBuilder()
    .setName("manage")
    .setDescription("Różne ustawienia bota")
    .addSubcommand((subcommand) =>
        subcommand
            .setName("guild")
            .setDescription(
                "Ustawienia dotyczące tej gildii (lub innej wsm też)",
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("option")
                    .setDescription("różne opcje")
                    .setRequired(true)
                    .addChoices({ name: "block jajco", value: "banjajco" })
                    .addChoices({ name: "unblock jajco", value: "unbanjajco" }),
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("additional")
                    .setDescription("Dodatkowe informacji (np. id guildi)")
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName("user")
            .setDescription("Ustawienia dotyczące użytkownika")
            .addUserOption(
                new SlashCommandUserOption()
                    .setName("user")
                    .setDescription("Użytkownik")
                    .setRequired(true),
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("option")
                    .setDescription("Opcje")
                    .setRequired(true)
                    .addChoices({ name: "ban jajco", value: "banjajco" })
                    .addChoices({ name: "unban jajco", value: "unbanjajco" }),
            ),
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName("channel")
            .setDescription("Ustawienia kanałów")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("option")
                    .setDescription("Opcja")
                    .setRequired(true)
                    .addChoices({ name: "dodaj", value: "add" })
                    .addChoices({ name: "usuń", value: "remove" }),
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("what")
                    .setDescription("co zmienić")
                    .setRequired(true)
                    .addChoices({ name: "pogoda", value: "pogoda" })
                    .addChoices({ name: "inspiracja", value: "inspiracja" })
                    .addChoices({
                        name: "ogłoszenia z librusa",
                        value: "notices",
                    }),
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("guild")
                    .setDescription("ID Gildii")
                    .setRequired(false),
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("channel")
                    .setDescription("ID kanału")
                    .setRequired(false),
            )
            .addBooleanOption(
                new SlashCommandBooleanOption()
                    .setName("roles")
                    .setDescription(
                        "czy oznaczać role (wymagane tylko przy ogłoszeniach) default=false",
                    )
                    .setRequired(false),
            ),
    );

/**
 *
 * @param {import("discord.js").CommandInteraction} interaction
 * @returns
 */
export async function execute(interaction) {
    if (!config.adminID.includes(interaction.user.id)) return;
    if (
        interaction.isChatInputCommand === undefined ||
        !interaction.isChatInputCommand()
    ) {
        await interaction.reply("Pls slash komenda");
        return;
    }

    /** @type {import("../../../types.js").ISettings} */
    const settings = JSON.parse(
        fs.readFileSync("./data/settings.json", "utf8"),
    );

    if (interaction.options.getSubcommand() === "guild") {
        const option = interaction.options.getString("option");
        const additional = interaction.options.getString("additional");

        if (option == "banjajco") {
            if (
                !settings.jajco.bannedGuilds.includes(
                    // @ts-expect-error
                    additional ? additional : interaction.guild.id,
                )
            ) {
                settings.jajco.bannedGuilds.push(
                    // @ts-expect-error
                    additional ? additional : interaction.guild.id,
                );
                fs.writeFileSync(
                    "./data/settings.json",
                    JSON.stringify(settings, null, 2),
                );
            }
            interaction.reply("ok");
        } else if (option == "unbanjajco") {
            if (
                settings.jajco.bannedGuilds.includes(
                    // @ts-expect-error
                    additional ? additional : interaction.guild.id,
                )
            ) {
                settings.jajco.bannedGuilds.splice(
                    settings.jajco.bannedGuilds.indexOf(
                        // @ts-expect-error
                        additional ? additional : interaction.guild.id,
                    ),
                    1,
                );
                fs.writeFileSync(
                    "./data/settings.json",
                    JSON.stringify(settings, null, 2),
                );
            }
            interaction.reply("ok");
        }
    }

    if (interaction.options.getSubcommand() === "user") {
        const option = interaction.options.getString("option");
        const user = interaction.options.getUser("user");

        if (option == "banjajco") {
            // @ts-expect-error
            if (!settings.jajco.bannedUsers.includes(user.id)) {
                // @ts-expect-error
                settings.jajco.bannedUsers.push(user.id);
                fs.writeFileSync(
                    "./data/settings.json",
                    JSON.stringify(settings, null, 2),
                );
            }
            interaction.reply("ok");
        } else if (option == "unbanjajco") {
            // @ts-expect-error
            if (settings.jajco.bannedUsers.includes(user.id)) {
                settings.jajco.bannedUsers.splice(
                    // @ts-expect-error
                    settings.jajco.bannedUsers.indexOf(user.id),
                    1,
                );
                fs.writeFileSync(
                    "./data/settings.json",
                    JSON.stringify(settings, null, 2),
                );
            }
            interaction.reply("ok");
        }
    }

    if (interaction.options.getSubcommand() === "channel") {
        const option = interaction.options.getString("option");
        const what = interaction.options.getString("what");
        let guild = interaction.options.getString("guild");
        let channel = interaction.options.getString("channel");
        let roles = interaction.options.getBoolean("roles");

        if (!guild) {
            guild = interaction.guildId;
            channel = interaction.channelId;
        }
        if (roles == null) roles = false;

        if (what == "pogoda") {
            if (option == "add") {
                if (
                    !includesDict(settings.pogoda.where, {
                        // @ts-expect-error
                        guild: guild,
                        // @ts-expect-error
                        channel: channel,
                    })
                )
                    settings.pogoda.where.push({
                        // @ts-expect-error
                        guild: guild,
                        // @ts-expect-error
                        channel: channel,
                    });
            } else if (
                includesDict(settings.pogoda.where, {
                    // @ts-expect-error
                    guild: guild,
                    // @ts-expect-error
                    channel: channel,
                })
            ) {
                settings.pogoda.where.splice(
                    settings.pogoda.where.indexOf({
                        // @ts-expect-error
                        guild: guild,
                        // @ts-expect-error
                        channel: channel,
                    }),
                    1,
                );
            }
        } else if (what == "inspiracja") {
            if (option == "add") {
                if (
                    !includesDict(settings.inspiracja.where, {
                        // @ts-expect-error
                        guild: guild,
                        // @ts-expect-error
                        channel: channel,
                    })
                )
                    settings.inspiracja.where.push({
                        // @ts-expect-error
                        guild: guild,
                        // @ts-expect-error
                        channel: channel,
                    });
            } else if (
                includesDict(settings.inspiracja.where, {
                    // @ts-expect-error
                    guild: guild,
                    // @ts-expect-error
                    channel: channel,
                })
            ) {
                settings.inspiracja.where.splice(
                    settings.inspiracja.where.indexOf({
                        // @ts-expect-error
                        guild: guild,
                        // @ts-expect-error
                        channel: channel,
                    }),
                    1,
                );
            }
        } else if (what == "notices") {
            if (option == "add") {
                if (
                    !includesDict(settings.notices.where, {
                        // @ts-expect-error
                        guild: guild,
                        // @ts-expect-error
                        channel: channel,
                        roles: roles,
                    })
                )
                    settings.notices.where.push({
                        // @ts-expect-error
                        guild: guild,
                        // @ts-expect-error
                        channel: channel,
                        roles: roles,
                    });
            } else if (
                includesDict(settings.notices.where, {
                    // @ts-expect-error
                    guild: guild,
                    // @ts-expect-error
                    channel: channel,
                    roles: roles,
                })
            ) {
                settings.notices.where.splice(
                    settings.notices.where.indexOf({
                        // @ts-expect-error
                        guild: guild,
                        // @ts-expect-error
                        channel: channel,
                        roles: roles,
                    }),
                    1,
                );
            }
        }

        fs.writeFileSync(
            "./data/settings.json",
            JSON.stringify(settings, null, 2),
        );
        interaction.reply("ok");
    }
}
