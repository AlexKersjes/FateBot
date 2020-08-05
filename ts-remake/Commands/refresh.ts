import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame, Player } from '../savegame';
import { FateFractal } from "../fatefractal";

@ICommands.register
export class refreshCommand implements ICommand{
	name: string = 'refresh';
	description: string = 'Refresh attributes for a specifc player or all players.';
	helptext: string | undefined;
	admin: boolean = false;
	GM: boolean = true;
	args: boolean = false;
	requireSave: boolean = true;
	aliases: string[] | undefined;
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		save.dirty()
		const player = save.getPlayerAuto(message);
		let commandOptions = '';
		args = args.filter(a => {
			if( a.startsWith('<@') ){
				return false;
			}
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			return true;
		});
		throw new Error("Method not implemented.");
	}
	
}

function RefreshScene (character: FateFractal) {
	RefreshFleeting(character);
	RefreshStress(character);
}

function RefreshFleeting (character: FateFractal) {

}

function RefreshStress (character: FateFractal) {

}

function RefreshFate (character: FateFractal) {

}

function RefreshStuntUses (character: FateFractal) {

}