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
	args: boolean = true;
	aliases: string[] | undefined = ['select', 'cs'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<any> {
		throw new Error("Method not implemented.");
	}
	
}