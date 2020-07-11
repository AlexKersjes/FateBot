import * as Discord from 'discord.js';


export async function getGenericResponse(message: Discord.Message, prompt: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const filter = (m: Discord.Message) => m.author.id == message.author.id;
		message.channel.send(prompt);
		// collector for confirmation
		let collector = new Discord.MessageCollector(message.channel, filter, { max: 1, time: 20000 });
		collector.on('collect', m => {
			resolve(m.content);
		});
		// timeout message
		collector.on('end', (s, r) => {
			if (r == 'time')
				reject(Error('Timed out.'));
		});
	}).catch(err => { throw err });
}
