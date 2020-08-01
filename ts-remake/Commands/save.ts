import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';
import { setInterval } from "timers";
import { ClientResources } from "../singletons";

@ICommands.register
export class saveCommand implements ICommand{
	name: string = 'savegame';
	description: string = 'Manually save a game.';
	helptext: string | undefined;
	admin: boolean = true;
	GM : boolean = false;
	args: boolean = false;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['save', 'autosave'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		save.save();
		if(args[0])
		{
			if(!save.CurrentGuild)
				throw Error('Game is not loaded anywhere.');
			if (args[0] == 'stop'){
				ClientResources.stopSave(save.CurrentGuild);
			}
			const number = parseInt(args[0]);
			if (isNaN (number))
				throw Error('Could not parse autosave timer.');
			if (number < 1)
				throw Error('Autosave timer has to be at least 1 minute.');
			ClientResources.setSave(save.CurrentGuild, setInterval(() => {
				() => save.save();
			}, number * 1000 * 60))
		}
		
		return 'Saved the game.';
		
	}
	
}