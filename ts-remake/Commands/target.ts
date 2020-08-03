import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from '../savegame';
import { getIntResponse } from "../tools";

@ICommands.register
export class targetCommand implements ICommand{
	name: string = 'target';
	description: string = 'Set a target difficulty for a roll.';
	helptext: string | undefined = 'Include an integer to set as the target. Include skill names to restrict which skills can be used for the roll.\nIf multiple integers are provided, then provide that many skill names to set different targets per skill. Use the modifier `-r` to resolve the current roll. ';
	admin: boolean = false;
	GM: boolean = true;
	args: boolean = true;
	requireSave: boolean = true;
	aliases: string[] | undefined = ['tg', 'difficulty', 'dc', 'diff'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		const numbers: number[] = [];
		const contest = save.getContestAuto(message);
		let commandOptions: string = '';
		args = args.filter(a => {
			if( !isNaN(parseInt(a)) ){
				numbers.push(parseInt(a));
				return false;
			}
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			return true;
		});
		
		if(numbers.length > 1 && numbers.length != args.length){
			if(numbers.length < args.length)
				throw Error('Expected more skill identifiers.');
		}


		let filled = false;
		if(numbers.length == 0)
			numbers.push(await getIntResponse(message, 'Provide a target value:'));
		if(numbers.length == 1){
			while(numbers.length < args.length) {
				numbers.push(0);
			}
			filled = true;
			numbers.fill(numbers[0])
		}

		const regex : RegExp[] = [];
		args.forEach(a => {
			let regStr = '.*';
			for (let i = 0; i < a.length; i++) {
				regStr +=  `${a[i]}.*`;
		}
		regex.push( new RegExp(regStr, 'gi'));
		})

		const targets : [string, number][] = [];
		regex.forEach(r => {
			const string = save.Options.DefaultSkills.find(n => n.match(r));
			const target : [string, number] = ['', 0];
			if(string != undefined) {
				args.shift();
				target[0] = string;
			}
			else
				target[0] = args.shift() ?? '';
			target [1] = numbers.shift() ?? 0;

			targets.push(target);
		})

		contest.Targets = targets;

		contest.DefaultTarget = numbers.shift();

		let defaultstring = '';
		if(contest.DefaultTarget != undefined)
			defaultstring = `\nDefault difficulty: **[ ${contest.DefaultTarget} ]**`;
		let returnstr = 'Roll  '
		if(filled) {
			if(targets.length == 0){
				returnstr = returnstr.slice(0, -1)
				returnstr += 'any skill.'
			}
			else {
				for (let i = 0; i < targets.length; i++) {
					const element = targets[i];
					if(i == targets.length -1 && i != 0)
						returnstr += 'or '
					returnstr += `***${element[0]}***,  `
				}
				returnstr = returnstr.slice(0, -3) + `.\nDifficulty: **[ ${targets[0][1]} ]**.`;
			}
		}
		else {
			for (let i = 0; i < targets.length; i++) {
				const element = targets[i];
				if(i == targets.length -1 && i != 0)
					returnstr += 'or '
				returnstr += `***${element[0]}***, DC: **[ ${element[1]} ]** ;  `
			}
			returnstr = returnstr.slice(0, -3) + `.`;
		}

		return returnstr + defaultstring;

	}
	
}