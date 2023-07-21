import Discord, { ColorResolvable, TextChannel } from "discord.js";
import { client } from "../../index";

// TODO: add reaction collector

export async function createSzczesliwyNumerekRoles() {
	const guild = await client.guilds.fetch("930512190220435516");

	for (let i = 1; i <= 40; i++) {
		await guild.roles.create({
			name: `Numerek ${i}`,
		});
	}
}

export async function sendSzczesliwyNumerekMessages(channelID: string) {
	const channel = client.channels.cache.get(channelID) as TextChannel;
	const reactions: string[] = [ "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "0️⃣" ];
	const colors = ["#E09F7D", "#EF5D60", "#EC4067", "#A01A7D"];

	for (let i = 0; i < 4; i++) {
		let desc = "Kliknij odpowiednią reakcję, żeby wybrać swój numerek w dzienniku\n\n";
		for (let j = 1; j <= 10; j++) {
			desc += `${reactions[j - 1]} - numerek ${i * 10 + j}\n`;
		}

		const embed = new Discord.MessageEmbed()
			.setTitle(`Numerki od ${i * 10 + 1} do ${i * 10 + 10}`)
			.setColor(colors[i] as ColorResolvable)
			.setDescription(desc);

		const message = await channel.send({ embeds: [embed] });
		for (let j = 1; j <= 10; j++) {
			await message.react(reactions[j - 1]);
		}
	}
}

export async function sendMessages(channelID: string) {
	const letters: { [letter: string]: string } = {
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

	const channel = client.channels.cache.get(channelID) as TextChannel;

	let index = 1;
	for (const max of klasy) {
		let desc = "Kliknij odpowiednią reakcję, żeby dostać rolę swojej klasy\n\n";
		for (let letter = "A"; letter <= max; letter = String.fromCharCode(letter.charCodeAt(0) + 1)) {
			if (index == 4 && letter == "H") // remove next year
				continue;

			desc += `${letters[letter]} - ${index}${letter}\n`;
		}

		const embed = new Discord.MessageEmbed()
			.setTitle(`Klasy ${klasyName[index - 1]}`)
			.setColor(colors[index - 1] as ColorResolvable)
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

export async function editMessage(channelID: string, msgID: string) {
	console.log(`Editing message ${msgID} in channel ${channelID}`);
	const letters: { [letter: string]: string } = {
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

	const embed = new Discord.MessageEmbed()
		.setTitle(`Klasy Pierwsze`)
		.setColor("#E09F7D")
		.setDescription(desc);

	const channel = client.channels.cache.get(channelID) as TextChannel;
	const message = await channel.messages.fetch(msgID);
	await message.edit({ content: " ", embeds: [embed] });
}

export async function addReaction(channelID: string, msgID: string) {
	const channel = client.channels.cache.get(channelID) as TextChannel;
	const message = await channel.messages.fetch(msgID);
	await message.react("🇮");
}

export async function upgradeRoles(guildID: string, graduateRoleId: string) {
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

export async function createFirstYearRoles(guildID: string, maxLetter: string) {
	const guild = await client.guilds.fetch("930512190220435516");

	for (let letter = "A"; letter <= maxLetter; letter = String.fromCharCode(letter.charCodeAt(0) + 1)) {
		await guild.roles.create({
			name: `1${letter}`,
		});
	}
}
