import config from "../config.json" with { type: "json" };;
import { Configuration, OpenAIApi } from "openai";

/** @type {OpenAIApi} */
export let openai;

export async function init() {
	const configuration = new Configuration({
		organization: config.openAI.organizationId,
		apiKey: config.openAI.apiToken
	});
	openai = new OpenAIApi(configuration);
}

/**
 * 
 * @param {string} prompt 
 * @returns
 */
export async function askQuestion(prompt) {
	const response = await openai.createCompletion({
		model: "text-davinci-003",
		prompt: prompt,
		max_tokens: 256
	});
	console.log(response.data.choices[0]);
	return response.data.choices[0].text;
}
