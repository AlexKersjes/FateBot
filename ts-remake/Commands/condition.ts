import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame, Player } from '../savegame';
import { FateFractal } from "../fatefractal";
import * as Discord from 'discord.js'
import { Condition, ConditionSeverity, BoxCondition, Atom } from "../dataelements";
import { getGenericResponse, getIntResponse, getPlayerFromMentionIfUndefined, confirmationDialogue } from "../tools";
import { HelpText } from "./_CommandHelp";
import { ClientResources } from "../singletons";

@ICommands.register
export class conditionCommand implements ICommand {
	name: string = 'condition';
	description: string = 'Create or modify Conditions. Use options, prefixed by `-` for manipulation.';
	helptext: string | undefined = HelpText.condition;
	admin: boolean = false;
	GM = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['c', 'con'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		let skipFinally = false;
		if (!save.Options.UseConditions)
			throw Error('Conditions are disabled. To use conditions, enable them.');
		args = args.filter(a => !a.startsWith('<@'));
		let commandOptions: string = '';
		args = args.filter(a => {
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			return true;
		});

		let player : Player | undefined;
		let invokeMention: Player | undefined
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


		let situationCommand = false;
		let fractal: FateFractal;

		// Get situation instead
		if (commandOptions.includes('s') && !commandOptions.includes('se')) {
			if (!save.Options.GMCheck(message.author.id) && save.Options.RequireGMforSituationAccess)
				throw Error('GM permission is needed to directly change situation Conditions. (Can be disabled in settings.)');
			fractal = save.ChannelDictionary.FindDiscordChannel((message.channel as Discord.TextChannel)).situation;
			commandOptions.replace('s', '');
			situationCommand = true;
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
				const prompt = `Are you sure you wish to delete "${(toBeDeleted as Atom).Name ?? (toBeDeleted as FateFractal).FractalName}"?${
					toBeDeleted instanceof FateFractal ? `\n"${toBeDeleted.FractalName}" is a fractal.` : ''}`;
				if (await confirmationDialogue(message, prompt)) {
					fractal.Conditions.splice(fractal.Conditions.indexOf(toBeDeleted), 1);
					fractal.updateActiveSheets();
					return `${(toBeDeleted as Atom).Name ?? (toBeDeleted as FateFractal).FractalName} was deleted.`;
				}
				else
					throw Error('Condition deletion cancelled');
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

		// Put the string back together without prefixes.
		if (args.length == 0)
			args = await (await getGenericResponse(message, 'Please provide a Condition name:')).split(' ');
		const ConditionName = args.join(' ');

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
		}


		// See if there are existing conditions that match
		const matched: (Condition | BoxCondition)[] = [];
		fractal.Conditions.forEach(a => {
			if (!(a instanceof FateFractal) && a.match(ConditionName))
				matched.push(a);
		});

		let Severity: ConditionSeverity = ConditionSeverity.Fleeting;
		if (commandOptions.includes('m') || commandOptions.includes('se')) {
			const response = await getGenericResponse(message, 'Provide the Condition Severity (None, Fleeting, Sticky, Lasting):');
			let regStr = '.*';
			for (let i = 0; i < response.length; i++) {
				regStr += `${response[i]}.*`;
			}
			const expression = new RegExp(regStr, 'gi');
			if ('Lasting'.match(expression))
				Severity = ConditionSeverity.Lasting;
			else if ('Sticky'.match(expression))
				Severity = ConditionSeverity.Sticky;
			else if ('Fleeting'.match(expression))
				Severity = ConditionSeverity.Fleeting;
			else if ('None'.match(expression))
				Severity = ConditionSeverity.None;
			else
				throw Error('Could not match Condition Severity.');
		}

		let boxes: number = 0;
		if (commandOptions.includes('b')) {
			boxes = await getIntResponse(message, 'Provide number of boxes:');
		}

		if (commandOptions.includes('fo')) {
			player = await getPlayerFromMentionIfUndefined(invokeMention, message, save);
		}

		// If there are no matches, create a new Condition.
		try {
			if (matched.length == 0) {
				if (commandOptions.includes('r'))
					throw Error('No matches found.');

				// Prompt a description is the D flag is set;
				let description;
				if (commandOptions.includes('d') && !commandOptions.includes('b'))
					description = await getGenericResponse(message, 'Give the Condition a description:');
				let newCondition: Condition | BoxCondition = new Condition(ConditionName, Severity, description);
				if (commandOptions.includes('b'))
					newCondition = new BoxCondition(ConditionName, Severity, boxes, description);


				const extraInvokes: number = commandOptions.match(/f/ig)?.length ?? 0;
				if (extraInvokes > 0) {
					for (let i = 0; i < extraInvokes; i++) {
						newCondition.AddFreeInvoke(player.id);
					}
				}


				const extraInvokeString = `${extraInvokes == 0 ? '' : ` ${extraInvokes} free invoke${extraInvokes > 1 ? 's' : ''}.`}`;
				let boxesString = '';
				if (newCondition instanceof BoxCondition)
					boxesString = newCondition.BoxesString();
				fractal.Conditions.push(newCondition);
				return `Added Condition ${boxesString}"${newCondition.Name}" <${ConditionSeverity[newCondition.Severity]}>${newCondition.Description ? `, "${newCondition.Description}"${situationCommand ? ' to the situation' : ''}` : ''}.${extraInvokeString}`;
			}
			else if (matched.length == 1) {
				let MatchedCondition: Condition | BoxCondition = matched[0];

				let extraInvokes: number = commandOptions.match(/f/ig)?.length ?? 0;
				if (extraInvokes > 0) {
					for (let i = 0; i < extraInvokes; i++) {
						MatchedCondition.AddFreeInvoke(player.id);
					}
					message.channel.send(`Added ${extraInvokes} free invoke${extraInvokes > 1 ? 's' : ''} to ${MatchedCondition.Name}.`);
					commandOptions.replace(/fo?/ig, '');
					if (commandOptions.length == 0)
						return;
				}

				if (commandOptions.includes('m') || commandOptions.includes('se')) {
					MatchedCondition.Severity = Severity;
					message.channel.send(`The Severity of "${MatchedCondition.Name}" was set to ${ConditionSeverity[MatchedCondition.Severity]}.`);
					commandOptions.replace('m', '');
					commandOptions.replace('se', '');
					if (commandOptions.length == 0)
						return;
				}

				if (commandOptions.includes('b')) {
					if (!(MatchedCondition instanceof BoxCondition)) {
						const newBoxC = new BoxCondition(MatchedCondition.Name, MatchedCondition.Severity, boxes, MatchedCondition.Description);
						fractal.Conditions[fractal.Conditions.indexOf(MatchedCondition)] = newBoxC;
						MatchedCondition = newBoxC;
					}
					else {
						MatchedCondition.SetMaxBoxes(boxes);
					}
					commandOptions.replace('b', '');
					if (commandOptions.length == 0)
						return;
				}

				if (commandOptions.includes('d')) {
					MatchedCondition.Description = await getGenericResponse(message, `Edit the description of ${MatchedCondition.Name}:`);
					return `The description of "${MatchedCondition.Name}" is now "${MatchedCondition.Description}".`;
				}
				else if (commandOptions.includes('i')) {
					throw Error('Condition Aspect invocation via this command is not supported yet.'); // TODO
				}
				else if (commandOptions.includes('r')) {
					if (await confirmationDialogue(message, `Are you sure you wish to delete ${MatchedCondition.Name}?`)) {
						fractal.Conditions.splice(fractal.Conditions.indexOf(MatchedCondition), 1);
						save.dirty();
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