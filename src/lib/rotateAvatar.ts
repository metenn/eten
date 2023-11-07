import { client } from "..";
import fs from "fs";
import gm from "gm";


export default async function() {
	// I don't understand graphicsmagick
	try {
		const rotateJson: {ang: number} = JSON.parse(fs.readFileSync("./data/rotate.json", "utf-8"));
		// rotate
		await new Promise<void>((resolve, reject) => {
			gm("./data/eten_prof.png")
				.rotate("#2B2D31", rotateJson.ang)
				.write("./tmp/avatar.png", function(err) {
					if (err != null) {
						console.log(err);
						reject();
					}
					else {
						console.log("rotated");
						resolve();
					}
				});
		});
		// Get dimensions and shave amount
		const dim: number[] = [0, 0];
		await new Promise<void>((resolve, reject) => {
			gm("./tmp/avatar.png")
				.identify("%w,%h", (err, val) => {
					if (err != null) {
						console.log(err);
						reject();
					}
					else {
						const arr = val.split(",");
						dim[0] = Math.ceil((Number(arr[0]) - 256) / 2);
						dim[1] = Math.ceil((Number(arr[1]) - 256) / 2);
						console.log(dim);
						resolve();
					}
				});
		});
		// Shave
		await new Promise<void>((resolve, reject) => {
			gm("./tmp/avatar.png")
				.shave(dim[0], Math.ceil(dim[1]))
				.write("./tmp/avatar.png", function(err) {
					if (err != null) {
						console.log(err);
						reject();
					}
					else {
						console.log("clipped");
						resolve();
					}
				});
		});
		await client.user.setAvatar("./tmp/avatar.png");
		rotateJson.ang += 1;
		fs.writeFileSync("./data/rotate.json", JSON.stringify(rotateJson));
	}
	catch (error) {
		console.log(error);
	}
}
