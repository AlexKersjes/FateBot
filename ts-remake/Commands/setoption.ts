import { ICommands, ICommand } from "../command";

@ICommands.register
class setoptionCommand implements ICommand{
	requireSave: boolean = true;
	name: string = 'setoptions';
	description: string = 'Change a game setting.';
	helptext: string | undefined;
	admin: boolean = true;
	GM : boolean = false;
	args: boolean =  true;
	aliases: string[] | undefined = ['option', 'options', 'o'];
	cooldown: number | undefined;
	async execute(message: import("discord.js").Message, args: string[], client: import("discord.js").Client, save: import("../savegame").SaveGame): Promise<void | string> {
		switch (args[0].toLowerCase())
		{
			case 'customprefix' :
			case 'prefix' :
				if (!args[1])
					throw Error('Supply another argument. That argument will be set as a prefix for bot commands on this server.');
				save.Options.CustomPrefix = args[1];
				return `Bot prefix set to ${args[1]}.`;
			case 'gm' : 
			case 'gmtoggle' :
			case 'permit' :
			case 'promote' :
				const user = message.mentions.users.last();
				if (user == client.user || user == undefined)
					throw Error('Please mention the user whose permissions you wish to toggle.');
				save.Options.GMToggle(user.id);
				if(save.Options.GMCheck(user.id))
					return `${user} now has GM permission.`
				else
					return `${user} no longer has GM permission.`
					
		}
		throw Error('Could not resolve operation.');
	}

}