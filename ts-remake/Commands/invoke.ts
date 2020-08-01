import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { Stunt, InvokableObject } from '../dataelements'
import { Player, SaveGame } from "../savegame";
import { FateFractal } from "../fatefractal";

@ICommands.register
export class invokeCommand implements ICommand {
	GM: boolean = false;
	requireSave: boolean = true;
	name: string = 'invoke';
	description: string = 'Invoke an aspect or use a stunt.';
	helptext: string | undefined = 'Use this command to add a bonus to an ongoing roll.';
	admin: boolean = false;
	args: boolean = true;
	aliases: string[] | undefined = ['i'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: import("../savegame").SaveGame): Promise<string> {
		let argsfiltered = args.filter(s => s.startsWith('-') == false);
		let User = message.mentions.users.last();
		if (User?.bot)
			User = undefined;
		if (User == undefined)
			User = message.author;
		const TargetPlayer = save.getOrCreatePlayerById(User.id);
		const TargetCharacter = TargetPlayer.CurrentCharacter;
		const OperatingPlayer = save.getOrCreatePlayerById(message.author.id);
		const OperatingCharacter = OperatingPlayer.CurrentCharacter;
		argsfiltered = argsfiltered.filter(a => !a.startsWith('<@'));
		const matchstring = argsfiltered.join(' ');
		let invokable = TargetCharacter?.FindInvokable(matchstring);
		if (invokable == undefined) {
			// find an invokable situation aspect
			invokable = save.ChannelDictionary.FindDiscordChannel(message.channel).situation.FindInvokable(matchstring);
			if (invokable == undefined)
				throw Error('No matching invokable found.');
		}
		return Invoke(invokable, OperatingPlayer, OperatingCharacter, save);
	}

}

export function Invoke(invokable: InvokableObject, OperatingPlayer: Player, OperatingCharacter: FateFractal | undefined, save: SaveGame) {
	let returnmessage = '';
	save.dirty();
	if (!invokable.TryFreeInvoke(OperatingPlayer.id)) {
		if (OperatingCharacter && !save.Options.GMCheck(OperatingPlayer.id))
			if (OperatingCharacter.FatePoints < invokable.InvokeCost) {
				if (!save.Options.GMCheck(OperatingPlayer.id))
					throw Error(`${OperatingPlayer} could not spend ${invokable.InvokeCost} Fate point${invokable.InvokeCost > 1 ? 's' : ''}.`);
			}
			else {
				if (invokable.InvokeCost != 0) {
					if (invokable.InvokeCost > 1)
						returnmessage += `Spending ${invokable.InvokeCost} Fate points, \n`;
					else
						throw Error(`"${invokable.Name}" may not be invoked without free invokes.`);
					OperatingCharacter.FatePoints -= invokable.InvokeCost;
				}
			}
	}
	else {
		if (invokable.InvokeCost != 0)
			returnmessage += `Spending a free Invoke, `;
	}
	returnmessage += `${OperatingPlayer} ${invokable instanceof Stunt ? 'used' : 'invoked'} **${invokable.Name}**`;
	if (invokable.BonusShifts != 0) {
		returnmessage += `, for a **[ +${invokable.BonusShifts} ]** bonus`;
		// TODO actually hook up the bonus to the roll system.
	}
	else {
		returnmessage += `.\n"${invokable.Description}"`;
	}
	returnmessage += '.';
	return returnmessage;
}
