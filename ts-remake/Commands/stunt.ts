import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';
import { FateFractal } from "../fatefractal";
import * as Discord from 'discord.js'
import { Stunt, Atom } from "../dataelements";
import { getGenericResponse } from "../tools";

@ICommands.register
export class stuntCommand implements ICommand {
	name: string = 'stunt';
	description: string = 'Create or modify stunts. Use options, prefixed by `-` for manipulation.';
	helptext: string | undefined = 'Options:\n`s`              Adjust the current **S**ituation.\n`d`              Edit a Stunt **D**escription. You will be required a description when creating a Stunt.\n`c`              Set or adjust the amount of Fate points this Stunt **C**osts when used. Default is 0.\n`b`              Set or adjust the amount of **B**onus shifts this Stunt provides when used. Default is 2.\n                   (When setting both bonus and cost specify cost first.)\n`r`              **R**emove a Stunt.\n`f`              for adding a **F**ree use to a costed Stunt.\n`i`              to use (**I**nvoke) a Stunt.';
	admin: boolean = false;
	GM = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['st'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
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
			fractal = save.Channels.FindDiscordChannel((message.channel as Discord.TextChannel)).situation;
		}
		else {
			if (!player.CurrentCharacter)
				throw Error(`${player} has no character selected.`);
			fractal = player.CurrentCharacter;
		}

		if (commandOptions.includes('r')) {
			let number;
			if (!args[0])
				args = await (await getGenericResponse(message, 'Which stunt do you wish to delete? Specify a number or name:')).split(' ');

			number = parseInt(args[0]);
			if (!isNaN(number) && args.length == 1) {
				const toBeDeleted = fractal.Stunts[number - 1];
				const response = await (await getGenericResponse(message, `Are you sure you wish to delete "${(toBeDeleted as Atom).Name ?? (toBeDeleted as FateFractal).FractalName}"?${toBeDeleted instanceof FateFractal ? `\n"${toBeDeleted.FractalName}" is a fractal.` : ''}`)).toLowerCase();
				if (response == 'yes' || response == 'y') {
					fractal.Stunts.splice(fractal.Stunts.indexOf(toBeDeleted), 1);
					return `${(toBeDeleted as Atom).Name ?? (toBeDeleted as FateFractal).FractalName} was deleted.`;
				}
				else
					throw Error('Aspect deletion cancelled');
			}
		}

		let expectedNumbers = 0;
		if (commandOptions.includes('c'))
			expectedNumbers++;
		if (commandOptions.includes('b'))
			expectedNumbers++;
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


		if (Numbers.length != expectedNumbers) {
			Numbers = [];
			if (commandOptions.includes('c') && !commandOptions.includes('r')) {
				const number = parseInt(await getGenericResponse(message, 'Provide a cost amount:'));
				if (!isNaN(number))
					throw Error('Expected a number.');
				Numbers.push(number);
			}
			if (commandOptions.includes('b') && !commandOptions.includes('r')) {
				const number = parseInt(await getGenericResponse(message, 'Provide a bonus amount:'));
				if (!isNaN(number))
					throw Error('Expected a number.');
				Numbers.push(number);
			}
		}


		// Put the string back together without prefixes.
		if (args.length == 0)
			args = await (await getGenericResponse(message, 'Please provide a Stunt name:')).split(' ');
		const StuntName = args.join(' ');

		// See if there are existing stunts that match
		const matched: Stunt[] = [];
		fractal.Stunts.forEach(a => {
			if (a instanceof Stunt && a.match(StuntName))
				matched.push(a);
		});

		// If there are no matches, create a new Stunt.
		if (matched.length == 0) {
			if (commandOptions.includes('r'))
				throw Error('No matches found.');


			const description = await getGenericResponse(message, 'Give the Stunt a description:');
			const stunt = new Stunt(StuntName, description);
			if (commandOptions.includes('c'))
				stunt.InvokeCost = Numbers.shift() ?? 0;
			if (commandOptions.includes('b'))
				stunt.BonusShifts = Numbers.shift() ?? 2;

			const extraInvokes: number = commandOptions.match(/f/ig)?.length ?? 0;
			if (extraInvokes > 0) {
				for (let i = 0; i < extraInvokes; i++) {
					stunt.AddFreeInvoke(player.id);
				}
			}

			const extraInvokeString = `${extraInvokes == 0 ? '' : ` ${extraInvokes} free use${extraInvokes > 1 ? 's' : ''}.`}`;
			fractal.Stunts.push(stunt);
			return `Added Stunt "${stunt.Name}"${stunt.Description ? `, "${stunt.Description}"` : ''}.${extraInvokeString}`;
		}
		else if (matched.length == 1) {
			const MatchedStunt = matched[0];

			const extraInvokes: number = commandOptions.match(/f/ig)?.length ?? 0;
			if (extraInvokes > 0) {
				for (let i = 0; i < extraInvokes; i++) {
					MatchedStunt.AddFreeInvoke(player.id);
				}
				message.channel.send(`Added ${extraInvokes} free use${extraInvokes > 1 ? 's' : ''} to ${MatchedStunt.Name}.`);
				if (commandOptions.length == extraInvokes)
					return;
			}

			if (commandOptions.includes('c') && !commandOptions.includes('r'))
				MatchedStunt.InvokeCost = Numbers.shift() ?? 0;
			if (commandOptions.includes('b') && !commandOptions.includes('r'))
				MatchedStunt.BonusShifts = Numbers.shift() ?? 2;

			if (commandOptions.includes('d')) {
				MatchedStunt.Description = await getGenericResponse(message, `Edit the description of ${MatchedStunt.Name}:`);
				return `The description of "${MatchedStunt.Name}" is now "${MatchedStunt.Description}".`;
			}
			else if (commandOptions.includes('i')) {
				throw Error('Stunt use via this command is not supported yet.'); // TODO
			}
			else if (commandOptions.includes('r')) {
				const response = await (await getGenericResponse(message, `Are you sure you wish to delete ${MatchedStunt.Name}?`)).toLowerCase();
				if (response == 'yes' || response == 'y') {
					fractal.Stunts.splice(fractal.Stunts.indexOf(MatchedStunt), 1);
					return `${MatchedStunt.Name} was deleted.`;
				}
				else
					return 'Cancelled Stunt deletion.';
			}
			else throw Error(`Found "${MatchedStunt.Name}"${MatchedStunt.Description ? `, "${MatchedStunt.Description}"` : ''}.\nUse options to interact.`)

		}
		else {
			let errstring = 'Too many Stunts matched. Matches:';
			matched.forEach(a => errstring += `\n   ${a.Name}`);
			throw Error(errstring);
		}

	}

}