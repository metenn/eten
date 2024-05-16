import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { player } from "../../index.js";

export const data = new SlashCommandBuilder()
    .setName("effects")
    .setDescription("Dodaj/usuń efekt")
    .addStringOption(
        new SlashCommandStringOption()
            .setName("efekt")
            .setDescription(
                "Nazwa efektu. Jeżeli brak to zostanie wysłana lista włączonych i wyłączonych efektów",
            )
            .setRequired(false)
            .setAutocomplete(true),
    );

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @returns
 */
export async function execute(interaction) {
    await interaction.deferReply();

    // @ts-expect-error
    const guild = interaction.client.guilds.cache.get(interaction.guild.id);
    // @ts-expect-error
    const user = guild.members.cache.get(interaction.user.id);

    // @ts-expect-error
    if (!user.voice.channel) {
        interaction.editReply("Nie jesteś na VC");
        return;
    }

    // @ts-expect-error
    const queue = player.queues.get(interaction.guild.id);
    if (!queue || !queue.isPlaying()) {
        interaction.editReply("Nie puszczam żadnej muzyki");
        return;
    }

    const filter = interaction.options.getString("efekt");
    /** @type {string[]} */
    const enabled = [];
    /** @type {string[]} */
    const disabled = [];

    queue.filters.ffmpeg.getFiltersEnabled().map((x) => enabled.push(x));
    queue.filters.ffmpeg.getFiltersEnabled().map((x) => disabled.push(x));

    if (!filter) {
        let msg = "Włączone efekty: ";
        for (const eff of enabled) msg += `${eff}, `;

        if (enabled.length == 0) msg += "brak";
        else msg = msg.slice(0, -2);

        msg += "\nWyłączone efekty: ";
        for (const eff of disabled) msg += `${eff}, `;

        if (disabled.length == 0) msg += "brak";
        else msg = msg.slice(0, -2);

        interaction.editReply(msg);
    } else {
        if (!enabled.includes(filter) && !disabled.includes(filter)) {
            interaction.editReply("Nie istnieje taki filter");
            return;
        }

        await queue.filters.ffmpeg.toggle(
            /** @type {keyof import("discord-player").QueueFilters} */ (filter),
        );

        interaction.editReply(
            `${enabled.includes(filter) ? "Wyłączono" : "Włączono"} efekt ${filter}`,
        );
    }
}

/**
 *
 * @param {import("discord.js").AutocompleteInteraction} interaction
 */
export async function autocomplete(interaction) {
    const effects = [
        "bassboost_low",
        "bassboost",
        "bassboost_high",
        "8D",
        "vaporwave",
        "nightcore",
        "phaser",
        "tremolo",
        "vibrato",
        "reverse",
        "treble",
        "normalizer",
        "normalizer2",
        "surrounding",
        "pulsator",
        "subboost",
        "karaoke",
        "flanger",
        "gate",
        "haas",
        "mcompand",
        "mono",
        "mstlr",
        "mstrr",
        "compressor",
        "expander",
        "softlimiter",
        "chorus",
        "chorus2d",
        "chorus3d",
        "fadein",
        "dim",
        "earrape",
    ];
    /** @type {{ [effect: string]: string; }} */
    const name = {
        bassboost_low: "mały bassbost",
        bassboost: "bassboost",
        bassboost_high: "duży bassbost",
        "8D": "8D",
        vaporwave: "vaporwave",
        nightcore: "nightcore",
        phaser: "miecz świetlny",
        tremolo: "trelomo",
        vibrato: "wibrator",
        reverse: "reverse",
        treble: "treble",
        normalizer: "normalizer",
        normalizer2: "normalizer 2",
        surrounding: "surrounding",
        pulsator: "pulsator",
        subboost: "subboost",
        karaoke: "karaoke",
        flanger: "flanger",
        gate: "brama (takie anime)",
        haas: "mieeć",
        mcompand: "minecraft:command_block",
        mono: "jeden",
        mstlr: "mstlr",
        mstrr: "mstrr",
        compressor: "komrepsor",
        expander: "rozszerzacz",
        softlimiter: "miętki ograniczacz",
        chorus: "chór",
        chorus2d: "chór 2D",
        chorus3d: "chór 3D",
        fadein: "fade in",
        dim: "dim",
        earrape: "gwałcenie uszu (ferdydurke)",
    };

    let i = 0;
    /** @type {import("discord.js").ApplicationCommandOptionChoiceData[]} */
    const suggestions = [];
    for (const effect of effects) {
        // @ts-expect-error
        if (effect.startsWith(interaction.options.getString("efekt"))) {
            suggestions.push({
                name: name[effect],
                value: effect,
            });
            i++;
            if (i == 25) break;
        }
    }

    interaction.respond(suggestions);
}
