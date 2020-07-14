import * as Discord from 'discord.js';
import { executing } from './app';

export class responseQueue {
	private static queue : string[] = [];
	static AddQueue(string : string) {responseQueue.queue.push(string)};
	static FromQueue() : string | undefined {return responseQueue.queue.shift()};
}

export async function getGenericResponse(message: Discord.Message, prompt: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const toBeDeletedMessages = executing.get(message.author.id);
		const filter = (m: Discord.Message) => m.author.id == message.author.id;
		message.channel.send(prompt).then(m => toBeDeletedMessages?.push(m));
		// collector for confirmation
		let collector = new Discord.MessageCollector(message.channel, filter, { max: 1, time: 20000 });
		collector.on('collect', m => {
			toBeDeletedMessages?.push(m);
			return resolve(m.content);
		});
		// timeout message
		collector.on('end', (s, r) => {
			if (r == 'time')
				return reject(Error('Timed out.'));
		});
	}).catch(err => { throw err });
}
