import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';
import { FateFractal } from "../fatefractal";
import { getGenericResponse, confirmationDialogue, getIntResponse } from "../responsetools";
import { HelpText } from "./_CommandHelp";
import { FateVersion } from "../options";
import { CharacterOrOptionalSituationFractal } from "../commandtools";

@ICommands.register
export class skillCommand implements ICommand {
	name: string = 'skill';
	description: string = 'Create or modify Skills. Use options, prefixed by `-` for manipulation.';
	helptext: string | undefined = HelpText.skill;
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['approach', 'sk', 'k', 'app'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		let skipFinally = false;
		const skillTerm = save.Options.FateVersion == FateVersion.Accelerated ? 'Approach' : 'Skill';

		const player = save.getPlayerAuto(message);
		let commandOptions: string = '';
		let Numbers: number[] = []
		args = args.filter(a => {
			if (!isNaN(parseInt(a))) {
				Numbers.push(parseInt(a));
				return false
			}
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			if (a.startsWith('<@'))
				return false;
			return true;
		});

		let fractal: FateFractal;
		let situationCommand: boolean = false;
		({ fractal, commandOptions, situationCommand } = CharacterOrOptionalSituationFractal('Skill', commandOptions, save, message, player));


		if (save.Options.GMCheck(message.author.id) && commandOptions.includes('point')) {
			const value = Numbers.shift() ?? 1;
			let pointlist = fractal.Skills.getActive();
			if (pointlist == undefined)
				throw Error('This character has no skill lists. Add a list before adding points.');
			if (commandOptions.includes('l')) {
				const temp = fractal.Skills.FindList(args.join(' '));
				if (temp != undefined)
					pointlist = temp;
			}
			pointlist.AddSkillPoints(value)
			return `${value} skill point${value > 1 ? 's were' : ' was'} added to ${pointlist.ListName}.`;
		}

		if (commandOptions.includes('o')) {
			const currentList = fractal.Skills.rotate();
			if (currentList == undefined)
				return 'This character has no skill lists.';
			return `${currentList.ListName} is now your primary skill list.`;
		}




		let SkillName = args.join(' ');
		let SecondSkillName = '';
		if (args.includes('|')) {
			SkillName = args.slice(args.indexOf('|') + 1).join(' ');
			SecondSkillName = args.slice(0, args.indexOf('|')).join(' ');
			if (commandOptions.includes('a')) {
				if (fractal.Skills.Lists.length < 2)
					commandOptions.concat('l');
				else if (args.includes('|')) {
					const temp1 = fractal.Skills.FindSkill(SkillName);
					const temp2 = fractal.Skills.FindSkill(SecondSkillName);
					if (temp1 != undefined && temp2 != undefined && temp1[1] == temp2[1])
						throw Error('Cannot attach two skills on the same list.');
				}
				else if (args.length == 2) {
					const temp1 = fractal.Skills.FindSkill(SkillName);
					const temp2 = fractal.Skills.FindSkill(SecondSkillName);
					if (temp1 != undefined && temp2 != undefined && temp1[1] == temp2[1])
						throw Error('Cannot attach two skills on the same list.');
				}
			}
		}
		// See if there are existing stunts that match
		let currentList = fractal.Skills.getActive();
		if (currentList == undefined)
			message.channel.send('This character has no skill lists.');
		if (currentList == undefined || commandOptions.includes('l')) {
			const temp = fractal.Skills.FindList(SkillName);
			if (temp != undefined) {
				currentList = temp;
				SkillName = SecondSkillName;
			}
			else {
				const input = await getGenericResponse(message, 'Provide a name for the skill list you wish to make or select:');
				currentList = fractal.Skills.FindList(input);
				if (currentList == undefined) {
					currentList = fractal.Skills.CreateList(input, commandOptions.includes('b') ? false : save.Options.PrefillSkills, save.Options);
					save.dirty();
					return `Created ${currentList.ListName}.\n${currentList.toString(false)}`
				}
				else
					message.channel.send(`Selected ${currentList.ListName}.`);
			}

			if (commandOptions.includes('lp')) {
				console.log('here');
				fractal.Skills.setActive(currentList);
				message.channel.send(`${currentList.ListName} is now your primary skill list.`);
				if (SkillName == '')
					return currentList.toString(false);
			}
		}


		// Put the string back together without prefixes.
		if (SkillName == '' && !(commandOptions.includes('l') && commandOptions.includes('r')))
			SkillName = await getGenericResponse(message, `Please provide a${(save.Options.FateVersion == FateVersion.Accelerated ? 'n ' : ' ') + skillTerm} name:`);


		let matched = currentList.FindSkill(SkillName);
		if (matched == undefined) {
			matched = currentList.FindSkill(args[0]);
			if (matched != undefined)
				SecondSkillName = args[1] ?? '';
		}

		if (commandOptions.includes('swap') || commandOptions.includes('switch')) {
			if (matched) {
				if (SecondSkillName == '')
					SecondSkillName = await getGenericResponse(message, `Provide a second ${skillTerm} name to swap ratings with "${matched.Name}":`);
				const swapped = currentList.SwapSkills(SkillName, SecondSkillName);
				save.dirty();
				return `Swapped ratings of "${swapped[0].Name}" and "${swapped[1].Name}".`;
			}
			else if (args.length == 2) {
				const swapped = currentList.SwapSkills(args[0], args[1]);
				save.dirty();
				return `Swapped ratings of "${swapped[0].Name}" and "${swapped[1].Name}".`;
			}
			throw Error('Uncaught syntax error while swapping ratings.');
		}


		// If there are no matches, create a new Stunt.
		try {

			if (matched == undefined) {
				// Delete list case
				if (commandOptions.includes('r'))
					if (commandOptions.includes('l'))
						if (confirmationDialogue(message, `Are you sure you wish to delete the *entire* ${currentList.ListName} skill list?`)) {
							fractal.Skills.DeleteList(currentList);
							return `Deleted skill list ${currentList.ListName}`;
						}
						else
							throw Error('Cancelled skill list deletion.')
					else
						throw Error(`No matches found for "${SkillName}".`);

				if (!save.Options.GMCheck(message.author.id) && save.Options.PrefillSkills) {
					throw Error(skillTerm + 's other than the default set are restricted by GM permission while the automatic list prefill is enabled.')
				}
				// Create new Skill case
				let rating = Numbers.shift() ?? await getIntResponse(message, `No match found. Supply a rating to create a new ${skillTerm}:`)
				const newskill = currentList.AddSkill(SkillName, rating);
				let returnstring = `Created ${skillTerm} "${newskill.Name}"${fractal.Skills.Lists.length > 1 ? ' , on list ' + currentList.ListName : ''}.`;

				if (commandOptions.includes('a')) {
					if (SecondSkillName == '')
						SecondSkillName = await getGenericResponse(message, `Attach "${newskill.Name}" to:`);
					try {
						returnstring += '\n' + fractal.Skills.Attach(newskill.Name, SecondSkillName);
					}
					catch (err) {
						returnstring += '\n' + (err as Error).message;
					}
				}

				return returnstring
			}
			else if (matched) {
				if (commandOptions.includes('r')) {
					if (await confirmationDialogue(message, `Are you sure you wish to delete "${matched.Name}"?`)) {
						currentList.DeleteSkill(matched);
						return (matched.Name + ' was deleted.')
					}
					else
						throw Error(`Cancelled ${skillTerm} deletion.`);
				}

				if (commandOptions.includes('d')) {
					matched.Detach();
					return 'Detached "' + matched.Name + '".'
				}

				if (commandOptions.includes('a')) {
					return fractal.Skills.Attach(matched.Name, SecondSkillName != '' ? SecondSkillName : await getGenericResponse(message, `Attach "${matched.Name}" to:`));
				}

				let rating = Numbers.shift() ?? await getIntResponse(message, `Supply a value to adjust the rating of "${matched.Name}" by:`);
				currentList.AdjustSkillValue(matched, rating, save.Options, message.author.id);
				return `Adjusted ${skillTerm} "${matched.Name}" by ${rating} to ${matched.Value}${fractal.Skills.Lists.length > 1 ? ' , on list ' + currentList.ListName : ''}.`
			}
		}
		catch (err) {
			skipFinally = true;
			throw err;
		}
		finally {
			if (!skipFinally) {
				fractal.updateActiveSheets(save.Options);
				save.dirty();
			}
		}
	}

}