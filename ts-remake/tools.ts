import * as Discord from 'discord.js';
import { ClientResources } from './singletons';
import { Player, SaveGame } from './savegame';

export class responseQueue {
	private static queue : any[] = [];
	static AddQueue(toAdd : any) {responseQueue.queue.push(toAdd)};
	static FromQueue() : string | undefined {return responseQueue.queue.shift()};
}

export function getGenericResponse(message: Discord.Message, prompt: string): Promise<string> {
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

export function getIntResponse(message: Discord.Message, prompt: string): Promise<number> {
	return new Promise<number>((resolve, reject) => {
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
				return reject('Operation cancelled.');
			const returnnumber: number =  parseInt(m.content);
			if(isNaN(returnnumber))
				return reject('Expected an integer.');
			return resolve(returnnumber);
		});
		// timeout message
		collector.on('end', (s, r) => {
			if (r == 'time')
				return reject(Error('Timed out.'));
		});
	}).catch(err => { throw err });
}

export function getPlayerFromMentionIfUndefined(invokeMention: Player | undefined, message: Discord.Message, save: SaveGame) : Promise<Player> {
	return new Promise<Player>((resolve, reject) => {
		if (invokeMention)
			return resolve(invokeMention);
		const filter = (m: Discord.Message) => m.author.id == message.author.id;
		message.channel.send('Mention the player you wish to grant the free invoke:').then(m => ClientResources.Executing.get(message.author.id)?.push(m));
		// collector for confirmation
		let collector = new Discord.MessageCollector(message.channel, filter, { max: 1, time: 20000 });
		collector.on('collect', m => {
			ClientResources.Executing.get(message.author.id)?.push(m);
			let p = save.Players.find(p => p.id == ((m as Discord.Message).mentions.members?.first()?.id));
			if (p == undefined)
				reject('Could not find player mention, or that player has no sheet.');
			resolve(p);
		});
		// timeout message
		collector.on('end', (s, r) => {
			if (r == 'time')
				reject(Error('Timed out.'));
		});
	}).catch(err => { throw err; });
}


export function confirmationDialogue(message: Discord.Message, prompt: string): Promise<boolean> {
	return new Promise<boolean>((resolve, reject) => {
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
			return resolve(m.content.toLowerCase() == 'yes' || m.content.toLowerCase() == 'y' ? true : false);
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
