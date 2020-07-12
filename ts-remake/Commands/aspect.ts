import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame, Player } from '../savegame';
import { FateFractal } from "../fatefractal";
import * as Discord from 'discord.js'
import { Aspect, Boost } from "../dataelements";
import { getGenericResponse } from "../tools";

@ICommands.register
export class aspectCommand implements ICommand {
	name: string = 'aspect';
	description: string = 'Create or modify Aspects. Use options, prefixed by `-` for manipulation.';
	helptext: string | undefined = 'Options:\n`s`              Adjust the current **S**ituation.\n`d`              Add or edit an Aspect **D**escription.\n`c or t`   to edit High **C**oncept or **T**rouble. `a` can be used to downgrade to a regular Aspect.\n`r`              **R**emove an Aspect.\n`b`              Create a **B**oost.\n`f`              for adding a **F**ree invoke. `f` can be included multiple times. Include `fo` to grant the invoke to an **O**ther.\n`i`              to **I**nvoke.';
	admin: boolean = false;
	GM = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['a'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		let player = save.getPlayer(message);
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
				throw Error('GM permission is needed to directly change situation Aspects. (Can be disabled in settings.)');
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
				args = await (await getGenericResponse(message, 'Which Aspect do you wish to delete? Specify a number or name.')).split(' ');

			number = parseInt(args[0]);
			if (!isNaN(number) && args.length == 1) {
				const toBeDeleted = fractal.Aspects[number - 1];
				if (!(toBeDeleted instanceof FateFractal)) {
					const response = await (await getGenericResponse(message, `Are you sure you wish to delete ${toBeDeleted.Name}?`)).toLowerCase();
					if (response == 'yes' || response == 'y') {
						fractal.Aspects.splice(fractal.Aspects.indexOf(toBeDeleted), 1);
						return `${toBeDeleted.Name} was deleted.`;
					}
					else
						throw Error('Aspect deletion cancelled');
				}
				else
					throw Error('Fractal deletion is not implemented yet.'); // TODO
			}
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
			player = await new Promise<Player>((resolve, reject) => {
				const filter = (m: Discord.Message) => m.author.id == message.author.id;
				message.channel.send('Mention the player you wish to grant the free invoke:');
				// collector for confirmation
				let collector = new Discord.MessageCollector(message.channel, filter, { max: 1, time: 20000 });
				collector.on('collect', m => {
					let p = save.Players.find(p => p.id == ((m as Discord.Message).mentions.members?.first()?.id) );
					if (p == undefined)
						reject('Could not find player mention, or that player has no sheet.');
					resolve(p);
				});
				// timeout message
				collector.on('end', (s, r) => {
					if (r == 'time')
						reject(Error('Timed out.'));
				});
			}).catch(err => { throw err });

		}


		// If there are no matches, create a new Aspect.
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
			if (commandOptions.includes('d') && !commandOptions.includes('b'))
				description = await getGenericResponse(message, 'Give the Aspect a description.');
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
				return `"${newAspect.Name}"${newAspect.Description ? `, "${newAspect.Description}"` : ''} was set as High Concept.${extraInvokeString}`;
			}
			else if (commandOptions.includes('t')) {
				fractal.Trouble = newAspect;
				return `"${newAspect.Name}"${newAspect.Description ? `, "${newAspect.Description}"` : ''} was set as Trouble.${extraInvokeString}`;
			}
			else {
				fractal.Aspects.push(newAspect);
				return `Added Aspect "${newAspect.Name}"${newAspect.Description ? `, "${newAspect.Description}"` : ''}.${extraInvokeString}`;
			}
		}
		else if (matched.length == 1) {
			const MatchedAspect = matched[0];

			const extraInvokes: number = commandOptions.match(/f/ig)?.length ?? 0;
			if (extraInvokes > 0) {
				for (let i = 0; i < extraInvokes; i++) {
					MatchedAspect.AddFreeInvoke(player.id);
				}
				message.channel.send(`Added ${extraInvokes} free invoke${extraInvokes > 1 ? 's' : ''} to ${MatchedAspect.Name}.`);
				if (commandOptions.length == extraInvokes)
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
				const response = await (await getGenericResponse(message, `Are you sure you wish to delete ${MatchedAspect.Name}?`)).toLowerCase();
				if (response == 'yes' || response == 'y') {
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
						return `${MatchedAspect.Name} was set as High Concept.`;
					case 'c':
						return `${MatchedAspect.Name} is already your High Concept.`;
					case 't':
						fractal.HighConcept = MatchedAspect;
						fractal.Trouble = undefined;
						return `${MatchedAspect.Name} was set as High Concept.`;
				}
			}
			else if (commandOptions.includes('t')) {
				switch (matchCategory) {
					case 'a':
						fractal.Trouble = MatchedAspect;
						fractal.Aspects.splice(fractal.Aspects.indexOf(MatchedAspect), 1);
						return `${MatchedAspect.Name} was set as Trouble.`;
					case 't':
						return `${MatchedAspect.Name} is already your Trouble.`;
					case 'c':
						fractal.Trouble = MatchedAspect;
						fractal.HighConcept = undefined;
						return `${MatchedAspect.Name} was set as Trouble.`;
				}
			}
			else if (commandOptions.includes('a')) {
				switch (matchCategory) {
					case 'a':
						return `${MatchedAspect.Name} is already an Aspect.`;
					case 't':
						fractal.Trouble = undefined;
						break;
					case 'c':
						fractal.HighConcept = undefined;
						break;
				}
				fractal.Aspects.push(MatchedAspect);
				return `${MatchedAspect.Name} was downgraded to regular Aspect.`;

			}
			else throw Error(`Found "${MatchedAspect.Name}"${MatchedAspect.Description ? `, "${MatchedAspect.Description}"` : ''}.\nUse options to interact.`)

		}
		else {
			let errstring = 'Too many Aspects matched. Matches:';
			matched.forEach(a => errstring += `\n   ${a.Name}`);
			throw Error(errstring);
		}

	}

}