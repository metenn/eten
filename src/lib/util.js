import crypto from "crypto";
import fs from "fs";
import path from "path";

/**
 * 
 * @param {string} message 
 * @returns
 */
export function sha256(message) {
	return crypto.createHash("SHA256").update(message).digest("hex");
}

/**
 * 
 * @param {string} dir 
 * @returns {string[]}
 */
export function getAllFiles(dir) {
	const files = fs.readdirSync(dir);
	/** @type {string[]} */
	const allFiles = [];
	files.forEach(file => {
		const filePath = path.join(dir, file);
		const stats = fs.statSync(filePath);
		if (stats.isDirectory()) {
			allFiles.push(...getAllFiles(filePath));
		} else {
			allFiles.push(filePath);
		}
	});
	return allFiles;
}
