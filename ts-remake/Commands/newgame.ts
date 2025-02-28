import { ICommands, ICommand } from "../command";
import * as Discord from 'discord.js';
import * as fs from 'fs';
import { SaveGame } from "../savegame";
import { FateVersion } from "../options";
import { getGenericResponse, confirmationDialogue } from "../responsetools";
import { ClientResources, Games } from "../singletons";

@ICommands.register
export class newgameCommand implements ICommand {
	requireSave: boolean = false;
	name: string = 'newgame';
	description: string = 'Start a new game.';
	helptext: string | undefined = 'Game names cannot be shorter than 5 characters. Game names cannot contain spaces.';
	admin: boolean = true;
	GM : boolean = false;
	args: boolean = false;
	aliases: string[] | undefined = ['start', 'startgame'];
	cooldown: number | undefined = 30;
	
	async execute(message: import("discord.js").Message, args: string[], client: import("discord.js").Client, save?: import("../savegame").SaveGame | undefined): Promise<void> {
				
		const guildId = message.guild?.id;
		// Guilds must be checked.
		if (guildId == undefined)
			throw Error('Can only start games in discord servers.');
		const currentlyLoaded = save;

		// filter out gamemode arguments
		let GameMode : string | undefined = undefined;
		args = args.filter(s => {
			if(s.startsWith('-')){
				GameMode = s.slice(1);
				return false;
			}
			return true;
		})

		// if there's no game name, get a game name.
		if(args.length == 0){
			args = await (await getGenericResponse(message, 'Please provide a game name:')).split(' ');
  		}
		// Check for valid syntax
		if (args[1])
			throw Error('Game names cannot contain spaces.');
		if (args[0].length < 4)
			throw Error('Game names are required to be 4 characters or longer.')
		// Check for existing games
		if (process.env.SAVEPATH) {
			if (fs.readdirSync(process.env.SAVEPATH, "utf-8").includes(`${args[0]}game.json`))
				throw Error('That game name is already taken, please try something else.');
		}
		// If there is a save loaded, confirm the user wants to unload the current save. 
		// then, if there is no argument for the Fate version given, ask for a version string.
		if(currentlyLoaded){
			if(await confirmationDialogue(message, `"${currentlyLoaded.GameName}" is currently loaded. **Are you sure you wish to start a new game?**\n${currentlyLoaded.Password ? '' : `Game "${currentlyLoaded.GameName}" is not password protected:`}`))
				currentlyLoaded.save();	
			else {
				throw Error('Cancelled starting a new game.');
			}
		}
		if(GameMode == undefined)
			GameMode = await getGenericResponse(message, 'Please select a version of Fate as a base ruleset. You can further customize once the game is created.\ne.g. Core, Accelerated, Condensed:');
		startGame(args[0], guildId, message, GameMode)
	}
}


function startGame(gameName: string, guildId: string, message: Discord.Message, mode : string) {
	if(mode.startsWith(process.env.PREFIX || '.'))
		throw Error('Responses do not need to be prefixed.');

	let version : FateVersion | undefined = undefined;
	let regStr = '.*';
	for (let i = 0; i < mode.length; i++) {
		regStr +=  `${mode[i]}.*`;
	}
	const expression = new RegExp(regStr, 'gi');

	
	if('Core'.match(expression)){
		version = FateVersion.Core;
		message.channel.send(`Selected ${FateVersion[FateVersion.Core]}`);
	}
	else if('Accelerated'.match(expression)){
		version = FateVersion.Accelerated;
		message.channel.send(`Selected ${FateVersion[FateVersion.Accelerated]}`);
	}
	else if ('Condensed'.match(expression)){
		version = FateVersion.Condensed;
		message.channel.send(`Selected ${FateVersion[FateVersion.Condensed]}`);
	}

	if (version == undefined)
		throw Error('Could not match version.');

	const newGame = new SaveGame(gameName, guildId, version);
	newGame.dirty();
	newGame.Options.GMToggle(message.author.id);
	Games.set(guildId, newGame);
	newGame.save();
	Games.Defaults.add(guildId, newGame.GameName);
	Games.Defaults.save();
	message.channel.send(`Created new game "${newGame.GameName}".`)
}