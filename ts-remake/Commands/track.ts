import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame, Player } from '../savegame';
import { FateFractal } from "../fatefractal";
import { CharacterOrOptionalSituationFractal, OptionalDeleteByIndex } from "../commandtools";
import { getGenericResponse, getIntResponse, confirmationDialogue } from "../responsetools";
import { Track, ConditionSeverity, Condition } from "../dataelements";

@ICommands.register
export class trackCommand implements ICommand {
	name: string = 'track';
	description: string = 'Create or modify tracks. Use options, prefixed by `-` for manipulation.';
	helptext: string | undefined;
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['t'];
	cooldown: number | undefined;
	typename: string = 'Track';
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		let skipFinally = false;
		let commandOptions: string = '';
		let player: Player = save.getPlayerAuto(message);
		args = args.filter(a => {
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			if (a.startsWith('<@')) {
				return false;
			}
			return true;
		});
		let situationCommand = false;

		let fractal: FateFractal;
		({ fractal, commandOptions, situationCommand } = CharacterOrOptionalSituationFractal(this.typename, commandOptions, save, message, player));

		try {
			await OptionalDeleteByIndex(this.typename, fractal.Aspects, commandOptions, save, args, message, fractal).catch(reject => { throw reject })
		}
		catch (reject) {
			if (reject instanceof Error)
				throw reject
			return (reject as string);
		}

		const Numbers: number[] = [];
		const argsCopy: string[] = [];
		args.forEach(a => {
			const parsed = parseInt(a);
			if (!isNaN(parsed))
				Numbers.push(parsed);
			else
				argsCopy.push(a);
		});
		args = argsCopy;

		// Put the string back together without prefixes.
		if (args.length == 0)
			args = await (await getGenericResponse(message, 'Please provide a Track name:')).split(' ');
		const Trackname = args.join(' ');


		let Severity: ConditionSeverity | undefined = undefined;
		if (commandOptions.includes('v')) {
			const response = await getGenericResponse(message, 'Enter the severity of the Condition created when a box is crossed on this track:\n(Fleeting, Sticky, Lasting, or None. If Conditions are off, any value other than None will prompt Aspect creation.)');
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



		const matched: Track[] = [];
		fractal.Tracks.forEach(a => {
			if (a.match(Trackname))
				matched.push(a);
		});

		// If there are no matches, create a new Track.
		try {
			if (matched.length == 0) {
				if (commandOptions.includes('r'))
					throw Error('No matches found.');

				let inputnumbers;
				if (commandOptions.includes('b'))
					inputnumbers = Numbers.unshift() ?? getIntResponse(message, 'How many boxes should this track have?');
				else
					inputnumbers = Numbers.length != 0 ? Numbers : 1;

				const track = new Track(Trackname, inputnumbers, Severity ?? ConditionSeverity.None);

				if (commandOptions.includes('d'))
					track.Description = await getGenericResponse(message, `Provide a description for ${track.Name}:`);

				fractal.Tracks.push(track);
				return `Added ${this.typename} "${track.Name}"${track.Description ? `, "*${track.Description}*"` : ''}${situationCommand ? ' to the situation' : ''}.`;
			}
			else if (matched.length == 1) {
				const MatchedTrack = matched[0];

				if (commandOptions.includes('a')) {
					if (Numbers.length != 0) {
						MatchedTrack.SetMaxBoxes(Numbers.length);
						Numbers.forEach((n, i)=> MatchedTrack.SetBoxValue(i + 1, n));
						return `${MatchedTrack.Name}: ${MatchedTrack.BoxesString()}.`;
					}
					else {
						const response = await getGenericResponse(message, `Provide the numbers the boxes should be valued at:\nAlternatively, use 'clear' to clear all boxes of values, 'smooth' to give all boxes the same value as the first box, or 'staircase' to give the boxes values scaling up by one every time.`);
						if(response.toLowerCase() == 'clear') {
							MatchedTrack.BoxValues.forEach((b, i) => MatchedTrack.SetBoxValue(i + 1, 0));
							return `${MatchedTrack.Name}: ${MatchedTrack.BoxesString()}.`;
						}
						else if(response.toLowerCase() == 'staircase') {
							MatchedTrack.StaircaseValues();
							return `${MatchedTrack.Name}: ${MatchedTrack.BoxesString()}.`;	
						}
						else if ( response.toLowerCase() == 'smooth') {
							MatchedTrack.BoxValues.forEach((b, i) => MatchedTrack.SetBoxValue(i + 1, MatchedTrack.BoxValues[0]));
							return `${MatchedTrack.Name}: ${MatchedTrack.BoxesString()}.`;
						}
						else {
							let array = response.split(' ');
							array = array.filter(n => !isNaN(parseInt(n)));
							MatchedTrack.SetMaxBoxes(array.length);
							array.forEach((n, i) => MatchedTrack.SetBoxValue(i + 1, parseInt(n)));
							return `${MatchedTrack.Name}: ${MatchedTrack.BoxesString()}.`;	
						}
					}
				}
				if (commandOptions.includes('b')) {
					MatchedTrack.SetMaxBoxes(Numbers.shift() ?? await getIntResponse(message, `How many boxes should Track ${MatchedTrack.Name} have?`));
					return `${MatchedTrack.Name}: ${MatchedTrack.BoxesString()}.`;
				}


				if (commandOptions.includes('m')) {
					commandOptions.replace('m', '');
					let marking = false;
					let value: [number, boolean];
					try {
						value = MatchedTrack.Mark(Numbers.shift() ?? MatchedTrack.BoxValues.length == 1 ? 1 : await getIntResponse(message, save.Options.DresdenStress ? 'How many boxes should be marked?' : 'Which box should be marked?'), save.Options);
						message.channel.send(`${value[0]} shifts were marked.`); //TODO hook up to rollcontest
					}
					catch (err) {
						value = [err[1], err[2]]
						message.channel.send(`${value[0]} shifts were marked. ${(err[0] as Error).message}`); // TODO hook up to rollcontest
					}
					marking = value[1];
					
					if (marking && MatchedTrack.CreatesCondition != ConditionSeverity.None && save.Options.AutoHandleConditions) {
						if (save.Options.UseConditions) {
							const ConditionName = await getGenericResponse(message, `Name a new <${ConditionSeverity[MatchedTrack.CreatesCondition]}> Condition:`)
							let CondDesc;
							if (commandOptions.includes('d'))
								CondDesc = await getGenericResponse(message, `Provide a description for **${ConditionName}** <${ConditionSeverity[MatchedTrack.CreatesCondition]}>`);
							const newCond = new Condition(ConditionName, MatchedTrack.CreatesCondition, CondDesc);
							fractal.Conditions.push(newCond);
							return `${fractal.FractalName}'s ${MatchedTrack.Name} was marked and created **${newCond.Name}** <${ConditionSeverity[newCond.Severity]}>${newCond.Description ? ', ' + newCond.Description : ''}.`
						}
					}



				}

				if (commandOptions.includes('d')) {
					MatchedTrack.Description = await getGenericResponse(message, `Edit the description of ${MatchedTrack.Name}:`);
					return `The description of "${MatchedTrack.Name}" is now "${MatchedTrack.Description}".`;
				}
				if (commandOptions.includes('v')) {
					return changeSeverity(Severity, MatchedTrack, save);
				}
				if (commandOptions.includes('r')) {
					if (await confirmationDialogue(message, `Are you sure you wish to delete ${MatchedTrack.Name}?`)) {
						fractal.Tracks.splice(fractal.Tracks.indexOf(MatchedTrack), 1);
						return `${MatchedTrack.Name} was deleted.`;
					}
					else
						return 'Cancelled Track deletion.';
				}
				else throw Error(`Found "${MatchedTrack.Name}", ${MatchedTrack.BoxesString()}${MatchedTrack.Description ? `, "${MatchedTrack.Description}"` : ''}.\nUse options to interact.`)

			}
			else {
				let errstring = 'Too many Tracks matched. Matches:';
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

function changeSeverity(Severity: ConditionSeverity | undefined, MatchedTrack: Track, save: SaveGame) {
	if (Severity == undefined)
		throw Error('Impossible Error');
	MatchedTrack.CreatesCondition = Severity;
	return `Marking a box on ${MatchedTrack.Name} will now ${MatchedTrack.CreatesCondition == ConditionSeverity.None ? 'no longer ' : ''}prompt the creation of a ${!save.Options.UseConditions ? '' : MatchedTrack.CreatesCondition != ConditionSeverity.None ? `<${ConditionSeverity[MatchedTrack.CreatesCondition]}> ` : ''} consequence.`;
}
