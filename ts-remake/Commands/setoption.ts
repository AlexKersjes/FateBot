import { ICommands, ICommand } from "../command";
import { getGenericResponse, confirmationDialogue } from "../responsetools";
import { SaveGame } from "../savegame";

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
	async execute(message: import("discord.js").Message, args: string[], client: import("discord.js").Client, save: SaveGame): Promise<void | string> {
		save.dirty();
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
			case 'conditions' :
			case 'useconditions' :
				if(save.Options.UseConditions){
					if (await confirmationDialogue(message, 'Are you sure you wish to disable Conditions? All Conditions currently applied to characters will be transformed in to regular Aspects:')) {
						save.Players.forEach(p => {
							p.CurrentCharacter?.convertConditionsToAspects();
						});
						save.ChannelDictionary.Channels.forEach(p => {
							p.situation.convertConditionsToAspects();
						});
					}

					else{throw Error('Cancelled disabling and removing Conditions.')}

				}
				
				save.Options.UseConditions = !save.Options.UseConditions;
				return (`Conditions are now ${save.Options.UseConditions ? 'enabled' : 'disabled'}.`);
			case 'notifications' :
			case 'turn' :
			case 'turns' :
			case 'turnnotifications' :
				const input = args[1] ?? await getGenericResponse(message, 'Specify a notification type. Choose DM or Channel. Other inputs will default to None.');
				return save.Options.notificationType(input);
			case 'prefill' :
			case 'prefillskills':
				return save.Options.prefillToggle();
					
		}
		throw Error('Could not resolve operation.');
	}

}