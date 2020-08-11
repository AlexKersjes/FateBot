import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame, Player } from '../savegame';
import { FateFractal } from "../fatefractal";
import * as Discord from 'discord.js'
import { Aspect, Boost, Atom } from "../dataelements";
import { getGenericResponse, getPlayerFromMentionIfUndefined, confirmationDialogue, getIntResponse } from "../responsetools";
import { HelpText } from "./_CommandHelp";
import { ClientResources } from "../singletons";
import { CharacterOrOptionalSituationFractal, OptionalDeleteByIndex } from "../commandtools";
import { rejects } from "assert";

@ICommands.register
export class aspectCommand implements ICommand {
	name: string = 'aspect';
	description: string = 'Create or modify Aspects. Use options, prefixed by `-` for manipulation.';
	helptext: string | undefined = HelpText.aspect;
	admin: boolean = false;
	GM = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['a'];
	cooldown: number | undefined;
	typename: string = 'Aspect';
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		let skipFinally = false;
		let commandOptions: string = '';
		args = args.filter(a => {
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			return true;
		});

		let player: Player | undefined;
		let situationCommand = false;
		let invokeMention: Player | undefined;
		try {
			player = save.getPlayerAuto(message);
		}
		catch (err) {
			if (!commandOptions.includes('f'))
				throw err;
			player = save.getOrCreatePlayerById(message.author.id);
		}
		try {
			invokeMention = save.getOrCreatePlayerById(message.mentions.users.last()?.id);
		}
		catch{
			invokeMention = undefined;
		}

		if (invokeMention == player)
			invokeMention = undefined;
	
		args = args.filter(a => !a.startsWith('<@'));
		let fractal : FateFractal;
		({ fractal, commandOptions, situationCommand } = CharacterOrOptionalSituationFractal(this.typename, commandOptions, save, message, player));

		try{
			await OptionalDeleteByIndex(this.typename, fractal.Aspects, commandOptions, save, args, message, fractal).catch(reject => {throw reject})
		}
		catch (reject) {
			if(reject instanceof Error)
				throw reject
			return (reject as string);
		}

		// Put the string back together without prefixes.
		if (args.length == 0)
			args = await (await getGenericResponse(message, 'Please provide an Aspect name:')).split(' ');
		const AspectName = args.join(' ');

		// See if there are existing Aspects that match
		let matchCategory = 'a';
		const matched: Aspect[] = [];
		fractal.Aspects.forEach(a => {
			if (!(a instanceof FateFractal) && a.match(AspectName))
				matched.push(a);
		});
		if (fractal.Trouble?.match(AspectName)) {
			matched.unshift(fractal.Trouble);
			matchCategory = 't';
		}
		if (fractal.HighConcept?.match(AspectName)) {
			matched.unshift(fractal.HighConcept);
			matchCategory = 'c';
		}

		if (commandOptions.includes('fo')) {
			player = await getPlayerFromMentionIfUndefined(invokeMention, message, save);
		}


		// If there are no matches, create a new Aspect.
		try {
			if (matched.length == 0) {
				if (commandOptions.includes('r'))
					throw Error('No matches found.');

				if (commandOptions.includes('b')) {
					const boost: Boost = new Boost(AspectName);
					boost.AddFreeInvoke(player.id);
					fractal.Aspects.push(boost);
					return (`Added Boost ${AspectName}`);
				}


				// Prompt a description is the D flag is set;
				let description;
				if (commandOptions.includes('d')) {
					description = await getGenericResponse(message, 'Give the Aspect a description:');
				}
				const newAspect = new Aspect(AspectName, description);


				const extraInvokes: number = commandOptions.match(/f/ig)?.length ?? 0;
				if (extraInvokes > 0) {
					for (let i = 0; i < extraInvokes; i++) {
						newAspect.AddFreeInvoke(player.id);
					}
				}


				const extraInvokeString = `${extraInvokes == 0 ? '' : ` ${extraInvokes} free invoke${extraInvokes > 1 ? 's' : ''}.`}`;
				if (commandOptions.includes('c')) {
					fractal.HighConcept = newAspect;
					return `"${newAspect.Name}"${newAspect.Description ? `, "${newAspect.Description}"` : ''} was set as High Concept${situationCommand ? ' of the situation' : ''}.${extraInvokeString}`;
				}
				else if (commandOptions.includes('t')) {
					fractal.Trouble = newAspect;
					return `"${newAspect.Name}"${newAspect.Description ? `, "${newAspect.Description}"` : ''} was set as Trouble${situationCommand ? ' of the situation' : ''}.${extraInvokeString}`;
				}
				else {
					fractal.Aspects.push(newAspect);
					return `Added Aspect "${newAspect.Name}"${newAspect.Description ? `, "${newAspect.Description}"` : ''}${situationCommand ? ' to the situation' : ''}.${extraInvokeString}`;
				}
			}
			else if (matched.length == 1) {
				const MatchedAspect = matched[0];

				if (commandOptions.includes('co')) {
					MatchedAspect.InvokeCost = await getIntResponse(message, 'Provide cost to invoke Aspect:');
					return `Invoke cost set to ${MatchedAspect.InvokeCost}`;
				}
				if(commandOptions.includes('bo')) {
					MatchedAspect.BonusShifts = await getIntResponse(message, 'Provide invocation bonus:');
					return `Invoke bonus set to ${MatchedAspect.BonusShifts}`;
				}

				const extraInvokes: number = commandOptions.match(/f/ig)?.length ?? 0;
				if (extraInvokes > 0) {
					for (let i = 0; i < extraInvokes; i++) {
						MatchedAspect.AddFreeInvoke(player.id);
					}
					message.channel.send(`Added ${extraInvokes} free invoke${extraInvokes > 1 ? 's' : ''} to ${MatchedAspect.Name}.`);
					commandOptions.replace(/fo?/ig, '');
					if (commandOptions.length == 0)
						return;
				}

				if (commandOptions.includes('d')) {
					MatchedAspect.Description = await getGenericResponse(message, `Edit the description of ${MatchedAspect.Name}:`);
					return `The description of "${MatchedAspect.Name}" is now "${MatchedAspect.Description}".`;
				}
				else if (commandOptions.includes('i')) {
					throw Error('Aspect invocation via this command is not supported yet.'); // TODO
				}
				else if (commandOptions.includes('r')) {
					if(await confirmationDialogue(message, `Are you sure you wish to delete ${MatchedAspect.Name}?`)) {
						switch (matchCategory) {
							case 'a':
								fractal.Aspects.splice(fractal.Aspects.indexOf(MatchedAspect), 1);
								return `${MatchedAspect.Name} was deleted.`;
							case 'c':
								const temp = fractal.HighConcept?.Name;
								delete fractal.HighConcept;
								return `${temp} was deleted.`;
							case 't':
								const temp2 = fractal.Trouble?.Name;
								delete fractal.Trouble;
								return `${temp2} was deleted.`;
						}
					}
					else
						return 'Cancelled Aspect deletion.';
				}
				else if (commandOptions.includes('c')) {
					switch (matchCategory) {
						case 'a':
							fractal.HighConcept = MatchedAspect;
							fractal.Aspects.splice(fractal.Aspects.indexOf(MatchedAspect), 1);
							return `"${MatchedAspect.Name}" was set as High Concept.`;
						case 'c':
							return `"${MatchedAspect.Name}" is already your High Concept.`;
						case 't':
							fractal.HighConcept = MatchedAspect;
							fractal.Trouble = undefined;
							return `"${MatchedAspect.Name}" was set as High Concept.`;
					}
				}
				else if (commandOptions.includes('t')) {
					switch (matchCategory) {
						case 'a':
							fractal.Trouble = MatchedAspect;
							fractal.Aspects.splice(fractal.Aspects.indexOf(MatchedAspect), 1);
							return `"${MatchedAspect.Name}" was set as Trouble.`;
						case 't':
							return `"${MatchedAspect.Name}" is already your Trouble.`;
						case 'c':
							fractal.Trouble = MatchedAspect;
							fractal.HighConcept = undefined;
							return `"${MatchedAspect.Name}" was set as Trouble.`;
					}
				}
				else if (commandOptions.includes('a')) {
					switch (matchCategory) {
						case 'a':
							return `"${MatchedAspect.Name}" is already an Aspect.`;
						case 't':
							fractal.Trouble = undefined;
							break;
						case 'c':
							fractal.HighConcept = undefined;
							break;
					}
					fractal.Aspects.push(MatchedAspect);
					return `"${MatchedAspect.Name}" was downgraded to regular Aspect.`;

				}
				else throw Error(`Found "${MatchedAspect.Name}"${MatchedAspect.Description ? `, "${MatchedAspect.Description}"` : ''}.\nUse options to interact.`)

			}
			else {
				let errstring = 'Too many Aspects matched. Matches:';
				matched.forEach(a => errstring += `\n   ${a.Name}`);
				throw Error(errstring);
			}
		}
		catch(err)
		{
			skipFinally = true;
			throw err;
		}
		finally
		{
			if(!skipFinally){
				fractal.updateActiveSheets();
				save.dirty();
			}
		}
	}

}


