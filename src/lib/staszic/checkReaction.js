// TODO: change to reaction collector
/**
 * 
 * @param {import("discord.js").MessageReaction|import("discord.js").PartialMessageReaction} reaction 
 * @param {import("discord.js").User|import("discord.js").PartialUser} reactedUser 
 * @returns 
 */
export async function checkReactionAdd(reaction, reactedUser) {
	try {
		const letters = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮"];
		const numbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "0️⃣"];
		// @ts-expect-error
		const user = reaction.message.guild.members.cache.find(member => member.id == reactedUser.id);
		let role = undefined;

		// @ts-expect-error
		if (letters.indexOf(reaction.emoji.name) != -1) {
			// @ts-expect-error
			const letter = String.fromCharCode(letters.indexOf(reaction.emoji.name) + "A".charCodeAt(0));

			if (reaction.message.id == "1131908080762892339") // 1. klasa
				// @ts-expect-error
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `1${letter}`);
			else if (reaction.message.id == "1131908108873105440") // 2. klasa
				// @ts-expect-error
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `2${letter}`);
			else if (reaction.message.id == "1131908145359364137") // 3. klasa
				// @ts-expect-error
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `3${letter}`);
			else if (reaction.message.id == "1131908177441603684") // 4. klasa
				// @ts-expect-error
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `4${letter}`);
		}
		// @ts-expect-error
		else if (numbers.indexOf(reaction.emoji.name) != -1) {
			// @ts-expect-error
			const number = numbers.indexOf(reaction.emoji.name) + 1;

			if (reaction.message.id == "1079804465663705118")
				// @ts-expect-error
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `Numerek ${number}`);
			else if (reaction.message.id == "1079804506159718602")
				// @ts-expect-error
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `Numerek ${10 + number}`);
			else if (reaction.message.id == "1079804547972730900")
				// @ts-expect-error
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `Numerek ${20 + number}`);
			else if (reaction.message.id == "1079804589483753616")
				// @ts-expect-error
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `Numerek ${30 + number}`);
		}

		if (role)
			// @ts-expect-error
			await user.roles.add(role);
	}
	catch (except) {
		console.error(reaction);
		console.error(except);
		// @ts-expect-error
		const user = reaction.message.guild.members.cache.find(member => member.id == reactedUser.id);
		// @ts-expect-error
		user.send("Był problem z dodaniem twojej roli na serwerze Staszicowym, spróbuj jeszcze raz (jeśli zdaży się to pare razy to napisz do któregoś admina).");
	}
}

/**
 * 
 * @param {import("discord.js").MessageReaction|import("discord.js").PartialMessageReaction} reaction 
 * @param {import("discord.js").User|import("discord.js").PartialUser} reactedUser 
 * @returns 
*/
export async function checkReactionRemove(reaction, reactedUser) {
	try {
		const letters = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮"];
		const numbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "0️⃣"];
		// @ts-expect-error
		const user = reaction.message.guild.members.cache.find(member => member.id == reactedUser.id);

		// @ts-expect-error
		if (letters.indexOf(reaction.emoji.name) != -1) {
			// @ts-expect-error
			const letter = String.fromCharCode(letters.indexOf(reaction.emoji.name) + "A".charCodeAt(0));

			if (reaction.message.id == "1131908080762892339") // 1. klasa
				// @ts-expect-error
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `1${letter}`));
			else if (reaction.message.id == "1131908108873105440") // 2. klasa
				// @ts-expect-error
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `2${letter}`));
			else if (reaction.message.id == "1131908145359364137") // 3. klasa
				// @ts-expect-error
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `3${letter}`));
			else if (reaction.message.id == "1131908177441603684") // 4. klasa
				// @ts-expect-error
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `4${letter}`));
		}
		// @ts-expect-error
		else if (numbers.indexOf(reaction.emoji.name) != -1) {
			// @ts-expect-error
			const number = numbers.indexOf(reaction.emoji.name) + 1;

			if (reaction.message.id == "1079804465663705118")
				// @ts-expect-error
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `Numerek ${number}`));
			else if (reaction.message.id == "1079804506159718602")
				// @ts-expect-error
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `Numerek ${10 + number}`));
			else if (reaction.message.id == "1079804547972730900")
				// @ts-expect-error
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `Numerek ${20 + number}`));
			else if (reaction.message.id == "1079804589483753616")
				// @ts-expect-error
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `Numerek ${30 + number}`));
		}
	}
	catch (except) {
		console.error(reaction);
		console.error(except);
		// @ts-expect-error
		const user = reaction.message.guild.members.cache.find(member => member.id == reactedUser.id);
		// @ts-expect-error
		user.send("Był problem z usunięciem twojej roli na serwerze Staszicowym, spróbuj jeszcze raz (jeśli zdaży się to pare razy to napisz do któregoś admina).");
	}
}
