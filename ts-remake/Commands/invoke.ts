import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";

@ICommands.register
export class invokeCommand implements ICommand {
	requireSave: boolean = true;
	name: string = 'invoke';
	description: string = 'Invoke an aspect or use a stunt.';
	helptext: string | undefined = 'Use this command to add a bonus to an ongoing roll.';
	admin: boolean = false;
	args: boolean = true;
	aliases: string[] | undefined = ['i'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save?: import("../savegame").SaveGame | undefined): Promise<void> {
		const argsfiltered = args.filter(s => s.startsWith('-') == false);
		const Player = save?.Players.find(i => i.id == message.author.id);
		let invokable = Player?.CurrentCharacter?.FindInvokable(argsfiltered.join(' '));
		if(invokable == undefined)
		{
			// find an invokable situation aspect

			throw Error('No matching invokable found.');
		}
		let returnmessage = '';
		if(!invokable.TryFreeInvoke(message.author.id))
		{
			// TODO take fate points
		}
		// TODO send a return message;
	}

}