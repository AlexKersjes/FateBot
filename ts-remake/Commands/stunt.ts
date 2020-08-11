import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';
import { FateFractal } from "../fatefractal";
import * as Discord from 'discord.js'
import { Stunt, Atom } from "../dataelements";
import { getGenericResponse, getIntResponse, confirmationDialogue } from "../responsetools";
import { HelpText } from "./_CommandHelp";
import { CharacterOrOptionalSituationFractal, OptionalDeleteByIndex } from "../commandtools";

@ICommands.register
export class stuntCommand implements ICommand {
	name: string = 'stunt';
	description: string = 'Create or modify Stunts. Use options, prefixed by `-` for manipulation.';
	helptext: string | undefined = HelpText.stunt;
	admin: boolean = false;
	GM = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['s', 'x'];
	cooldown: number | undefined;
	typename: string = 'Stunt';
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		let skipFinally = false;
		const player = save.getPlayerAuto(message);
		let commandOptions: string = '';
		args = args.filter(a => {
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			if(a.startsWith('<@'))
				return false;
			return true;
		});

		let situationCommand = false;
		let fractal: FateFractal;
		({ fractal, commandOptions, situationCommand } = CharacterOrOptionalSituationFractal(this.typename, commandOptions, save, message, player));

		try{
			await OptionalDeleteByIndex(this.typename, fractal.Stunts, commandOptions, save, args, message, fractal).catch(reject => {throw reject})
		}
		catch (reject) {
			if(reject instanceof Error)
				throw reject
			return (reject as string);
		}

		let expectedNumbers = 0;
		if (commandOptions.includes('c'))
			expectedNumbers++;
		if (commandOptions.includes('b'))
			expectedNumbers++;
		if (commandOptions.includes('u'))
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

		// Put the string back together without prefixes.
		if (args.length == 0)
			args = await (await getGenericResponse(message, 'Please provide a Stunt name:')).split(' ');
		const StuntName = args.join(' ');



		if (Numbers.length != expectedNumbers) {
			Numbers = [];
			if (commandOptions.includes('c') && !commandOptions.includes('r')) {
				const number = await getIntResponse(message, 'Provide a cost amount:');
				Numbers.push(number);
			}
			if (commandOptions.includes('b') && !commandOptions.includes('r')) {
				const number = await getIntResponse(message, 'Provide a bonus amount:');
				Numbers.push(number);
			}
			if (commandOptions.includes('u') && !commandOptions.includes('r')) {
				const number = await getIntResponse(message, 'Provide the number of free uses after refresh:');
				Numbers.push(number);
			}
		}

		// See if there are existing stunts that match
		const matched: Stunt[] = [];
		fractal.Stunts.forEach(a => {
			if (a instanceof Stunt && a.match(StuntName))
				matched.push(a);
		});

		// If there are no matches, create a new Stunt.
		try {
			if (matched.length == 0) {
				if (commandOptions.includes('r'))
					throw Error('No matches found.');


				const description = await getGenericResponse(message, 'Give the Stunt a description:');
				const stunt = new Stunt(StuntName, description);
				if (commandOptions.includes('c'))
					stunt.InvokeCost = Numbers.shift() ?? 0;
				if (commandOptions.includes('b'))
					stunt.BonusShifts = Numbers.shift() ?? 2;
				if (commandOptions.includes('u')) {
					const num = Numbers.shift() ?? 0;
					stunt.Refresh = num < 0 ? 0 : num;
				}

				const extraInvokes: number = commandOptions.match(/f/ig)?.length ?? 0;
				if (extraInvokes > 0) {
					for (let i = 0; i < extraInvokes; i++) {
						stunt.AddFreeInvoke(player.id);
					}
				}

				const extraInvokeString = `${extraInvokes == 0 ? '' : ` ${extraInvokes} free use${extraInvokes > 1 ? 's' : ''}.`}`;
				fractal.Stunts.push(stunt);
				return `Added Stunt "${stunt.Name}"${stunt.Description ? `, "*${stunt.Description}*"` : ''}${situationCommand ? ' to the situation' : ''}.${extraInvokeString}`;
			}
			else if (matched.length == 1) {
				const MatchedStunt = matched[0];

				const extraInvokes: number = commandOptions.match(/f/ig)?.length ?? 0;
				if (extraInvokes > 0) {
					for (let i = 0; i < extraInvokes; i++) {
						MatchedStunt.AddFreeInvoke(player.id);
					}
					commandOptions.replace('f', '');
					message.channel.send(`Added ${extraInvokes} free use${extraInvokes > 1 ? 's' : ''} to ${MatchedStunt.Name}.`);
					if (commandOptions.length == 0)
						return;
				}

				if (commandOptions.includes('c') && !commandOptions.includes('r')){
					MatchedStunt.InvokeCost = Numbers.shift() ?? 0;
					commandOptions.replace('c', '')
					if (commandOptions.length == 0)
						return 'Stunt updated';
				}
				if (commandOptions.includes('b') && !commandOptions.includes('r')){
					MatchedStunt.BonusShifts = Numbers.shift() ?? 2;
					commandOptions.replace('b', '');
					if (commandOptions.length == 0)
						return 'Stunt updated';
				}
				if (commandOptions.includes('u') && !commandOptions.includes('r')) {
					const num = Numbers.shift() ?? 0;
					MatchedStunt.Refresh = num < 0 ? 0 : num;
					commandOptions.replace('u', '');
					if (commandOptions.length == 0)
						return 'Stunt updated.';
				}

				if (commandOptions.includes('d')) {
					MatchedStunt.Description = await getGenericResponse(message, `Edit the description of ${MatchedStunt.Name}:`);
					return `The description of "${MatchedStunt.Name}" is now "${MatchedStunt.Description}".`;
				}
				else if (commandOptions.includes('i')) {
					throw Error('Stunt use via this command is not supported yet.'); // TODO
				}
				else if (commandOptions.includes('r')) {
					if (await confirmationDialogue(message, `Are you sure you wish to delete ${MatchedStunt.Name}?`)) {
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