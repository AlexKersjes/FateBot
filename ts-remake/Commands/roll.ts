import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";

@ICommands.register
export class rollCommand implements ICommand{
	requireSave: boolean = false;
	name: string = 'roll';
	description: string = 'Roll the dice';
	helptext: string | undefined;
	admin: boolean = false;
	args: boolean = false;
	aliases: string[] | undefined = ['r'];
	cooldown: number | undefined;
	execute(message: Message, args: string[], client: Client, save?: import("../savegame").SaveGame | undefined): Promise<void | string> {
		throw new Error("Method not implemented.");
	}

}