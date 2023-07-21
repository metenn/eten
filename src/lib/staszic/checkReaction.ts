import { MessageReaction, PartialMessageReaction, PartialUser, ReactionCollector, User } from "discord.js";

// TODO: change to reaction collector
export async function checkReactionAdd(reaction: MessageReaction|PartialMessageReaction, reactedUser: User|PartialUser) {
	try {
		const letters = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮"];
		const numbers = [ "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "0️⃣" ];
		const user = reaction.message.guild.members.cache.find(member => member.id == reactedUser.id);
		let role = undefined;

		if (letters.indexOf(reaction.emoji.name) != -1) {
			const letter = String.fromCharCode(letters.indexOf(reaction.emoji.name) + "A".charCodeAt(0));

			if (reaction.message.id == "1131908080762892339") // 1. klasa
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `1${letter}`);
			else if (reaction.message.id == "1131908108873105440") // 2. klasa
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `2${letter}`);
			else if (reaction.message.id == "1131908145359364137") // 3. klasa
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `3${letter}`);
			else if (reaction.message.id == "1131908177441603684") // 4. klasa
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `4${letter}`);
		}
		else if (numbers.indexOf(reaction.emoji.name) != -1) {
			const number = numbers.indexOf(reaction.emoji.name) + 1;

			if (reaction.message.id == "1079804465663705118")
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `Numerek ${number}`);
			else if (reaction.message.id == "1079804506159718602")
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `Numerek ${10 + number}`);
			else if (reaction.message.id == "1079804547972730900")
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `Numerek ${20 + number}`);
			else if (reaction.message.id == "1079804589483753616")
				role = user.guild.roles.cache.find(foundRole => foundRole.name === `Numerek ${30 + number}`);
		}

		if (role)
			await user.roles.add(role);
	}
	catch (except) {
		console.error(reaction);
		console.error(except);
		const user = reaction.message.guild.members.cache.find(member => member.id == reactedUser.id);
		user.send("Był problem z dodaniem twojej roli na serwerze Staszicowym, spróbuj jeszcze raz (jeśli zdaży się to pare razy to napisz do któregoś admina).");
	}
}

export async function checkReactionRemove(reaction: MessageReaction|PartialMessageReaction, reactedUser: User|PartialUser) {
	try {
		const letters = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮"];
		const numbers = [ "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "0️⃣" ];
		const user = reaction.message.guild.members.cache.find(member => member.id == reactedUser.id);

		if (letters.indexOf(reaction.emoji.name) != -1) {
			const letter = String.fromCharCode(letters.indexOf(reaction.emoji.name) + "A".charCodeAt(0));

			if (reaction.message.id == "1131908080762892339") // 1. klasa
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `1${letter}`));
			else if (reaction.message.id == "1131908108873105440") // 2. klasa
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `2${letter}`));
			else if (reaction.message.id == "1131908145359364137") // 3. klasa
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `3${letter}`));
			else if (reaction.message.id == "1131908177441603684") // 4. klasa
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `4${letter}`));
		}
		else if (numbers.indexOf(reaction.emoji.name) != -1) {
			const number = numbers.indexOf(reaction.emoji.name) + 1;

			if (reaction.message.id == "1079804465663705118")
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `Numerek ${number}`));
			else if (reaction.message.id == "1079804506159718602")
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `Numerek ${10 + number}`));
			else if (reaction.message.id == "1079804547972730900")
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `Numerek ${20 + number}`));
			else if (reaction.message.id == "1079804589483753616")
				await user.roles.remove(user.guild.roles.cache.find(role => role.name == `Numerek ${30 + number}`));
		}
	}
	catch (except) {
		console.error(reaction);
		console.error(except);
		const user = reaction.message.guild.members.cache.find(member => member.id == reactedUser.id);
		user.send("Był problem z usunięciem twojej roli na serwerze Staszicowym, spróbuj jeszcze raz (jeśli zdaży się to pare razy to napisz do któregoś admina).");
	}
}
