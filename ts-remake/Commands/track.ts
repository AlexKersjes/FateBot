import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';

@ICommands.register
export class trackCommand implements ICommand{
	name: string = 'track';
	description: string = 'Create or modify Stunts. Use options, prefixed by `-` for manipulation.';
	helptext: string | undefined;
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined;
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		
	}
	
}