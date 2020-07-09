import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";

@ICommands.register
export class fateCommand implements ICommand {
	requireSave: boolean = true;
	name: string = 'fate';
	description: string = 'Manage your fate points.';
	helptext: string | undefined;
	admin: boolean = false;
	args: boolean = false;
	aliases: string[] | undefined;
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: import("../savegame").SaveGame): Promise<void | string> {
		const character = save.getPlayer(message).CurrentCharacter;
		args = args.filter(a => !a.startsWith('<@'))
		if(!character)
			throw Error('No character found.')
		switch (args[0]){
			case undefined :
				return `Current Fate points: ${character.FatePoints}`
		}
	}

}