import config from "../config.json" with { type: "json" };;
import cron from "cron";
import { client } from "../index.js";


async function getCount() {
	// @ts-ignore
	const result = await fetch("https://api.hypixel.net/v2/counts", { headers: { "API-Key": config.hypixelApiKey } });
	const json = /** @type {any} */(await result.json());
	if (json.success === false) {
		console.error("Failed to get player count");
		console.error(json);
		return 0;
	}

	return json.games.ARCADE.modes.MINI_WALLS || 0;
}

let threshold = false;

async function check() {
	const count = await getCount();
	// @ts-expect-error
	client.user.setActivity(`Mini Walls (${count} graczy)`, { type: "PLAYING" });
	if (count >= 20 && threshold === false) {
		threshold = true;
		const channel = client.channels.cache.get(config.miniwallsChannel);
		// @ts-expect-error
		if (channel.isTextBased()) {
			channel.send(`@everyone Mini Walls gaming (${count} graczy!!!!`);
		}
	}
	else {
		threshold = false;
	}
}

export default function startCron() {
	const job = new cron.CronJob(
		"0,10,20,30,40,50 * * * *",
		check
	);
	check();
}
