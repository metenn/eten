/**
 * 
 * @param {import("discord.js").Message} message 
 */
function nie(message) {
	message.channel.send("co pies robi :panda_face:");
}

/**
 * 
 * @param {import("discord.js").Message} message 
 */
export async function sendNawiasowanie(message) {
	const content = message.content.toLowerCase();
	const nawiasy = content.split("").filter(c => c == "(" || c == ")" || c == "[" || c == "]" || c == "{" || c == "}");
	if (nawiasy.length == 0)
		return;
	const nawiasyHeap = [];
	for (let i = 0; i < nawiasy.length; i++) {
		if (nawiasy[i] == "(" || nawiasy[i] == "[" || nawiasy[i] == "{") {
			nawiasyHeap.push(nawiasy[i]);
		}
		else {
			if (nawiasyHeap.length == 0) {
				nie(message);
				return;
			}
			const last = nawiasyHeap.pop();
			if (last == "(" && nawiasy[i] != ")") {
				nie(message);
				return;
			}
			if (last == "[" && nawiasy[i] != "]") {
				nie(message);
				return;
			}
			if (last == "{" && nawiasy[i] != "}") {
				nie(message);
				return;
			}
		}
	}

	let res = "";
	for (let i = nawiasyHeap.length - 1; i >= 0; i--) {
		if (nawiasyHeap[i] == "(")
			res += ")";
		if (nawiasyHeap[i] == "[")
			res += "]";
		if (nawiasyHeap[i] == "{")
			res += "}";
	}
	if (res.length == 0)
		return;
	if (res.length > 2000)
		message.channel.send("chuj ci w dupe");
	else
		message.channel.send(res);
}
