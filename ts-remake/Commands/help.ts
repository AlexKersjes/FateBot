import { ICommands, ICommand } from "../command";
import { Commands } from '../app';

@ICommands.register
export class helpCommand implements ICommand {
	requireSave: boolean = false;
	name: string = 'help';
	description: string = 'Shows description and shorthands/aliases for a specific public command.';
	helptext: string | undefined = 'When using a command, you can use **--h** somewhere in the message. If you do, it will bring up the help text for that command.';
	admin: boolean = false;
	GM : boolean = false;
	args: boolean = false;
	aliases: string[] | undefined = ['h'];
	cooldown: number | undefined;
	async execute(message: import("discord.js").Message, args: string[], client: import("discord.js").Client, save?: import("../savegame").SaveGame | undefined): Promise<void> {
		if (!args[0]) {
			message.channel.send('Use this command with a command name or alias (or use the optional argument --h in a command) to view a detailed description of the command.\nUse the command "commandlist" to view commands available to you.\nCreate a new game with "start"\nSetting a custom prefix with "options" is recommended.');
			return;
		}

		const command = Commands.get(args[0]) || Commands.find(cmd => {
			if (cmd.aliases?.includes(args[0]))
				return true;
			return false
		});
		if (command == undefined)
			throw Error('No command with that name could be found.');

		if (command.admin && !(save?.Options.GMCheck(message.author.id)||message.member?.hasPermission("ADMINISTRATOR")))
			throw Error('You do not have access to this command.');

		let aliases = '';
		if (command.aliases != undefined) {
			command.aliases.forEach(alias => {
				aliases += `'${alias}' `;
			});

		}

		message.channel.send(`**'${command.name}' ${aliases}**: ${command.description}\n${command.helptext ? command.helptext : ''}`);
	}

}