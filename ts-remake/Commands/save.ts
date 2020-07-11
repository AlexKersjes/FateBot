import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';

@ICommands.register
export class saveCommand implements ICommand{
	name: string = 'savegame';
	description: string = 'Manually save a game.';
	helptext: string | undefined;
	admin: boolean = true;
	GM : boolean = false;
	args: boolean = false;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['save'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		save.save();
		return 'Saved the game.';
	}
	
}