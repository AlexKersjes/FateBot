import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';
import { FateFractal } from "../fatefractal";
import * as Discord from 'discord.js';
import { getGenericResponse, confirmationDialogue, getIntResponse } from "../tools";
import { ReadOnlySkill } from "../skills";
import { HelpText } from "./_CommandHelp";
import { FateVersion } from "../options";

@ICommands.register
export class skillCommand implements ICommand {
	name: string = 'skill';
	description: string = HelpText.skill;
	helptext: string | undefined;
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
		args = args.filter(a => !a.startsWith('<@'));
		let commandOptions: string = '';
		args = args.filter(a => {
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			return true;
		});

		let fractal: FateFractal;

		// Get situation instead
		if (commandOptions.includes('s')) {
			if (!save.Options.GMCheck(message.author.id) && save.Options.RequireGMforSituationAccess)
				throw Error('GM permission is needed to directly change situation stunts. (Can be disabled in settings.)');
			fractal = save.ChannelDictionary.FindDiscordChannel((message.channel as Discord.TextChannel)).situation;
		}
		else {
			if (!player.CurrentCharacter)
				throw Error(`${player} has no character selected.`);
			fractal = player.CurrentCharacter;
		}

		if(commandOptions.includes('rotate') || commandOptions.includes('rot') || commandOptions.includes('swap') ||commandOptions.includes('switch')){
			const currentList = fractal.Skills.rotate();
			if(currentList == undefined)
				return 'This character has no skill lists.';
			return `${currentList.ListName} is now your primary skill list.`;
		}

		let expectedNumbers = 1;
		if (commandOptions.includes('r'))
			expectedNumbers = 0;
		let Numbers: number[] = []

		// Filter out numbers unless none are expected
		if (expectedNumbers > 0) {
			const argsCopy: string[] = [];
			args.forEach(a => {
				const parsed = parseInt(a);
				if (!isNaN(parsed))
					Numbers.push(parsed);
				else
					argsCopy.push(a);
			});
			args = argsCopy;
		}

		let SkillName = args.join(' ');

		// See if there are existing stunts that match
		let currentList = fractal.Skills.getActive();
		if (currentList == undefined)
			message.channel.send('This character has no skill lists.');
		if (currentList == undefined || commandOptions.includes('l')) {
			const temp = fractal.Skills.FindList(SkillName);
			if (temp != undefined)
				currentList = temp;
			else {
				const input = await getGenericResponse(message, 'Provide a name for the skill list you wish to make or select:');
				currentList = fractal.Skills.FindList(input);
				if (currentList == undefined)
					currentList = fractal.Skills.CreateList(input, save.Options.PrefillSkills, save.Options);
				else
					message.channel.send(`Selected ${currentList.ListName}.`)
			}

		}

		// Put the string back together without prefixes.
		if (args.length == 0 || (commandOptions.includes('l') && commandOptions.includes('r')))
			args = await (await getGenericResponse(message, `Please provide a${save.Options.FateVersion == FateVersion.Accelerated ? 'n' : '' + skillTerm} name:`)).split(' ');
		SkillName = args.join(' ');

		if (Numbers.length != expectedNumbers) {
			getIntResponse(message, 'Provide an integer as a starting value or value to adjust the rating by:');
		}

		const matched = currentList.FindSkill(SkillName);

		// If there are no matches, create a new Stunt.
		try {

			if (matched == undefined) {
				if (commandOptions.includes('r'))
					if(commandOptions.includes('l'))
						if(confirmationDialogue(message, `Are you sure you wish to delete the *entire* ${currentList.ListName} skill list?`)){
							fractal.Skills.DeleteList(currentList);
							return `Deleted skill list ${currentList.ListName}`;
						}
						else
							throw Error('Cancelled skill list deletion.')
					else
						throw Error(`No matches found for "${SkillName}".`);

				const rating = Numbers.unshift();
				if (rating == undefined)
					throw Error(`A rating is required to create a new ${skillTerm}.`)
				const newskill = currentList.AddSkill(SkillName, rating);
				return `Created ${skillTerm} "${newskill.Name}"${fractal.Skills.Lists.length > 1 ? ' , on list ' + currentList.ListName : ''}.`
			}
			else if (matched) {
				if (commandOptions.includes('r')) {
					if (await confirmationDialogue(message, `Are you sure you wish to delete ${matched.Name}?`)) {
						currentList.DeleteSkill(matched);
					}
					else
						return `Cancelled ${skillTerm} deletion.`;
				}
				const rating = Numbers.unshift();
				if (rating == undefined)
					throw Error(`A value must be supplied to adjust the rating of "${matched.Name}" by.`)
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
				fractal.updateActiveSheets();
				save.dirty();
			}
		}
	}

}