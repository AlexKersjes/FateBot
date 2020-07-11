import { ICommands, ICommand } from "../command";
import * as Discord from 'discord.js';
import * as fs from 'fs';
import { SaveGame } from "../savegame";
import { Games } from '../app';

@ICommands.register
export class loadgameCommand implements ICommand {
	requireSave: boolean = false;
	name: string = 'loadgame';
	description: string = 'Load an existing game by name.';
	helptext: string | undefined;
	admin: boolean = true;
	GM : boolean = false;
	args: boolean = true;
	aliases: string[] | undefined = ['gameload', 'gload'];
	cooldown: number | undefined = 20;
	async execute(message: Discord.Message, args: string[], client: Discord.Client, save?: import("../savegame").SaveGame | undefined): Promise<void | string> {
		const guildId = message.guild?.id;
		// Guilds must be checked.
		if (guildId == undefined)
			throw Error('Can only start games in discord servers.');
		const currentlyLoaded = save;

		if (args[0].length < 4)
			throw Error('Game names are 4 characters or longer.')
		// Check for existing games
		if (process.env.SAVEPATH) {
			if (!fs.readdirSync(process.env.SAVEPATH, "utf-8").includes(`${args[0]}game.json`))
				throw Error('That game does not exist, thus cannot be loaded.');
		}

		// Check if game is already running elsewhere
		if(Games.some((g, k) => g.GameName == args[0]) && args[0] != save?.GameName)
			throw Error('That game is already running on a different server.')
		

		const buffer = await SaveGame.load(args[0]);

		// Prevent unintentionally leaving a game open
		await noPasswordGuard(currentlyLoaded, message, guildId, buffer).catch(err => {throw Error(err)});
		// Password procedure for to be loaded game
		await buffer.passConfirm(message).then(res => {if(!res) throw Error('Invalid Password.')}).catch(err => {throw err});
		currentlyLoaded?.save();


		
		// Normal loading procedure.
		buffer.Options.CustomPrefix = save?.Options.CustomPrefix || undefined;
		Games.set(guildId, buffer);
		message.channel.send(`Game "${buffer.GameName}" was loaded.`);


	}
}

function noPasswordGuard(currentlyLoaded: SaveGame | undefined, message: Discord.Message, guildId: string, buffer: SaveGame) {
	return new Promise<string>((resolve, reject) => {
		if (currentlyLoaded?.Password != "")
			resolve();
		else {
			let collector: Discord.MessageCollector;
			const filter = (m: Discord.Message) => m.author.id == message.author.id;
			message.channel.send(`"${currentlyLoaded.GameName}" is currently loaded and has no password. **Are you sure you wish to load another game?**\nGames which are not protected may be loaded by anyone.`);
			collector = new Discord.MessageCollector(message.channel, filter, { max: 1, time: 20000 });
			collector.on('collect', m => {
				if ((m as Discord.Message).content.toLowerCase() != 'y' && (m as Discord.Message).content.toLowerCase() != 'yes')
					reject('Loading cancelled.');
				else {
					resolve();
					}
			});
			collector.on('end', (s, r) => {
				if (r == 'time')
					reject('Confirmation timed out.');
			});

		}
	});
}
