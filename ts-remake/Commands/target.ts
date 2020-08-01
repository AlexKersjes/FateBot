import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';

@ICommands.register
export class targetCommand implements ICommand{
	name: string = 'target';
	description: string = 'Set a target difficulty for a roll.';
	helptext: string | undefined = 'Include an integer to set as the target. Include skill names to restrict which skills can be used for the roll.\nIf multiple integers are provided, then provide that many skill names to set different targets per skill. Use the modifier `-r` to resolve the current roll. ';
	admin: boolean = false;
	GM: boolean = true;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['tg', 'difficulty', 'dc', 'diff'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		const numbers = [];
		let commandOptions: string = '';
		args = args.filter(a => {
			if( !isNaN(parseInt(a)) ){
				numbers.push(parseInt(a));
				return false;
			}
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			return true;
		});
		
		if(numbers.length > 1 && numbers.length != args.length){
			if(numbers.length > args.length)
				throw Error('Expected more skill identifiers.');
			else
				throw Error('Expected fewer skill identifiers.')
		}

		save.Options.DefaultSkills;


	}
	
}