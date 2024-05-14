import fs from "node:fs";

export default function() {
	if (!fs.existsSync("./data/uptime") || fs.existsSync("./data/crashed")) {
		fs.writeFileSync("./data/uptime", (Math.floor(Date.now() / 1000)).toString());

		if (fs.existsSync("./data/crashed")) {
			fs.rmSync("./data/crashed");
		}
	}
}
