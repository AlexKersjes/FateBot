import * as Discord from 'discord.js';
import { Player, SaveGame } from '../savegame';

export class responseQueue {
	private static queue: any[] = [];
	static AddQueue(toAdd: any) { responseQueue.queue.push(toAdd) };
	static FromQueue(): any | undefined { return responseQueue.queue.shift() };
}

export function getGenericResponse(message: Discord.Message, prompt: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		let response = responseQueue.FromQueue();
		if (!response)
			return reject('empty queue')
		return resolve(response);

	}).catch(err => { throw err });
}

export function getIntResponse(message: Discord.Message, prompt: string): Promise<number> {
	return new Promise<number>((resolve, reject) => {
		let response = responseQueue.FromQueue();
		if (!response)
			return reject('empty queue')
		if (typeof response == 'number')
			return resolve(response);
		const result = parseInt(response);
		if (isNaN(result))
			reject('Expected a number.');
		return resolve(result);

	}).catch(err => { throw err });
}

export function getPlayerFromMentionIfUndefined(invokeMention: Player | undefined, message: Discord.Message, save: SaveGame): Promise<Player> {
	return new Promise<Player>((resolve, reject) => {
		let response = responseQueue.FromQueue();
		if (!(response instanceof Player))
			return reject('Expected a player object in the queue.')
		return resolve(response);
	})
}

export function confirmationDialogue(message: Discord.Message, prompt: string): Promise<boolean>{
	return new Promise<boolean>((resolve, reject) => {
		let response = responseQueue.FromQueue();
		if (!response)
			return reject('empty queue')
		if (typeof response == 'boolean')
			return resolve(response);
		reject('Expected a boolean.');

	}).catch(err => { throw err });
}