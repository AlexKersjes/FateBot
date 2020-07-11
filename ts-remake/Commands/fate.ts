import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";

@ICommands.register
export class fateCommand implements ICommand {
	requireSave: boolean = true;
	name: string = 'fate';
	description: string = 'Manage your Fate points and Refresh.';
	helptext: string | undefined = 'Use +, - or an integer to gain or spend Fate points.\nInstead of a value, you can use the argument \'refresh\' to refresh points manually.\nInclude -r or -refresh to instead set the refresh value to the number provided.';
	admin: boolean = false;
	GM : boolean = false;
	args: boolean = false;
	aliases: string[] | undefined = ['f'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: import("../savegame").SaveGame): Promise<void | string> {
		const player = save.getPlayer(message);
		args = args.filter(a => !a.startsWith('<@'));
		const character = player.CurrentCharacter;
		let AdjustRefresh = false;
		// filtering out optional arguments;
		args = args.filter(a => {
			if(a.startsWith('-') && isNaN(parseInt(a)) && a.length > 1){
				if(a.includes('r'))
					AdjustRefresh = true;
				return false;
			}
			else
				return true;
		});
		if(!character)
			throw Error('No character found.')
		let adjustValue : number;
		switch (args[0]){
			case undefined :
				return `Current Fate points: **${character.FatePoints}** / **(${character.Refresh})**`
			case '+' :
				adjustValue = 1;
				break;
			case '-' :
				adjustValue = -1;
				break;
			case 'refresh' :
				if(character.Refresh == undefined)
					throw Error('Character does not have a set Refresh value.')
				character.FatePoints = character.Refresh;
				return `${player}'s Fate points refreshed to ${character.Refresh}.`;
			default :
				adjustValue = parseInt(args[0]);
				if(isNaN(adjustValue))
					throw Error('Could not resolve number to adjust fate points with.');
				break;	
		}
		
		if(AdjustRefresh)
		{
			if((character.FatePoints ? character.FatePoints : 0) + adjustValue < 0)
				throw Error('Refresh may not be set to a negative value.');
			character.Refresh = adjustValue;
			return `${player}'s Refresh set to ${adjustValue}.`;
		}

		if((character.FatePoints ? character.FatePoints : 0) + adjustValue < 0)
			return `${player} cannot pay ${-adjustValue} Fate point${-adjustValue > 1 ? 's' : ''}.`;
		else
		{
			if(character.FatePoints == undefined)
				character.FatePoints = 0;
			character.FatePoints += adjustValue;
			return `${adjustValue > -1 ? 'Gaining' : 'Spending'} ${adjustValue < 0 ? adjustValue * -1 : adjustValue} Fate point${ adjustValue * adjustValue > 1 ? 's' : ''}, ${player} now has ${character.FatePoints} Fate points.`;
		}
	}
}