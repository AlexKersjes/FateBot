import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';

@ICommands.register
export class teamworkCommand implements ICommand{
	GM: boolean = false;
	requireSave: boolean = true;
	name: string = 'teamwork';
	description: string = 'Assist a roll by using teamwork.';
	helptext: string | undefined;
	admin: boolean = false;
	args: boolean = false;
	aliases: string[] | undefined = ['tw'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		throw new Error("Method not implemented.");
	}
	
}