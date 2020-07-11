import { ICommands, ICommand } from "../command";
import { TextChannel } from "discord.js";

@ICommands.register
export class announceCommand implements ICommand {
	requireSave: boolean = false;
	helptext: string | undefined = '*syntax:* .announce <channel mention> <markup e.g. \\*\\* [optional] > /<your message> ';
	name: string = 'announce';
	description: string = 'The Raven speaks.';
	admin: boolean = false;
	GM = true;
	args: boolean = true;
	aliases: string[] | undefined;
	cooldown: number | undefined;
	async execute(message: import("discord.js").Message, args: string[], client: import("discord.js").Client): Promise<void> {
		let markup = args[1];
		if (args[2]) {
			if (!args[2].includes('/')) {
				if (args[1].charAt(0) == '/') {
					markup = '';
				}
				else {
					throw Error('Incorrect Syntax.')
				}
			}
		}
		else
			markup = '';
		const mention = message.mentions?.channels.first();
		if (mention == undefined)
			throw Error('You must mention a channel to send a message to.');
		const channel = client.channels.get(mention.id) as TextChannel;
		if (channel == undefined)
			throw Error('I cannot access this channel.');
		channel.send(`${markup}${message.cleanContent.split('/')[1]}${markup}`);
	}

}