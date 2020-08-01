import * as Discord from 'discord.js';
import { ClientResources } from './singletons';

export class responseQueue {
	private static queue : string[] = [];
	static AddQueue(string : string) {responseQueue.queue.push(string)};
	static FromQueue() : string | undefined {return responseQueue.queue.shift()};
}

export async function getGenericResponse(message: Discord.Message, prompt: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const toBeDeletedMessages = ClientResources.Executing.get(message.author.id);
		const filter = (m: Discord.Message) => m.author.id == message.author.id;
		message.channel.send(prompt).then(m => toBeDeletedMessages?.push(m));
		// collector for confirmation
		let collector = new Discord.MessageCollector(message.channel, filter, { max: 1, time: 20000 });
		collector.on('collect', m => {
			if(!checkMessage(m))
				throw Error('Collected something that was not a message.');
			toBeDeletedMessages?.push(m);
			if(m.content.toLowerCase() == 'cancel'  || m.content.toLowerCase() == 'stop')
				return reject('Operation cancelled.')
			return resolve(m.content);
		});
		// timeout message
		collector.on('end', (s, r) => {
			if (r == 'time')
				return reject(Error('Timed out.'));
		});
	}).catch(err => { throw err });
}

function checkMessage(m: unknown): m is Discord.Message {
	return (m as Discord.Message).content !== undefined;
}
