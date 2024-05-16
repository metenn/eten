import util from "node:util";
import * as stream from "node:stream";
const streamPipeline = util.promisify(stream.pipeline);
import fs from "node:fs";
import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("cursedkoteł")
    .setDescription("kiedy widze nowy filmik damonka :trolldog");
export const aliases = ["kotbingo", "rozpierdolkota"];

/**
 *
 * @param {import("discord.js").CommandInteraction} interaction
 */
export async function execute(interaction) {
    const folderNumber = Math.floor(Math.random() * 6 + 1);
    let catNumber;
    let theMessage = "No cat for you, the was an error";
    switch (folderNumber) {
        case 1:
            catNumber = Math.floor(Math.random() * 5000 + 1);
            if (Math.random() < 0.5) theMessage = "01/cat" + catNumber + ".jpg";
            else theMessage = "04/cat" + catNumber + ".jpg";

            break;
        case 2:
            catNumber = Math.floor(Math.random() * 5000 + 1);
            if (Math.random() < 0.5) theMessage = "02/cat" + catNumber + ".jpg";
            else theMessage = "05/cat" + catNumber + ".jpg";

            break;
        case 3:
            catNumber = Math.floor(Math.random() * 5000 + 1);
            if (Math.random() < 0.5) theMessage = "03/cat" + catNumber + ".jpg";
            else theMessage = "06/cat" + catNumber + ".jpg";

            break;
        case 4:
            catNumber = Math.floor(Math.random() * 5000 + 1);
            theMessage = "04/cat" + catNumber + ".jpg";
            break;
        case 5:
            catNumber = Math.floor(Math.random() * 5000 + 1);
            theMessage = "05/cat" + catNumber + ".jpg";
            break;
        case 6:
            catNumber = Math.floor(Math.random() * 5000 + 1);
            theMessage = "06/cat" + catNumber + ".jpg";
            break;
    }
    const response = await fetch(
        "https://d2ph5fj80uercy.cloudfront.net/" + theMessage,
    ).catch((error) => {
        throw new Error(error);
    });
    if (!response.ok)
        throw new Error(`Unexpected response ${response.statusText}`);
    // console.log(response.body);
    await streamPipeline(
        // @ts-expect-error
        response.body,
        fs.createWriteStream("./tmp/placeholder.jpg"),
    );
    const attachment = new AttachmentBuilder("./tmp/placeholder.jpg");
    await interaction.reply({ files: [attachment] });
}
