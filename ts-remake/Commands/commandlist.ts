import { ICommand, ICommands } from "../command";
import { Message, Client } from "discord.js";
import { Commands } from '../app';

@ICommands.register
export class commandlistCommand implements ICommand {
	requireSave: boolean = false;
	name: string = 'commandlist';
	description: string = 'Shows a list of commands.';
	helptext: string | undefined = 'Admin commands are only shown to members with GM permission or Administrator permissions.';
	admin: boolean = false;
	args: boolean = false;
	aliases: string[] | undefined = ['command', 'commands', 'c'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save?: import("../savegame").SaveGame | undefined): Promise<void | string> {
		let newstring = 'Bot commands:\n';
		Commands.forEach(async c => {
			if(c.admin && !(save?.Options.GMCheck(message.author.id)||message.member?.hasPermission("ADMINISTRATOR")))
				return;
			const tempstring = `     **${c.name}** ${c.admin ? '*GM*' : ''}: ${c.description}\n`;
			if (newstring.length + tempstring.length > 2000){
				await message.channel.send(newstring);
				newstring = '';
			}
			newstring += tempstring;
		});
		return newstring;
	}
	
}