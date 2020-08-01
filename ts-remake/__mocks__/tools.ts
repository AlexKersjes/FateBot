import * as Discord from 'discord.js';

export class responseQueue {
	private static queue : string[] = [];
	static AddQueue(string : string) {responseQueue.queue.push(string)};
	static FromQueue() : string | undefined {return responseQueue.queue.shift()};
}

export function getGenericResponse(message: Discord.Message, prompt: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		let response = responseQueue.FromQueue();
		if(!response)
			return reject('empty queue')
	 	return resolve(response);

	}).catch(err => { throw err });
}
