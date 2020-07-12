import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame, Player } from '../savegame';
import { getGenericResponse } from "../tools";

@ICommands.register
export class charselectCommand implements ICommand{
	requireSave: boolean = true;
	name: string = 'charselect';
	description: string = 'Load a character';
	helptext: string | undefined;
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = true;
	aliases: string[] | undefined = ['select', 'cs'];
	cooldown: number | undefined;

	gmdefault = 'NPCs';
	playerdefault = 'PCs'

	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		let player = save.getPlayerAuto(message);
		const loadedCharacter = player.CurrentCharacter;
		let folder = undefined;

		args = args.filter(a => !a.startsWith('<@'));
		switch (args[0].toLowerCase()) {
			case 'i' :
			case 'ice' :
			case 'icebox' :
				return this.IceBoxProcedure(save, player, args[1]);

			case 'l' :
			case 'load' :
			case 'charload' :
				folder = save.Folders.find(f => f.FolderName == args[1]);
				if(folder){
					if (!save.Options.GMCheck(message.author.id) && !save.Options.PlayerPermittedFolders.includes(folder.FolderName))
						throw Error ('You do not have permission to load from that folder.');
					args = args.slice(2);
				}
				else {
					args = args.slice(1);
					let foldname = save.Options.GMCheck(message.author.id) ? this.gmdefault : this.playerdefault;
					folder = save.Folders.find(f =>  f.FolderName == foldname )
					if(!folder)
						throw Error(`Could not find folder ${foldname}`);
				}

				const matchString = args.join(' ');
				const charToLoad = folder.findCharacter(matchString);
				if(charToLoad == undefined)
					throw Error(`Could not find match for "${matchString}" in ${folder.FolderName}.`)

				if(loadedCharacter != undefined){
					const response = (await getGenericResponse(message, `Do you wish to icebox ${loadedCharacter.FractalName}?\n'Cancel' will cancel the procedure.\n'Yes' or 'y' will store in the default folder.\n'No' will have your current character overwritten and lost.\nOther responses will try to match an existing folder to store the character:`)).toLowerCase();
					if(response == 'cancel')
						throw Error('Aborted loading procedure.');
					else if(response == 'yes' || response == 'y')
						message.channel.send(this.IceBoxProcedure(save, player, undefined));
					else if(response != 'no')
						message.channel.send(this.IceBoxProcedure(save, player, response.split(' ')[0]));
				}

				player.CurrentCharacter = charToLoad;
				return(`${player} loaded ${player.CurrentCharacter.FractalName}.`)

		}

	}

	IceBoxProcedure(save: SaveGame, player : Player, folderstring : string | undefined) : string {
		let character = player.CurrentCharacter;
		if(character == undefined)
			throw Error ('Nothing to icebox.');
		let FolderName = save.Options.GMCheck(player.id) ? this.gmdefault : this.playerdefault;
		if(folderstring != undefined)
			FolderName = folderstring;
		let folder = save.Folders.find(f => f.FolderName.toLowerCase() === FolderName.toLowerCase());
		if (!folder)
			throw Error(`Could not find folder ${FolderName}`)
		folder.add(character);
		player.CurrentCharacter = undefined;
		return `Iceboxed ${character.FractalName} in ${folder.FolderName}`;
	}
	
}