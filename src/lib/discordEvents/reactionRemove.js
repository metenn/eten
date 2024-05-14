import { TextChannel, User } from "discord.js";
import { checkReactionRemove } from "../staszic/checkReaction.js";
import fs from "node:fs";
import { client } from "../../index.js";

/**
 * 
 * @param {import("discord.js").MessageReaction|import("discord.js").PartialMessageReaction} reaction 
 * @param {import("discord.js").User|import("discord.js").PartialUser} reactedUser 
 * @returns 
 */
export default async function (reaction, reactedUser) {
	await checkReactionRemove(reaction, reactedUser);

	const reactionMessages = /** @type {import("../../../types.js").IReactionMessages} */ (JSON.parse(fs.readFileSync("./data/reactionMessages.json", "utf-8")));
	if (!(reaction.message.id in reactionMessages))
		return;

	const message = await /** @type {TextChannel} */ (client.channels.cache.get(reaction.message.channel.id)).messages.fetch(reaction.message.id);

	/** @type {string|undefined} */
	let roleName = undefined;
	for (const reactionRole of reactionMessages[message.id].reactions) {
		if (reaction.emoji.name == reactionRole.emoji)
			roleName = reactionRole.roleName;
	}

	if (!roleName)
		return;

	// @ts-expect-error
	const user = reaction.message.guild.members.cache.find(member => member.id == reactedUser.id);
	// @ts-expect-error
	const role = reaction.message.guild.roles.cache.find(role => role.name == roleName);

	// @ts-expect-error
	await user.roles.remove(role);
}
