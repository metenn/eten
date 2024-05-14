/**
 * 
 * @param {import("discord.js").Interaction<import("discord.js").CacheType>} interaction 
 * @returns 
 */
export default async function(interaction) {
	const client = interaction.client;

	if (interaction.isButton()) {
		try {
			// @ts-expect-error
			await client.commands.get(interaction.customId.split("#")[0]).execute(interaction);
		}
		catch (error) {
			console.error(error);
		}
		return;
	}
	else if (interaction.isAutocomplete()) {
		try {
			// @ts-expect-error
			await client.commands.get(interaction.commandName).autocomplete(interaction);
		}
		catch (error) {
			console.error(error);
		}
	}

	if (!interaction.isCommand() && !interaction.isContextMenu()) return;

	if (!client.commands.has(interaction.commandName)) return;

	try {
		try {
			// @ts-expect-error
			await client.commands.get(interaction.commandName).execute(interaction);
		}
		catch (error) {
			console.error(error);
		}
	}
	catch (error) {
		console.error(error);
		try {
			await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
		}
		catch (error2) {
			console.error("Error: Couldn't reply, probably already replied, trying to edit");
			console.error(error2);
			await interaction.editReply({ content: "There was an error while executing this command!" });
		}
	}
}
