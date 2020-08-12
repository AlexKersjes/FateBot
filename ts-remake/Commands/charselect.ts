import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame, Player, Folder } from '../savegame';
import { getGenericResponse, confirmationDialogue } from "../responsetools";
import { FateFractal } from "../fatefractal";
import { HelpText } from "./_CommandHelp";
import { classToClass } from "class-transformer";

@ICommands.register
export class charselectCommand implements ICommand {
	requireSave: boolean = true;
	name: string = 'charselect';
	description: string = 'Store or Load a character, or manage other characters.';
	helptext: string | undefined = HelpText.charselect;
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = true;
	aliases: string[] | undefined = ['select', 'cs', 'chars', 'fractal'];
	cooldown: number | undefined;

	static gmdefault = 'NPCs';
	static playerdefault = 'PCs';



	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		let player = save.getPlayerAuto(message);
		const loadedCharacter = player.CurrentCharacter;

		let commandOptions: string = '';
		args = args.filter(a => {
			if (a.startsWith('-')) {
				commandOptions = a.substr(1).toLowerCase();
				return false;
			}
			if (a.startsWith('<@'))
				return false;
			return true;
		});

		switch (args[0].toLowerCase()) {
			case 'cd':
			case 'dir':
			case 'folder':
			case 'touch':
				if (!save.Options.GMCheck(message.author.id))
					throw Error('GM permission required.')
				args = args.slice(1);
				if (!args[0] || args[0] == '..' || args[0] == '../') {
					save.CurrentFolder = undefined;
					return 'Current folder reset.';
				}
				let folderToCd = save.Folders.find(f => f.FolderName == args[0]);
				if (!folderToCd) {
					if (await confirmationDialogue(message, `Could not find folder ${args[0]}. Do you wish to create a new a new folder named "${args[0]}"?`)) {
						let newFolder = new Folder(args[0])
						save.Folders.push(newFolder);
						save.CurrentFolder = newFolder.FolderName;
						return `Created folder ${args[0]}`;
					}
					else
						return;
				}
				if(commandOptions.includes('r')) {
					if(await confirmationDialogue(message, `Are you sure you wish to delete folder ${folderToCd.FolderName} and ALL ITS CONTENTS?`))
					{
						save.Folders.splice(save.Folders.indexOf(folderToCd), 1);
						return `Deleted folder ${folderToCd.FolderName}.`
					}
					return 'Cancelled folder deletion.'
				}
				save.CurrentFolder = folderToCd.FolderName;
				return `Selected folder ${folderToCd.FolderName}.`;
			case 'i':
			case 'ice':
			case 'icebox':
			case 'store':
			case 'stash':
				args = args.slice(1);
				if (commandOptions.length != 0) {
					let folder = save.Folders.find(f => f.FolderName == args[0]);
					if (folder) {
						args = args.slice(1);
					}
					else {
						let foldname = save.Options.GMCheck(player.id) ? save.CurrentFolder ?? charselectCommand.gmdefault : charselectCommand.playerdefault;
						folder = save.Folders.find(f => f.FolderName == foldname)
						if (!folder)
							throw Error(`Could not find folder ${foldname}.`);
					}
					return iceboxFractalFromSheet(commandOptions, player, args, folder);
				}
				return IceBoxProcedure(save, player, args[0]);
			case 'trash':
				if (player.id != message.author.id)
					throw Error('Trashing other people\'s characters for them is forbidden!')
				if (!loadedCharacter)
					throw Error('You have no character to trash.')
				player.CurrentCharacter = undefined;
				return `Trashed ${loadedCharacter?.FractalName}.`;
			case 'l':
			case 'load':
			case 'charload':
			case 'get':
				args = args.slice(1);
			default:
				let folder = save.Folders.find(f => f.FolderName == args[0]);
				if (folder) {
					if (!save.Options.GMCheck(player.id) && !save.Options.PlayerPermittedFolders.includes(folder.FolderName))
						throw Error('You do not have permission to load from that folder.');
					args = args.slice(1);
				}
				else {
					let foldname = save.Options.GMCheck(player.id) ? save.CurrentFolder ?? charselectCommand.gmdefault : charselectCommand.playerdefault;
					folder = save.Folders.find(f => f.FolderName == foldname)
					if (!folder)
						throw Error(`Could not find folder ${foldname}`);
				}


				const matchString = args.join(' ');
				let charToLoad = folder.findCharacter(matchString);
				if (charToLoad == undefined)
					throw Error(`Could not find match for "${matchString}" in ${folder.FolderName}.`)

				if (!(commandOptions.includes('a') || commandOptions.includes('c') || commandOptions.includes('s'))) {
					if (loadedCharacter != undefined) {
						const response = (await getGenericResponse(message, `Do you wish to icebox ${loadedCharacter.FractalName}?\n'Cancel' will cancel the procedure.\n'Yes' or 'y' will store in the default folder.\n'No' will have your current character overwritten and lost.\nOther responses will try to match an existing folder to store the character:`).catch(() => { throw Error('Aborted loading procedure.') })).toLowerCase();
						if (response == 'yes' || response == 'y')
							message.channel.send(IceBoxProcedure(save, player, undefined));
						else if (response != 'no')
							message.channel.send(IceBoxProcedure(save, player, response.split(' ')[0]));
					}
				}


				if (!commandOptions.includes('cp')) {
					folder.Contents.splice(folder.Contents.indexOf(charToLoad), 1);
				}
				else {
					commandOptions = commandOptions.replace('cp', '');
					charToLoad = classToClass(charToLoad);
					charToLoad.RepairConnections();
				}

				if (!save.Options.UseConditions) {
					charToLoad.convertConditionsToAspects(save.Options);
				}

				if (commandOptions.includes('a') || commandOptions.includes('s') || commandOptions.includes('c')) {
					if (loadedCharacter == undefined)
						throw Error('No character to attach fractal to.');
					charToLoad.Hidden = false;
					if (commandOptions.includes('a')) {
						loadedCharacter.Aspects.unshift(charToLoad);
						return `"${charToLoad.FractalName}" was attached as an Aspect to "${loadedCharacter.FractalName}".`
					}
					else if (commandOptions.includes('s')) {
						loadedCharacter.Stunts.unshift(charToLoad);
						return `"${charToLoad.FractalName}" was attached as an Stunt to "${loadedCharacter.FractalName}".`
					}
					else if (commandOptions.includes('c')) {
						if (!save.Options.UseConditions)
							throw Error('Conditions are disabled.')
						loadedCharacter.Conditions.unshift(charToLoad);
						return `"${charToLoad.FractalName}" was attached as an Condition to "${loadedCharacter.FractalName}".`
					}
				}
				player.CurrentCharacter = charToLoad;
				return (`${player} loaded ${player.CurrentCharacter.FractalName}.`);

			case 'swap':
			case 'switch':
				args = args.slice(1);
				return swapProcedure(player, args);
			case 'ls':
			case 'list':
				let str = '';
				const GM = save.Options.GMCheck(message.author.id);
				save.Folders.forEach(f => {
					if (GM || save.Options.PlayerPermittedFolders.includes(f.FolderName)) {
						str += `${f.FolderName}:\n`
						f.Contents.forEach(a => str += `   ${a.FractalName}\n`)
						if (str.length > 2000) {
							message.channel.send(str);
							str = '';
						}
					}
				});
				return str;
			case 'mv':
			case 'move':
				args = args.slice(1);
				let sourcefolder = save.Folders.find(f => f.FolderName == args[0]);
				if (sourcefolder) {
					if (!save.Options.GMCheck(player.id) && !save.Options.PlayerPermittedFolders.includes(sourcefolder.FolderName))
						throw Error('You do not have permission to move from that folder.');
					args = args.slice(1);
				}
				else {
					let foldname = save.Options.GMCheck(player.id) ? save.CurrentFolder ?? charselectCommand.gmdefault : charselectCommand.playerdefault;
					sourcefolder = save.Folders.find(f => f.FolderName == foldname)
					if (!sourcefolder)
						throw Error(`Could not find folder ${foldname}.`);
				}
				let tomatch : string | undefined;
				if (args.includes('|')) {
					args = args.slice(args.indexOf('|') + 1);
					tomatch = args.slice(0, args.indexOf('|')).join(' ');
				}
				else {
					tomatch = args.join(' ');
					args = [];
				}
				tomatch = tomatch ?? await getGenericResponse(message, 'Which entry do you wish to move?')
				const foundSource = sourcefolder.findCharacter(tomatch);
				if(!foundSource)
					throw Error(`No entry in folder ${sourcefolder.FolderName} matches "${tomatch}".`)

				if(args.length == 0){
					args = (await getGenericResponse(message, 'To which folder and/or under what name?')).split(' ');
				}


				let targetfolder = save.Folders.find(f => f.FolderName == args[0]);
				if (targetfolder) {
					if (!save.Options.GMCheck(player.id) && !save.Options.PlayerPermittedFolders.includes(targetfolder.FolderName))
						throw Error('You do not have permission to move from that folder.');
					args = args.slice(1);
				}
				else {
					let foldname = save.Options.GMCheck(player.id) ? save.CurrentFolder ?? charselectCommand.gmdefault : charselectCommand.playerdefault;
					targetfolder = save.Folders.find(f => f.FolderName == foldname)
					if (!targetfolder)
						throw Error(`Could not find folder ${foldname}.`);
				}

				save.dirty();
				let newname = args.join(' ');
				if(sourcefolder === targetfolder) {
					if(args.length == 0) {
						newname = await getGenericResponse(message, `${foundSource.FractalName} is already in folder ${sourcefolder.FolderName}. Enter a new name:\nTo not rename, use 'stop' or 'cancel'.`);
					}
					let oldname = foundSource.FractalName;
					foundSource.FractalName = newname;
					return `${oldname} was renamed to ${newname}.`;
				}

		
				if(args.length != 0) {
					let oldname = foundSource.FractalName;
					foundSource.FractalName = newname;
					message.channel.send( `${oldname} was renamed to ${newname}.`);
				}

				if(!commandOptions.includes('cp'))
					sourcefolder.remove(foundSource);
				targetfolder.add(foundSource);
				return `${commandOptions.includes('cp') ? 'Copied' : 'Moved'} ${foundSource.FractalName} from ${sourcefolder.FolderName} to ${targetfolder.FolderName}.`
		}

	}



}

function IceBoxProcedure(save: SaveGame, player: Player, folderstring: string | undefined): string {
	let character = player.CurrentCharacter;
	if (character == undefined)
		throw Error('Nothing to icebox.');
	let FolderName = save.Options.GMCheck(player.id) ? charselectCommand.gmdefault : charselectCommand.playerdefault;
	if (folderstring != undefined)
		FolderName = folderstring;
	let folder = save.Folders.find(f => f.FolderName.toLowerCase() === FolderName.toLowerCase());
	if (!folder)
		throw Error(`Could not find folder ${FolderName}`)
	folder.add(character);
	player.CurrentCharacter = undefined;
	return `Iceboxed ${character.FractalName} in ${folder.FolderName}`;
}

function swapProcedure(player: Player, args: string[]) {
	if (!player.CurrentCharacter)
		throw Error('Could not find character.');
	const fractal = player.CurrentCharacter.FindFractal(args.join(' '));
	if (!fractal)
		throw Error('No matching fractal found.');
	switch (fractal[1]) {
		case 'a':
			player.CurrentCharacter.Aspects.splice(player.CurrentCharacter.Aspects.indexOf(fractal[0]));
			fractal[0].Aspects.unshift(player.CurrentCharacter);
			player.CurrentCharacter = fractal[0];
			break;
		case 's':
			player.CurrentCharacter.Stunts.splice(player.CurrentCharacter.Stunts.indexOf(fractal[0]));
			fractal[0].Stunts.unshift(player.CurrentCharacter);
			player.CurrentCharacter = fractal[0];
			break;
		case 'c':
			player.CurrentCharacter.Conditions.splice(player.CurrentCharacter.Conditions.indexOf(fractal[0]));
			fractal[0].Conditions.unshift(player.CurrentCharacter);
			player.CurrentCharacter = fractal[0];
			break;
	}
	return `"${player.CurrentCharacter.FractalName}" is now ${player}'s current character.`;
}

function iceboxFractalFromSheet(commandOptions: string, player: Player, args: string[], folder: Folder) {
	if (!player.CurrentCharacter)
		throw Error('Nothing to Icebox.');
	const matchstring = args.join(' ') ?? '';
	let match;
	if (commandOptions.includes('a')) {
		match = player.CurrentCharacter.Aspects.find(f => {
			if (f instanceof FateFractal)
				return f.match(matchstring);
			return false;
		});
		if (!(match instanceof FateFractal))
			throw Error('Could not find matching Aspect/Fractal to icebox.');
		player.CurrentCharacter.Aspects.splice(player.CurrentCharacter.Aspects.indexOf(match), 1);
	}
	else if (commandOptions.includes('c')) {
		match = player.CurrentCharacter.Conditions.find(f => {
			if (f instanceof FateFractal)
				return f.match(matchstring);
			return false;
		});
		if (!(match instanceof FateFractal))
			throw Error('Could not find matching Condition/Fractal to icebox.');
		player.CurrentCharacter.Conditions.splice(player.CurrentCharacter.Conditions.indexOf(match), 1);
	}
	else if (commandOptions.includes('s')) {
		match = player.CurrentCharacter.Stunts.find(f => {
			if (f instanceof FateFractal)
				return f.match(matchstring);
			return false;
		});
		if (!(match instanceof FateFractal))
			throw Error('Could not find matching Stunt/Fractal to icebox.');
		player.CurrentCharacter.Stunts.splice(player.CurrentCharacter.Stunts.indexOf(match), 1);
	}
	if (!commandOptions.includes('r')) {
		folder.add(match);
		return (`Iceboxed ${match?.FractalName} in ${folder.FolderName}.`)
	}
	if (!match)
		throw Error('Must specify which category a fractal should be removed from.')
	return (`Removed fractal ${match.FractalName} from ${player.CurrentCharacter}'s sheet.`)
}
