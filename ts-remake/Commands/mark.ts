import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';
import { CharacterOrOptionalSituationFractal } from "../commandtools";
import { FateFractal } from "../fatefractal";
import { getIntResponse, getGenericResponse } from "../responsetools";
import { Track, ConditionSeverity, Condition, Aspect } from "../dataelements";

@ICommands.register
export class markCommand implements ICommand {
	name: string = 'mark';
	description: string = 'Mark a box on a sheet. Specify the track and index(/ices) of the box(es) to mark.';
	helptext: string | undefined;
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['mk', 'm'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		save.dirty();
		const player = save.getPlayerAuto(message);
		let commandOptions: string = '';
		const Numbers: number[] = [];
		args = args.filter(a => {
			if (!isNaN(parseInt(a))) {
				Numbers.push(parseInt(a));
				return false;
			}
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			if (a.startsWith('<@'))
				return false;
		
			return true;
		});

		let situationCommand = false;
		let fractal: FateFractal;
		({ fractal, commandOptions, situationCommand } = CharacterOrOptionalSituationFractal('element', commandOptions, save, message, player));

		const markable = fractal.FindMarkable(args.join(' '))
		if (!markable)
			throw Error(`Could not find a markable element to match "${args.join(' ')}".`);

		let marking = false;
		let value: [number, boolean];
		try {
			value = markable.Mark(Numbers.shift() ?? markable.BoxValues.length == 1 ? 1 : await getIntResponse(message, save.Options.DresdenStress ? 'How many boxes should be marked?' : 'Which box should be marked?'), save.Options);
			if (value[0] != 0)
				message.channel.send(`${fractal.FractalName} marked ${value[0]} shifts.`); //TODO hook up to rollcontest
		}
		catch (err) {
			value = [err[1], err[2]]
			if (value[0] != 0)
				message.channel.send(`${fractal.FractalName} marked ${value[0]} shifts. ${(err[0] as Error).message}`); // TODO hook up to rollcontest
		}
		marking = value[1];

		if (markable instanceof Track) {
			if (marking && markable.CreatesCondition != ConditionSeverity.None && save.Options.AutoHandleConditions) {
				if (save.Options.UseConditions) {
					const ConditionName = await getGenericResponse(message, `Name a new <${ConditionSeverity[markable.CreatesCondition]}> Condition:`)
					let CondDesc;
					if (commandOptions.includes('d'))
						CondDesc = await getGenericResponse(message, `Provide a description for **${ConditionName}** <${ConditionSeverity[markable.CreatesCondition]}>`);
					const newCond = new Condition(ConditionName, markable.CreatesCondition, CondDesc);
					fractal.Conditions.push(newCond);
					fractal.updateActiveSheets(save.Options);
					return `${fractal.FractalName}'s ${markable.Name} was marked and created **${newCond.Name}** <${ConditionSeverity[newCond.Severity]}>${newCond.Description ? ', ' + newCond.Description : ''}.`
				}
				else {
					const ConditionName = await getGenericResponse(message, `Name a new Consequence:`)
					let CondDesc;
					if (commandOptions.includes('d'))
						CondDesc = await getGenericResponse(message, `Provide a description for **${ConditionName}**:`);
					const newCond = new Aspect(ConditionName, CondDesc);
					fractal.Aspects.push(newCond);
					fractal.updateActiveSheets(save.Options);
					return `${fractal.FractalName}'s ${markable.Name} was marked and created **${newCond.Name}**${newCond.Description ? ', ' + newCond.Description : ''}.`
				
				}
			}
		}
		return `**${fractal.FractalName}**'s ${markable.Name}: ${markable.BoxesString()}`

	}

}