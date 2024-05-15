import { EmbedBuilder } from "discord.js";
import { client } from "../../index.js";
/** @typedef {{ [letter: string]: string }} LetterMap */

// TODO: add reaction collector

export async function createSzczesliwyNumerekRoles() {
	const guild = await client.guilds.fetch("930512190220435516");

	for (let i = 1; i <= 40; i++) {
		await guild.roles.create({
			name: `Numerek ${i}`,
		});
	}
}

/**
 * 
 * @param {string} channelID 
 */
export async function sendSzczesliwyNumerekMessages(channelID) {
	const channel = /** @type {import("discord.js").TextChannel} */(client.channels.cache.get(channelID));
	/** @type {string[]} */
	const reactions = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "0️⃣"];
	const colors = ["#E09F7D", "#EF5D60", "#EC4067", "#A01A7D"];

	for (let i = 0; i < 4; i++) {
		let desc = "Kliknij odpowiednią reakcję, żeby wybrać swój numerek w dzienniku\n\n";
		for (let j = 1; j <= 10; j++) {
			desc += `${reactions[j - 1]} - numerek ${i * 10 + j}\n`;
		}

		const embed = new EmbedBuilder()
			.setTitle(`Numerki od ${i * 10 + 1} do ${i * 10 + 10}`)
			.setColor(/** @type {import("discord.js").ColorResolvable} */(colors[i]))
			.setDescription(desc);

		const message = await channel.send({ embeds: [embed] });
		for (let j = 1; j <= 10; j++) {
			await message.react(reactions[j - 1]);
		}
	}
}

/**
 * 
 * @param {string} channelID 
 */
export async function sendMessages(channelID) {
	/** @type {LetterMap} */
	const letters = {
		"A": "🇦",
		"B": "🇧",
		"C": "🇨",
		"D": "🇩",
		"E": "🇪",
		"F": "🇫",
		"G": "🇬",
		"H": "🇭",
		"I": "🇮"
	};
	const klasy = ["G", "I", "H", "G"];
	const klasyName = ["Pierwsze", "Drugie", "Trzecie", "Czwarte"];
	const colors = ["#E09F7D", "#EF5D60", "#EC4067", "#A01A7D"];

	const channel = /** @type {import("discord.js").TextChannel} */(client.channels.cache.get(channelID));

	let index = 1;
	for (const max of klasy) {
		let desc = "Kliknij odpowiednią reakcję, żeby dostać rolę swojej klasy\n\n";
		for (let letter = "A"; letter <= max; letter = String.fromCharCode(letter.charCodeAt(0) + 1)) {
			if (index == 4 && letter == "H") // remove next year
				continue;

			desc += `${letters[letter]} - ${index}${letter}\n`;
		}

		const embed = new EmbedBuilder()
			.setTitle(`Klasy ${klasyName[index - 1]}`)
			.setColor(/** @type {import("discord.js").ColorResolvable} */(colors[index - 1]))
			.setDescription(desc);

		const message = await channel.send({ embeds: [embed] });
		for (let letter = "A"; letter <= max; letter = String.fromCharCode(letter.charCodeAt(0) + 1)) {
			if (index == 4 && letter == "H") // remove next year
				continue;

			await message.react(letters[letter]);
		}

		index++;
	}
}

/**
 * 
 * @param {string} channelID 
 * @param {string} msgID 
 */
export async function editMessage(channelID, msgID) {
	console.log(`Editing message ${msgID} in channel ${channelID}`);
	/** @type {LetterMap} */
	const letters = {
		"A": "🇦",
		"B": "🇧",
		"C": "🇨",
		"D": "🇩",
		"E": "🇪",
		"F": "🇫",
		"G": "🇬",
		"H": "🇭",
		"I": "🇮"
	};

	let desc = "Kliknij odpowiednią reakcję, żeby dostać rolę swojej klasy\n\n";
	for (let letter = "A"; letter <= "I"; letter = String.fromCharCode(letter.charCodeAt(0) + 1)) {
		if (letter != "H")
			desc += `${letters[letter]} - 1${letter}\n`;
	}

	const embed = new EmbedBuilder()
		.setTitle(`Klasy Pierwsze`)
		.setColor("#E09F7D")
		.setDescription(desc);

	const channel = /** @type {import("discord.js").TextChannel} */ (client.channels.cache.get(channelID));
	const message = await channel.messages.fetch(msgID);
	await message.edit({ content: " ", embeds: [embed] });
}

/**
 * 
 * @param {string} channelID 
 * @param {string} msgID 
 */
export async function addReaction(channelID, msgID) {
	const channel = /** @type {import("discord.js").TextChannel} */ (client.channels.cache.get(channelID));
	const message = await channel.messages.fetch(msgID);
	await message.react("🇮");
}

/**
 * 
 * @param {string} guildID 
 * @param {string} graduateRoleId 
 */
export async function upgradeRoles(guildID, graduateRoleId) {
	const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
	const guild = await client.guilds.fetch(guildID);
	await guild.members.fetch();
	const graduateRole = guild.roles.cache.find(role => role.id == graduateRoleId);
	if (graduateRole == undefined)
		throw new Error("Graduate role not found");

	for (const letter of letters) {
		const role = guild.roles.cache.find(role => role.name == `4${letter}`);
		if (role == undefined)
			continue;

		for (const member of role.members.values()) {
			console.log(member.user.username);
			await member.roles.add(graduateRole);
		}
		await role.delete();
	}
	console.log("Removed 4th grade roles");

	for (let num = 3; num >= 1; num--) {
		for (const letter of letters) {
			const role = guild.roles.cache.find(role => role.name == `${num}${letter}`);
			console.log(num, letter);
			if (role == undefined)
				continue;

			await role.setName(`${num + 1}${letter}`);
		}
	}
	console.log("Upgraded roles");
}

/**
 * 
 * @param {string} guildID 
 * @param {string} maxLetter 
 */
export async function createFirstYearRoles(guildID, maxLetter) {
	const guild = await client.guilds.fetch("930512190220435516");

	for (let letter = "A"; letter <= maxLetter; letter = String.fromCharCode(letter.charCodeAt(0) + 1)) {
		await guild.roles.create({
			name: `1${letter}`,
		});
	}
}
