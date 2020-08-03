import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';
import { FateFractal } from "../fatefractal";
import { getGenericResponse } from "../tools";
import { Atom } from "../dataelements";
import { SkillList } from "../skills";

@ICommands.register
export class renameCommand implements ICommand{
	name: string = 'rename';
	description: string = 'Rename anything. An aspect, a character.';
	helptext: string | undefined = 'Use `-s` to rename situations or situation elements. To skip new name dialogue prompt, include ` | ` in the initial command, and provide the new name after it.';
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = false;
	requireSave: boolean = true;
	aliases: string[] | undefined;
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		let player = save.getPlayerAuto(message);
		let character : FateFractal;
		if(args.includes('-s')){
			character = save.ChannelDictionary.FindDiscordChannel(message.channel).situation;
			args = args.filter(i => i != '-s' || !i.startsWith('<@'))
		}
		else
		{
			if(player.CurrentCharacter == undefined)
				throw Error(`${player} has no character to use rename on.`)
			character = player.CurrentCharacter;
			args = args.filter(i => !i.startsWith('<@'))
		}


		let newname : string = '';		
		if(args.includes('|')){
			newname = args.slice(args.indexOf('|') + 1).join(' ');
			args = args.slice(0, args.indexOf('|'));
		}

		save.dirty();

		if(args.length == 0){
			const oldname = character.FractalName;
			if (newname == '')
				newname = await getGenericResponse(message, `Enter a new name for ${player}'s character:`);
			character.FractalName = newname;
			return `"${oldname}" was renamed to "${character.FractalName}".`
		}

		let fields: any[] = [];
		if(character.HighConcept)
			fields.push(character.HighConcept);
		if(character.Trouble)
			fields.push(character.Trouble);
		fields.push(character.Aspects);
		fields.push(character.Conditions);
		fields.push(character.Stunts);
		fields.push(character.Tracks);
		fields.push(character.Skills.Lists)

		fields = fields.flat();

		const inputstring = args.join(' ');

		const match = this.getMatches(fields, inputstring);
		if(match == undefined)
			throw Error(`Could not find a match for "${inputstring}".`);
		fields = fields.splice(fields.indexOf(match));

		const oldname = match instanceof FateFractal ? match.FractalName : match.Name;
		if(newname == '')
			newname = await getGenericResponse(message, `Rename "${oldname}" to:`)
		
		const newmatch = this.getMatches(fields, newname);	
		if(newmatch != undefined)
			throw Error(`"${newname}" already matches ${newmatch.FractalName? newmatch.FractalName : newmatch.ListName? newmatch.ListName : newmatch.Name ?? 'another object'}.`);

		if(match instanceof FateFractal){
			match.FractalName = newname;
		}
		if(match instanceof SkillList){
			match.ListName = newname;
		}
		else{
			match.Name = newname;
		}

		return `"${oldname}" was renamed to "${newname}".`;
	}
	

	private getMatches<T extends Atom>(fields: (T|FateFractal|SkillList)[], inputstring: string) : T|FateFractal|SkillList| undefined{
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
}