import fs from "fs";
import cron from "cron";
import { IInfo } from "./types";

export default function() {
	if (!fs.existsSync("./data/uptime") || fs.existsSync("./data/crashed")) {
		fs.writeFileSync("./data/uptime", (Math.floor(Date.now() / 1000)).toString());

		if (fs.existsSync("./data/crashed")) {
			fs.rmSync("./data/crashed");
		}
	}
}
