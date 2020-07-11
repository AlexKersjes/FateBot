import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';

@ICommands.register
export class charselectCommand implements ICommand{
	requireSave: boolean = true;
	name: string = 'charselect';
	description: string = 'Load a character';
	helptext: string | undefined;
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = true;
	aliases: string[] | undefined = ['select', 'cs'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		throw new Error("Method not implemented.");
	}
	
}