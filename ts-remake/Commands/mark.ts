import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';

@ICommands.register
export class markCommand implements ICommand{
	name: string = 'mark';
	description: string = 'Mark a box on a sheet. Specify the track and index(/ices) of the box(es) to mark.';
	helptext: string | undefined;
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['mk', 'm'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame | undefined): Promise<void | string> {
		throw new Error("Method not implemented.");
	}
	
}