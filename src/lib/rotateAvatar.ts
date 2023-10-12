import { client } from "..";
import fetch from "node-fetch";
import util from "util";
import stream from "stream";
import fs from "fs";
import gm from "gm";
const streamPipeline = util.promisify(stream.pipeline);


export  default async function() {
	const avatarUrl = client.user?.displayAvatarURL({ format: "png", size: 512 });
	if (!avatarUrl)
		return;

	const avatarBody = await fetch(avatarUrl);
	await streamPipeline(avatarBody.body, fs.createWriteStream("./tmp/avatar.png"));
	gm('./tmp/avatar.png')
		.rotate("white", 1)
		.write('./tmp/avatar.png', function(err) {
			if (err)
				console.log(err);
			else {
				client.user.setAvatar('./tmp/avatar.png');
				console.log("rotated");
			}
		});
}
