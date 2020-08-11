import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';
import { FateFractal } from "../fatefractal";
import { getGenericResponse } from "../responsetools";
import { Atom } from "../dataelements";
import { SkillList } from "../skills";
import { CharacterOrOptionalSituationFractal, getMatchFromArray } from "../commandtools";
import { sheetembed } from "../embeds";

@ICommands.register
export class hideCommand implements ICommand{
	name: string = 'hide';
	description: string = 'Toggle the Hidden status of anything on a sheet. An aspect, a Stunt.';
	helptext: string | undefined = 'Supply a string that matches the element to (un)hide. Use `-unhide`, `-reveal`, or `-all` to reveal all sheet elements.';
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['hd'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		let player = save.getPlayerAuto(message);
		let commandOptions = '';
		let character : FateFractal;

		args = args.filter(a => {
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			if(a.startsWith('<@'))
				return false;
			return true;
		});

		({ fractal: character, commandOptions } = CharacterOrOptionalSituationFractal('elements', commandOptions, save, message, player));

		save.dirty();

		let fields: any[] = [];
		if(character.HighConcept)
			fields.push(character.HighConcept);
		if(character.Trouble)
			fields.push(character.Trouble);
		fields.push(character.Aspects);
		fields.push(character.Conditions);
		fields.push(character.Stunts);
		fields.push(character.Tracks);
		fields.push(character.Skills.Lists)

		fields = fields.flat();

		if(commandOptions.includes('all') || commandOptions.includes('unhide') || commandOptions.includes('reveal')) {
			fields.forEach(f => f.Hidden = false);
			return `All elements on ${character.FractalName}'s sheet were revealed.`
		}

		const inputstring = args.join(' ');

		const match : Atom | FateFractal | SkillList = getMatchFromArray(fields, inputstring);
		if(match == undefined)
			throw Error(`Could not find a match for "${inputstring}".`);
		
		match.Hidden = !match.Hidden;

		character.updateActiveSheets(save.Options);

		if(match.Hidden)
				return 'Hidden.';
		if(match instanceof FateFractal) {
			message.channel.send (`${character}'s ${match.FractalName} was revealed.`, sheetembed(match, save.Options) );
			return;
		}
		else if (match instanceof SkillList) {
			return `${character}'s skill list ${character.Skills.Lists.length == 0 ? '' : match.ListName + ' '}was revealed.\n${match.toString(true)}`
		}
		return `${character}'s **${match.Name}** was revealed.\n${match.Description ? '*' + match.Description + '*' : ''}`;
	}
	


}

