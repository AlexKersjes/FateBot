import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";

@ICommands.register
export class fateCommand implements ICommand {
	requireSave: boolean = true;
	name: string = 'fate';
	description: string = 'Manage your fate points.';
	helptext: string | undefined;
	admin: boolean = false;
	args: boolean = true;
	aliases: string[] | undefined;
	cooldown: number | undefined;
	execute(message: Message, args: string[], client: Client, save?: import("../savegame").SaveGame | undefined): Promise<any> {
		throw new Error("Method not implemented.");
	}

}