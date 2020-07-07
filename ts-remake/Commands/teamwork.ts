import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";

@ICommands.register
export class teamwork implements ICommand{
	name: string = 'teamwork';
	description: string = 'Assist a roll by using teamwork.';
	helptext: string | undefined;
	admin: boolean = false;
	args: boolean = false;
	aliases: string[] | undefined = ['tw'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save?: import("../savegame").SaveGame | undefined): Promise<any> {
		throw new Error("Method not implemented.");
	}
	
}