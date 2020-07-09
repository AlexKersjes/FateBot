import { ICommands, ICommand } from "../command";

@ICommands.register
class setoptionCommand implements ICommand{
	requireSave: boolean = true;
	name: string = 'setoptions';
	description: string = 'Change a game setting.';
	helptext: string | undefined;
	admin: boolean = true;
	args: boolean =  true;
	aliases: string[] | undefined = ['option', 'options', 'o'];
	cooldown: number | undefined;
	async execute(message: import("discord.js").Message, args: string[], client: import("discord.js").Client, save: import("../savegame").SaveGame): Promise<void | string> {
		const Options = save?.Options;
		if(Options == undefined)
			throw Error("No options could be found. Try starting or loading a game first.");
		switch (args[0])
		{
			case 'customprefix' || 'prefix' :
				if (!args[1])
					throw Error('Supply another argument. That argument will be set as a prefix for bot commands on this server.');
				Options.CustomPrefix = args[1];
				return `Bot prefix set to ${args[1]}`;
		}
	}

}