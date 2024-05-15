import config from "../config.json" with { type: "json" };;
import cheerio from "cheerio";

export const lyricsErrorEnum = {
	NoApiKey: 1,
	WrongStatus: 2
}

export class LyricsError extends Error {
	/** @type {number | undefined} */
	type;

	/**
	 * 
	 * @param {string | undefined} message 
	 * @param {number | undefined} type 
	 */
	constructor(message, type) {
		super(message);
		this.name = "LyrcisError";
		this.type = type;
	}
}

/**
 * 
 * @returns {string | undefined}
 */
function getApiKey() {
	if (config.geniusAPIKey)
		return config.geniusAPIKey;
	return undefined;
}

/**
 * 
 * @param {string} search 
 * @returns {Promise<import("../../types.js").ILyricsSong[]>}
 */
export async function searchSong(search) {
	const apiKey = getApiKey();
	if (!apiKey)
		throw new LyricsError("API Key doesnt exist", lyricsErrorEnum.NoApiKey);

	const response = await fetch(`https://api.genius.com/search?q=${search}`, {
		headers: {
			Authorization: `Bearer ${apiKey}`
		}
	});

	if (response.status != 200)
		throw new LyricsError(`Response status not 200 (${response.url})`, lyricsErrorEnum.WrongStatus);

	const result = /** @type {any} */ (await response.json());
	/** @type {import("../../types.js").ILyricsSong[]} */
	const ret = [];

	for (const song of result.response.hits) {
		ret.push(song.result);
	}

	return ret;
}

/**
 * 
 * @param {import("../../types.js").ILyricsSong} song 
 * @returns {Promise<string>}
 */
export async function getLyrics(song) {
	const apiKey = getApiKey();
	if (!apiKey)
		throw new LyricsError("API Key doesnt exist", lyricsErrorEnum.NoApiKey);

	const response = await fetch(`https://genius.com${song.path}`);

	if (response.status != 200)
		throw new LyricsError(`Response status not 200 (${response.url})`, lyricsErrorEnum.WrongStatus);

	const text = (await response.text()).replace(/<br \/>|<br\/>|<br>/g, "\n");
	const page = cheerio.load(text);

	let lyrics = page(".lyrics").text();
	if (!lyrics) // using new version of genius
		lyrics = page(".Lyrics__Container-sc-1ynbvzw-6").text();

	if (!lyrics) {
		console.error("Lyrics are still empty");
		console.error(song);
	}

	return lyrics;
}
