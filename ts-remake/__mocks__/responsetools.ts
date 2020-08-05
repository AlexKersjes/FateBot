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


export const deepCopy = <T>(target: T): T => {
	if (target === null) {
		return target;
	}
	if (target instanceof Date) {
		return new Date(target.getTime()) as any;
	}
	if (target instanceof Array) {
		const cp = [] as any[];
		(target as any[]).forEach((v) => { cp.push(v); });
		return cp.map((n: any) => deepCopy<any>(n)) as any;
	}
	if (typeof target === 'object' && target !== {}) {
		const cp = { ...(target as { [key: string]: any }) } as { [key: string]: any };
		Object.keys(cp).forEach(k => {
			cp[k] = deepCopy<any>(cp[k]);
		});
		return cp as T;
	}
	return target;
};