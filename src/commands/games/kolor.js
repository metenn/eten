import fs from "node:fs";
import { AttachmentBuilder, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import Board from "../../lib/pilkarzyki/2players.js";

const possibleColors = ["black", "silver", "gray", "white", "maroon", "red", "purple", "fuchsia", "green", "lime", "olive", "yellow", "navy", "blue", "teal", "aqua", "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray", "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey", "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod", "gray", "green", "greenyellow", "grey", "honeydew", "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey", "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey", "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "red", "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow", "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen"];

export const data = new SlashCommandBuilder()
	.setName("kolor")
	.setDescription("Zmienianie koloru w grach")
	.addSubcommand(subcommand =>
		subcommand
			.setName("zmien")
			.setDescription("Twój kolor w grach (hex albo nazwa css-owa)")
			.addStringOption(
				new SlashCommandStringOption()
					.setName("kolor")
					.setDescription("Kolor w grach")
					.setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand
			.setName("reset")
			.setDescription("Resetuj swój kolor"));

/**
 * 
 * @param {import("discord.js").CommandInteraction} interaction 
 * @returns 
 */
export async function execute(interaction) {
	if (interaction.isChatInputCommand === undefined || !interaction.isChatInputCommand()) {
		await interaction.reply("Pls slash komenda");
		return;
	}
	const uid = interaction.user.id;
	/** @type {import("../../../types.js").IUserSettings} */
	const settings = JSON.parse(fs.readFileSync("./data/userSettings.json", "utf8"));

	if (interaction.options.getSubcommand() === "reset" || interaction.options.getString("kolor") == "default") {
		if (settings[uid] !== undefined && settings[uid].color !== undefined)
			delete settings[uid].color;

		interaction.reply("Zresetowano kolor");
		fs.writeFileSync("./data/userSettings.json", JSON.stringify(settings));
		return;
	}

	let color = interaction.options.getString("kolor");
	if (color == null) {
		await interaction.reply("Brak kolorku");
		return;
	}
	const username = interaction.user.username;

	color = color.toLowerCase();
	if (settings[uid] === undefined)
		settings[uid] = {};

	if ((/#([0-9,A-F,a-f]{3})/.test(color.substring(0, 4)) && color.length == 4) || (/#([0-9,A-F,a-f]{6})/.test(color.substring(0, 7)) && color.length == 7) || possibleColors.includes(color)) {
		settings[uid]["color"] = color;
		if (settings[interaction.user.id].dlug === undefined)
			settings[interaction.user.id].dlug = 0;
		// @ts-expect-error
		settings[interaction.user.id].dlug += 2;
		fs.writeFileSync("./data/userSettings.json", JSON.stringify(settings));

		const board = new Board(50, 50, 50, 3, [uid, ""], [username, ""], -1);
		board.move(4);
		board.turn = 0;
		board.draw();
		const attachment = new AttachmentBuilder("./tmp/boardPilkarzyki-1.png");
		// @ts-expect-error
		const img = await /** @type {import("discord.js").TextChannel} */ (interaction.client.guilds.cache.get("856926964094337044").channels.cache.get("892842178143997982")).send({ files: [attachment] });

		// @ts-expect-error
		interaction.reply("Pls jeden bajgiel.\nPreview: " + img.attachments.first().url);
	}
	else { interaction.reply("Zły kolor"); }
}
