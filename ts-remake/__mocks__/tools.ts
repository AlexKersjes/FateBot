import * as Discord from 'discord.js';

export class responseQueue {
	private static queue : string[] = [];
	static AddQueue(string : string) {responseQueue.queue.push(string)};
	static FromQueue() : string | undefined {return responseQueue.queue.shift()};
}

export async function getGenericResponse(message: Discord.Message, prompt: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		let response = responseQueue.FromQueue();
		if(response)
			return resolve(response);
		reject('empty queue')

	}).catch(err => { throw err });
}
