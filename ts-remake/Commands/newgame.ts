import { ICommands, ICommand } from "../command";
import { Games } from '../app';
import * as Discord from 'discord.js';
import * as fs from 'fs';
import { SaveGame } from "../savegame";
import { DefaultServers } from '../app';

@ICommands.register
export class newgame implements ICommand {
	name: string = 'newgame';
	description: string = 'Start a new game.';
	helptext: string | undefined = 'Game names cannot be shorter than 5 characters. Game names cannot contain spaces.';
	admin: boolean = true;
	args: boolean = true;
	aliases: string[] | undefined = ['start', 'startgame'];
	cooldown: number | undefined = 30;
	async execute(message: import("discord.js").Message, args: string[], client: import("discord.js").Client, save?: import("../savegame").SaveGame | undefined): Promise<void> {
		const guildId = message.guild?.id;
		// Guilds must be checked.
		if (guildId == undefined)
			throw Error('Can only start games in discord servers.');
		const currentlyLoaded = save;
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
		if (currentlyLoaded) {
			let collector: Discord.MessageCollector;
			const filter = (m: Discord.Message) => m.author.id == message.author.id;
			await message.channel.send(`"${currentlyLoaded.GameName}" is currently loaded. **Are you sure you wish to start a new game?**\n${currentlyLoaded.Password ? '' : `Game "${currentlyLoaded.GameName}" is not password protected.`}`)
			// collector for confirmation
			collector = new Discord.MessageCollector(message.channel, filter, { max: 1, time: 20000 });
			collector.on('collect', m => {
				if ((m as Discord.Message).content.toLowerCase() != 'y' && (m as Discord.Message).content.toLowerCase() != 'yes')
					m.channel.send('Cancelled starting a new game.');
				else
					startGame(args[0], guildId, message);
			})
			// timeout message
			collector.on('end', (s, r) => { if (r == 'time') (collector.channel as Discord.TextChannel).send('Confirmation timed out.') });
		}
		else
			startGame(args[0], guildId, message);
	}

}

function startGame(gameName: string, guildId: string, message: Discord.Message) {
	const newGame = new SaveGame(gameName, message);
	Games.set(guildId, newGame);
	newGame.save();
	DefaultServers.add(guildId, newGame.GameName);
	DefaultServers.save();
	message.channel.send(`Created new game "${newGame.GameName}".`)
}