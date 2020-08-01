import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { RollContest } from "../rollcontest";
import { SkillList } from "../skills";

@ICommands.register
export class rollCommand implements ICommand {
	requireSave: boolean = true;
	name: string = 'roll';
	description: string = 'Roll the dice';
	helptext: string | undefined;
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = false;
	aliases: string[] | undefined = ['r'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: import("../savegame").SaveGame): Promise<string | void> {
		let commandOptions: string = '';
		args = args.filter(a => {
			if (a.startsWith('-') && a.length > 1) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			return true;
		});

		const Player = save.getPlayerAuto(message);
		args = args.filter(a => !a.startsWith('<@'));

		let roll = RollContest.fourDFudge();

		let approachmodifier = 0;
		let modifier = 0;
		let advantagestr = '';

		if (commandOptions.includes('adv') || commandOptions.includes('dis')) {
			let bonusindex = -1;
			bonusindex = commandOptions.indexOf('adv');
			if(bonusindex == -1)
				bonusindex = commandOptions.indexOf('dis');

			let extradice = parseInt(commandOptions.slice(bonusindex + 3));
			if(isNaN(extradice) || extradice < - 4 || extradice > 20)
				extradice = 1

			if (commandOptions.includes('adv')) {
				roll = RollContest.NDFudgeToFour(4 + extradice, true);
				advantagestr = 'advantage';
			}
			else if (commandOptions.includes('dis')) {
				roll = RollContest.NDFudgeToFour(4 + extradice, false);
				advantagestr = 'disadvantage';
			}
		}
		
		const Skill = Player.CurrentCharacter?.FindSkill(args.join(' '))

		let approachstr = ''
		if (Skill) {
			approachstr = ` using **${Skill.Name}**,`;
			roll[0] += Skill.Value;
		}
		roll[0] += modifier;

		let modifierstr = '';
		approachmodifier = Skill?.Value ?? 0;
		if (approachmodifier != 0 || modifier != 0) {
			modifierstr = ` with a modifier of `;
			if (approachmodifier != 0)
				modifierstr += `${modifier == 0 ? approachmodifier : approachmodifier + ' + '}`;
			if (modifier != 0)
				modifierstr += modifier;
			if (advantagestr != '')
				modifierstr += ` and ${advantagestr}`;
			modifierstr += ','
		}
		if (modifierstr = '' && advantagestr != '')
			modifierstr = `with ${advantagestr},`

		return `${roll[1]}:${approachstr}${modifierstr}\n${Player} rolled **[ ${roll[0]} ]** .`;
	}

}