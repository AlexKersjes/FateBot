import { ICommands, ICommand } from "../command";
import * as Discord from 'discord.js';
import * as fs from 'fs';
import { SaveGame } from "../savegame";
import { Games } from '../app';

@ICommands.register
export class loadgame implements ICommand {
	name: string = 'loadgame';
	description: string = 'Load an existing game by name.';
	helptext: string | undefined;
	admin: boolean = true;
	args: boolean = true;
	aliases: string[] | undefined = ['gameload', 'gload'];
	cooldown: number | undefined = 20;
	async execute(message: Discord.Message, args: string[], client: Discord.Client, save?: import("../savegame").SaveGame | undefined): Promise<any> {
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
		
		// Password procedure for to be loaded game
		const buffer = await SaveGame.load(args[0]);
		if (await !buffer.passConfirm(message))
			return message.channel.send('Load failed. Incorrect password.');
		currentlyLoaded?.save();

		// Prevent unintentionally leaving a game open
		if (currentlyLoaded?.Password == "") {
			let collector: Discord.MessageCollector;
			const filter = (m: Discord.Message) => m.author.id == message.author.id;
			await message.channel.send(`"${currentlyLoaded.GameName}" is currently loaded and has no password. **Are you sure you wish to load another game?**\nGames which are not protected may be loaded by anyone.`)
			collector = new Discord.MessageCollector(message.channel, filter, { max: 1, time: 20000 });
			collector.on('collect', m => {
				console.log(m);
				if ((m as Discord.Message).content.toLowerCase() != 'y' && (m as Discord.Message).content.toLowerCase() != 'yes')
					m.channel.send('Loading cancelled.');
				else {
					Games.set(guildId, buffer);
					message.channel.send(`Game "${buffer.GameName}" was loaded.`);
				}
			})
			collector.on('end', (s, r) => { if (r == 'time') (collector.channel as Discord.TextChannel).send('Confirmation timed out.') });

		}
		// Normal loading procedure.
		else {
			Games.set(guildId, buffer);
			message.channel.send(`Game "${buffer.GameName}" was loaded.`);
		}


	}
}