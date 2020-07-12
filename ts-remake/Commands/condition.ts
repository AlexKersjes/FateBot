import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame, Player } from '../savegame';
import { FateFractal } from "../fatefractal";
import * as Discord from 'discord.js'
import { Condition, ConditionSeverity, BoxCondition } from "../dataelements";
import { getGenericResponse } from "../tools";

@ICommands.register
export class conditionCommand implements ICommand {
	name: string = 'condition';
	description: string = 'Create or modify Conditions. Use options, prefixed by `-` for manipulation.';
	helptext: string | undefined = 'Options:\n`s`              Adjust the current **S**ituation.\n`d`              Add or edit a Condition **D**escription.\n`r`              **R**emove a Condition.\n`b`              Add **B**oxes to the Condition.\n`m`              Set the condition severity (**M**agnitude). Default is <Fleeting>. `se` for **SE**verity also works, but beware conflict with `s`.\n`f`              for adding a **F**ree invoke. `f` can be included multiple times. Include `fo` to grant the invoke to an **O**ther. E.g. `ffo` wil give two free invokes to `o`. \n`i`              to **I**nvoke.';
	admin: boolean = false;
	GM = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['c', 'con'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		let player = save.getPlayerAuto(message);
		let invokeMention : Player | undefined = save.getOrCreatePlayerById(message.mentions.users.last()?.id);
		if (invokeMention == player)
			invokeMention = undefined;
		args = args.filter(a => !a.startsWith('<@'));
		let commandOptions : string = '';
		args = args.filter(a => {
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			return true;
		});

		

		let fractal: FateFractal ;

		// Get situation instead
		if (commandOptions.includes('s') && !commandOptions.includes('se')) {
			if (!save.Options.GMCheck(message.author.id)&& save.Options.RequireGMforSituationAccess)
				throw Error('GM permission is needed to directly change situation Conditions. (Can be disabled in settings.)');
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
				args = await (await getGenericResponse(message, 'Which Condition do you wish to delete? Specify a number or name:')).split(' ');
	
			number = parseInt(args[0]);
			if (!isNaN(number) && args.length == 1) {
				const toBeDeleted = fractal.Conditions[number - 1];
				if (!(toBeDeleted instanceof FateFractal)) {
					const response = await (await getGenericResponse(message, `Are you sure you wish to delete ${toBeDeleted.Name}?`)).toLowerCase();
					if (response == 'yes' || response == 'y') {
						fractal.Conditions.splice(fractal.Conditions.indexOf(toBeDeleted), 1);
						return `${toBeDeleted.Name} was deleted.`;
					}
					else
						throw Error('Condition deletion cancelled.');
				}
				else
					throw Error('Fractal deletion is not implemented yet.'); // TODO
			}
		}

		// Put the string back together without prefixes.
		if(args.length == 0)
			args = await (await getGenericResponse(message, 'Please provide an Condition name:')).split(' ');
		const ConditionName = args.join(' ');

		// See if there are existing conditions that match
		const matched : (Condition | BoxCondition)[] = [];
		fractal.Conditions.forEach(a => {
			if (!(a instanceof FateFractal) && a.match(ConditionName))
				matched.push(a);
		});

		let Severity : ConditionSeverity = ConditionSeverity.Fleeting;
		if (commandOptions.includes('m') || commandOptions.includes('se'))
		{
			const response = await getGenericResponse(message, 'Provide the Condition Severity:');
			let regStr = '.*';
			for (let i = 0; i < response.length; i++) {
				regStr +=  `${response[i]}.*`;
			}
			const expression = new RegExp(regStr, 'gi');
			if('Lasting'.match(expression))
				Severity =  ConditionSeverity.Lasting;
			else if('Sticky'.match(expression))
				Severity =  ConditionSeverity.Sticky;
			else if('Fleeting'.match(expression))
				Severity =  ConditionSeverity.Fleeting;
			else if('None'.match(expression))
				Severity =  ConditionSeverity.None;
			else
				throw Error ('Could not match Condition Severity.');
		}

		let boxes :number = 0;
		if(commandOptions.includes('b')){
			boxes = parseInt(await getGenericResponse(message, 'Provide number of boxes:'));
			if(isNaN(boxes))
				throw Error('Could not match a number of boxes.')
		}

		if (commandOptions.includes('fo')) {
			player = await new Promise<Player>((resolve, reject) => {
				if(invokeMention)
					resolve(invokeMention);
				const filter = (m: Discord.Message) => m.author.id == message.author.id;
				message.channel.send('Mention the player you wish to grant the free invoke:');
				// collector for confirmation
				let collector = new Discord.MessageCollector(message.channel, filter, { max: 1, time: 20000 });
				collector.on('collect', m => {
					let p = save.getPlayerAuto(m);
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

		// If there are no matches, create a new Condition.
		if (matched.length == 0) {
			if(commandOptions.includes('r'))
				throw Error('No matches found.');

			// Prompt a description is the D flag is set;
			let description;
			if (commandOptions.includes('d') && !commandOptions.includes('b'))
				description = await getGenericResponse(message, 'Give the Condition a description:');
			let newCondition : Condition | BoxCondition = new Condition(ConditionName, Severity, description);
			if(commandOptions.includes('b'))
				newCondition = new BoxCondition(ConditionName, Severity, boxes, description);
			

			const extraInvokes : number = commandOptions.match(/f/ig)?.length ?? 0;
			if(extraInvokes > 0){
				for (let i = 0; i < extraInvokes; i++) {
					newCondition.AddFreeInvoke(player.id);
				}
			}


			const extraInvokeString = `${extraInvokes == 0 ? '' : ` ${extraInvokes} free invoke${extraInvokes > 1 ? 's' : ''}.`}`;
			let boxesString = '';
			if(newCondition instanceof BoxCondition)
				boxesString = newCondition.BoxesString();
			fractal.Conditions.push(newCondition);
			return `Added Condition ${boxesString}"${newCondition.Name}" <${ConditionSeverity[newCondition.Severity]}>${newCondition.Description ? `, "${newCondition.Description}"` : ''}.${extraInvokeString}`;
		}
		else if (matched.length == 1) {
			let MatchedCondition : Condition | BoxCondition = matched[0];
			
			let extraInvokes : number = commandOptions.match(/f/ig)?.length ?? 0;
			if(extraInvokes > 0){
				for (let i = 0; i < extraInvokes; i++) {
					MatchedCondition.AddFreeInvoke(player.id);
				}
				message.channel.send(`Added ${extraInvokes} free invoke${extraInvokes > 1 ? 's' : ''} to ${MatchedCondition.Name}.`);
				if(commandOptions.length == extraInvokes)
					return;
			}

			if(commandOptions.includes('m') || commandOptions.includes('se')){
				MatchedCondition.Severity = Severity;
				message.channel.send(`The Severity of "${MatchedCondition.Name}" was set to ${ConditionSeverity[MatchedCondition.Severity]}.`);
				if(commandOptions.includes('se'))
					++extraInvokes;
				if(commandOptions.length == ++extraInvokes)
					return;
			}

			if(commandOptions.includes('b')){
				if(!(MatchedCondition instanceof BoxCondition)){	
					const newBoxC = new BoxCondition(MatchedCondition.Name, MatchedCondition.Severity, boxes, MatchedCondition.Description);
					fractal.Conditions[fractal.Conditions.indexOf(MatchedCondition)] = newBoxC;
					MatchedCondition = newBoxC;
				}
				else
				{
					MatchedCondition.SetMaxBoxes(boxes);
				}
				if(commandOptions.length == ++extraInvokes)
					return;
			}
			
			if (commandOptions.includes('d')) {
				MatchedCondition.Description = await getGenericResponse(message, `Edit the description of ${MatchedCondition.Name}:`);
				return `The description of "${MatchedCondition.Name}" is now "${MatchedCondition.Description}".`;
			}
			else if (commandOptions.includes('i')){
				throw Error('Condition Aspect invocation via this command is not supported yet.'); // TODO
			}
			else if (commandOptions.includes('r')) {
				const response = await (await getGenericResponse(message, `Are you sure you wish to delete ${MatchedCondition.Name}?`)).toLowerCase();
				if (response == 'yes' || response == 'y') {
					fractal.Conditions.splice(fractal.Conditions.indexOf(MatchedCondition), 1);
					return `${MatchedCondition.Name} was deleted.`;
				}
				else
					return 'Cancelled Condition deletion.';
			}
			else throw Error(`Found "${MatchedCondition.Name}"${MatchedCondition.Description ? `, "${MatchedCondition.Description}"` : ''}.\nUse options to interact.`)
			
		}
		else {
			let errstring = 'Too many Conditions matched. Matches:';
			matched.forEach(a => errstring += `\n   ${a.Name}`);
			throw Error(errstring);
		}

	}

}