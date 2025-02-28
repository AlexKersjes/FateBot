import { SaveGame, Player } from "./savegame";
import { FateFractal } from "./fatefractal";
import * as Discord from 'discord.js';
import { getGenericResponse, confirmationDialogue } from "./responsetools";
import { Atom } from "./dataelements";
import { SkillList } from "./skills";

export function CharacterOrOptionalSituationFractal(categoryString: string, commandOptions: string, save: SaveGame, message: Discord.Message, player: Player): { fractal: FateFractal, commandOptions: string, situationCommand: boolean } {
	let fractal: FateFractal;
	let situationCommand: boolean;
	// Get situation instead
	if (commandOptions.includes('s') || commandOptions.includes('g')) {
		situationCommand = true
		if (commandOptions.includes('s')) {
			if (!save.Options.GMCheck(message.author.id) && save.Options.RequireGMforSituationAccess)
				throw Error(`GM permission is needed to directly change situation ${categoryString}s. (Can be disabled in settings.)`);
			fractal = save.ChannelDictionary.FindDiscordChannel((message.channel as Discord.TextChannel)).situation;
		}
		else if (commandOptions.includes('g')) {
			if (!save.Options.GMCheck(message.author.id) && save.Options.RequireGMforSituationAccess)
				throw Error(`GM permission is needed to directly change situation ${categoryString}s. (Can be disabled in settings.)`);
			fractal = save.GlobalSituation;
		}
		else
			throw Error ('Impossible Error');
		commandOptions.replace('s', '');
		commandOptions.replace('g', '');
	}
	else {
		situationCommand = false;
		if (!player.CurrentCharacter)
			throw Error(`${player} has no character selected.`);
		fractal = player.CurrentCharacter;
	}
	return { fractal, commandOptions, situationCommand };
}


export async function OptionalDeleteByIndex<T extends Atom>(typename: string, array: Array<T | FateFractal>, numbers : number[], commandOptions: string, save: SaveGame, args: string[], message: Discord.Message, fractal: FateFractal): Promise<string[]> {
	return new Promise<string[]>(async (resolve, reject) => {
		if (commandOptions.includes('r')) {
			if (!args[0])
				args = await (await getGenericResponse(message, `Which ${typename} do you wish to delete? Specify a number or name:`)).split(' ');

			if (numbers[0] && args.length == 0) {
				const toBeDeleted = array[numbers[0] - 1];
				if(!toBeDeleted)
					throw Error('Bad index.');
				const prompt = `Are you sure you wish to delete "${(toBeDeleted as Atom).Name ?? (toBeDeleted as FateFractal).FractalName}"?${
					toBeDeleted instanceof FateFractal ? `\n"${toBeDeleted.FractalName}" is a fractal.` : ''}`;
				if (await confirmationDialogue(message, prompt)) {
					array.splice(array.indexOf(toBeDeleted), 1);
					fractal.updateActiveSheets(save.Options);
					save.dirty();
					return reject(`${(toBeDeleted as Atom).Name ?? (toBeDeleted as FateFractal).FractalName} was deleted.`);
				} else
					return reject (new Error(`${typename} deletion cancelled.`));
			}
		}
		return resolve(args)
	});
}



export function getMatchFromArray<T extends Atom>(fields: (T|FateFractal|SkillList)[], inputstring: string) : T|FateFractal|SkillList|undefined{
	const matched : (FateFractal | SkillList | T)[] = [];
	fields.forEach(e => {
		if (e.match(inputstring))
			matched.push(e);
	});

	if (matched.length == 0)
		return undefined;
	if (matched.length > 1) {
		let errstring = `Too many renameable objects matches for "${inputstring}". Matches:`;
		matched.forEach(a => {
			if(a instanceof FateFractal)
				errstring += `\n   ${a.FractalName}`
			else if(a instanceof SkillList)
				errstring += `\n   ${a.ListName}`;
			else
				errstring += `\n   ${a.Name}`;
		});
		throw Error(errstring);
	}
	return matched[0];
}