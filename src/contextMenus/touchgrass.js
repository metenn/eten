import { ContextMenuCommandBuilder } from "discord.js";

export const data = new ContextMenuCommandBuilder()
    .setName("Dotknij trawy")
    .setType(3);

/**
 *
 * @param {import("discord.js").ContextMenuCommandInteraction} interaction
 */
export async function execute(interaction) {
    if (interaction.isMessageContextMenuCommand()) {
        // @ts-expect-error
        interaction.channel.send({
            reply: {
                failIfNotExists: true,
                messageReference: interaction.targetMessage.id,
            },
            content:
                "https://cdn.discordapp.com/attachments/922801446095818762/950045597560344586/lv_0_20220225211209.mp4",
        });
        interaction.reply({
            ephemeral: true,
            content:
                "Może dotknie trawy w przyszłości (albo ją zajara ehehehehhe zioło xddxDXdDXdxdxxDD)",
        });
    }
}
