import fs from "node:fs";
import {
    SlashCommandBuilder,
    SlashCommandStringOption,
    AttachmentBuilder,
} from "discord.js";
import Board from "../../lib/pilkarzyki/2players.js";

export const data = new SlashCommandBuilder()
    .setName("gradient")
    .setDescription("Ustawianie gradientu w piłkarzykach")
    .addSubcommand((subcommand) =>
        subcommand
            .setName("kolory")
            .setDescription("Gradient pomiędzy dwoma kolorami (tylko hex)")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("kolor1")
                    .setDescription("Pierwszy kolor")
                    .setRequired(true),
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("kolor2")
                    .setDescription("Drugi kolor")
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName("special")
            .setDescription("Specjalne gradienty")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("type")
                    .setDescription("Nazwa gradientu")
                    .setRequired(true)
                    .addChoices({ name: "Tencza", value: "rainbow" })
                    .addChoices({ name: "Losowe kolory", value: "random" }),
            ),
    )
    .addSubcommand((subcommand) =>
        subcommand.setName("reset").setDescription("Usuń swój gradient"),
    );

/**
 *
 * @param {import("discord.js").CommandInteraction} interaction
 * @returns
 */
export async function execute(interaction) {
    if (
        interaction.isChatInputCommand === undefined ||
        !interaction.isChatInputCommand()
    ) {
        await interaction.reply("Pls slash komenda");
        return;
    }

    /** @type {import("../../../types.js").IUserSettings} */
    const settings = JSON.parse(
        fs.readFileSync("./data/userSettings.json", "utf8"),
    );
    if (settings[interaction.user.id] === undefined)
        settings[interaction.user.id] = {};

    if (interaction.options.getSubcommand() === "kolory") {
        const kolor1 = interaction.options.getString("kolor1");
        const kolor2 = interaction.options.getString("kolor2");
        if (kolor1 == null || kolor2 == null) {
            await interaction.reply("Złe kolorki");
            return;
        }

        if (
            !(
                (/#([0-9,A-F,a-f]{3})/.test(kolor1.substring(0, 4)) &&
                    kolor1.length == 4) ||
                (/#([0-9,A-F,a-f]{6})/.test(kolor1.substring(0, 7)) &&
                    kolor1.length == 7)
            ) ||
            !(
                (/#([0-9,A-F,a-f]{3})/.test(kolor2.substring(0, 4)) &&
                    kolor2.length == 4) ||
                (/#([0-9,A-F,a-f]{6})/.test(kolor2.substring(0, 7)) &&
                    kolor2.length == 7)
            )
        ) {
            interaction.reply("Tylko hex kolorki");
            return;
        }

        let nKolor = "";
        if (kolor2.length == 4) {
            nKolor = "rgba(";
            for (let i = 1; i <= 3; i++)
                nKolor += parseInt(kolor2[i] + kolor2[i], 16) + ", ";
            nKolor += "0)";
        } else {
            nKolor = "rgba(";
            for (let i = 1; i <= 5; i += 2)
                nKolor += parseInt(kolor2[i] + kolor2[i + 1], 16) + ", ";
            nKolor += "0)";
        }

        settings[interaction.user.id].gradient = { from: kolor1, to: nKolor };
        if (settings[interaction.user.id].dlug === undefined)
            settings[interaction.user.id].dlug = 0;
        // @ts-expect-error
        settings[interaction.user.id].dlug += 2;

        fs.writeFileSync("./data/userSettings.json", JSON.stringify(settings));
    } else if (interaction.options.getSubcommand() === "special") {
        const type = interaction.options.getString("type");
        // @ts-expect-error
        settings[interaction.user.id].gradient = { special: type };
        if (settings[interaction.user.id].dlug === undefined)
            settings[interaction.user.id].dlug = 0;
        // @ts-expect-error
        settings[interaction.user.id].dlug += 2;

        fs.writeFileSync("./data/userSettings.json", JSON.stringify(settings));
    } else if (interaction.options.getSubcommand() === "reset") {
        delete settings[interaction.user.id].gradient;
        fs.writeFileSync("./data/userSettings.json", JSON.stringify(settings));
        interaction.reply("Gradient usunięty");
        return;
    }

    const board = new Board(
        50,
        50,
        50,
        3,
        [interaction.user.id, ""],
        [interaction.user.username, ""],
        -1,
    );
    board.move(3);
    board.turn = 0;
    board.draw();
    const attachment = new AttachmentBuilder("./tmp/boardPilkarzyki-1.png");
    const img = await /** @type {import("discord.js").TextChannel} */ (
        // @ts-expect-error
        interaction.client.guilds.cache
            .get("856926964094337044")
            .channels.cache.get("892842178143997982")
    ).send({ files: [attachment] });

    interaction.reply(
        "Pls dwa bajgiele (gradienty trudna rzecz).\nPreview: " +
            // @ts-expect-error
            img.attachments.first().url,
    );
}
