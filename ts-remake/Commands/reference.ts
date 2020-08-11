import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';
import { getMatchFromArray, CharacterOrOptionalSituationFractal } from "../commandtools";
import { FateFractal } from "../fatefractal";
import { Atom, Condition, ConditionSeverity, IsMarkable } from "../dataelements";
import { SkillList } from "../skills";
import { sheetembed } from "../embeds";

@ICommands.register
export class referenceCommand implements ICommand{
	name: string = 'reference';
	description: string = 'Post a reference to the sheet element specified.';
	helptext: string | undefined;
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['ref'];
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

		const inputstring = args.join(' ');

		const match : Atom | FateFractal | SkillList = getMatchFromArray(fields, inputstring);
		if(match == undefined)
			throw Error(`Could not find a match for "${inputstring}".`);
		
		if(match.Hidden)
				return 'Hidden.';
		if(match instanceof FateFractal) {
			message.channel.send(`**${character.FractalName}**:`,sheetembed(match, save.Options) );
			return;
		}
		else if (match instanceof SkillList) {
			return `**${character.FractalName}**:\n${match.toString(true)}`
		}
		return `**${character.FractalName}**:\n${IsMarkable(match) ? match.BoxesString() : ''}**${match.Name}**, ${(match as Condition).Severity ? `<${ConditionSeverity[(match as Condition).Severity]}>, ` : ''}${match.Description ? '*' + match.Description + '*' : ''}.`;
	}
	
}