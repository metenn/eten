import {
    EmbedBuilder,
    SlashCommandBuilder,
    SlashCommandStringOption,
} from "discord.js";
import fs from "node:fs";
import config from "../../config.json" with { type: "json" };
import * as betsLib from "../../lib/bets.js";

export const data = new SlashCommandBuilder()
    .setName("bet")
    .setDescription("Zakłady")
    .addSubcommand((subcommand) =>
        subcommand
            .setName("bet")
            .setDescription("Załóż się")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("czas")
                    .setDescription("Godzina")
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName("zmień")
            .setDescription("Zmień swój zakład")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("czas")
                    .setDescription("Godzina")
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand) =>
        subcommand.setName("list").setDescription("Lista zakładów"),
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName("check")
            .setDescription("Tylko dla administratorów bota"),
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
    if (
        interaction.options.getSubcommand() == "bet" ||
        interaction.options.getSubcommand() == "zmień"
    ) {
        const now = new Date(Date.now());
        const content = interaction.options.getString("czas") || "";
        if (
            !/[0-2]{1}[0-9]{1}:[0-6]{1}[0-9]{1}:[0-6]{1}[0-9]{1}.[0-9]{3}$|[0-2]{1}[0-9]{1}:[0-6]{1}[0-9]{1}:[0-6]{1}[0-9]{1}$|[0-2]{1}[0-9]{1}:[0-6]{1}[0-9]{1}$/.test(
                content,
            )
        ) {
            interaction.reply(
                "Zły format (dozwolone formaty: godzina:minuta, godzina:minuta:sekunda, godzina:minuta:sekunda.milisekunda)",
            );
            return;
        }

        /** @type {import("../../../types.js").IBets} */
        const bets = JSON.parse(fs.readFileSync("./data/bets.json", "utf-8"));

        if (
            interaction.user.id in bets &&
            interaction.options.getSubcommand() != "zmień"
        ) {
            interaction.reply(
                "Już się założyłeś. <:qiqifallen:936561167709646860>",
            );
            return;
        }

        const time = Date.parse("1970-01-01 " + content);
        if (isNaN(time)) {
            interaction.reply("Zły czas. <:widelinus:687065253153996835>");
            return;
        }

        let annoucmentDate = undefined;
        if (fs.existsSync("./data/betsInfo.json"))
            annoucmentDate = JSON.parse(
                fs.readFileSync("./data/betsInfo.json", "utf8"),
            ).time;
        if (
            annoucmentDate != undefined &&
            annoucmentDate != new Date(Date.now()).toDateString() &&
            new Date(Date.now()).getDay() != 6 &&
            interaction.options.getSubcommand() == "zmień" &&
            bets[interaction.user.id] != undefined &&
            now.getTime() - new Date(now.toDateString()).getTime() >
                bets[interaction.user.id].time
        ) {
            interaction.reply(
                "You cheated not only the game, but yourself. You didn't grow. You didn't improve. You took a shortcut and gained nothing. You experienced a hollow victory. Nothing was risked and nothing was gained. It's sad that you don't know the difference. <:copium:945419768222081114>",
            );
            return;
        }

        bets[interaction.user.id] = {
            time: time,
            timeAdded: now.getTime(),
            message: content,
        };
        fs.writeFileSync("./data/bets.json", JSON.stringify(bets));

        if (interaction.options.getSubcommand() == "bet")
            interaction.reply("Dodano!");
        else interaction.reply("Zmieniono!");
    } else if (interaction.options.getSubcommand() == "list") {
        /** @type {import("../../../types.js").IBets} */
        const bets = JSON.parse(fs.readFileSync("./data/bets.json", "utf-8"));

        const users = [];
        for (const [user, time] of Object.entries(bets)) {
            users.push({
                user: user,
                time: time.time,
                message: time.message,
            });
        }
        users.sort((a, b) => {
            return a.time - b.time;
        });

        let desc = "";
        for (const time of users) desc += `<@${time.user}>: ${time.message}\n`;

        if (desc == "")
            desc =
                "Jeszcze nikt się nie założył <:widenatchuz:706934562961358888>";

        const embed = new EmbedBuilder()
            .setColor(
                /** @type {import("discord.js").ColorResolvable} */ (
                    "#" + Math.floor(Math.random() * 16777215).toString(16)
                ),
            )
            .setTitle("Aktualne zakłady")
            .setDescription(desc);

        interaction.reply({ embeds: [embed] });
    } else if (interaction.options.getSubcommand() == "check") {
        if (config.adminID.indexOf(interaction.user.id) == -1) {
            interaction.reply({
                content: "Tylko dla administratorów",
                ephemeral: true,
            });
            return;
        }

        betsLib.check(new Date(Date.now()));
        interaction.reply({ content: "ok", ephemeral: true });
    }
}
