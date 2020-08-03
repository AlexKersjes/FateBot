import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';
import { confirmationDialogue, getGenericResponse } from "../tools";
import { Atom } from "../dataelements";

@ICommands.register
export class detailCommand implements ICommand{
	name: string = 'detail';
	description: string = 'Add a detail or note to your character sheet.';
	helptext: string | undefined = 'Seperate detail name and content with `|` to skip the prompt. Use `-r` to delete a detail by name or index.';
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['det', 'note'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		const player = save.getOrCreatePlayerById(message.author.id);
		const character = player.CurrentCharacter;
		if(character == undefined)
			throw Error(player + ' has no character to add a note to selected.');
		
		if(args.includes('-r')) {
			args = args.filter(a => a == '-r')
			if(!character.Details)
				throw Error('No details to delete.')
			let detail : Atom | undefined;
			if(isNaN(parseInt(args[0])))
				detail = character.Details[parseInt(args[0]) - 1];
			else
				detail = character.Details.find(d => d.match(args.join(' ')));
			if(detail == undefined)
				throw Error('Could not find detail.')
			character.Details.splice(character.Details.indexOf(detail));
			return `Removed detail "${detail.Name}"`;
		}
		
		
		let name = args.join(' ');
		let description;
		if(args.length > 6 && !args.includes('|')){
			if(! await confirmationDialogue(message, `Are you sure you want to name your detail "${name}?"`))
				throw Error('Cancelled.');
		}
		else {
			name = args.slice(args.indexOf('|') + 1).join(' ');
			description = args.slice(0, args.indexOf('|')).join(' ');
		}

		if(!description)
			description = await getGenericResponse(message, 'Add text to your detail:');

		if(!character.Details)
			character.Details = [];
		character.Details.push(new Atom(name, description));
		save.dirty();
		return `Added detail.`
	}
	
}