import "reflect-metadata";
import * as fs from 'fs';
import * as Discord from 'discord.js';
import './Commands/_CommandLibrary';
import { ICommand, ICommands } from './command';
import { SaveGame, defaultServerObject } from "./savegame";
import { deserialize } from "class-transformer";
const dotenv = require('dotenv');
dotenv.config();
const prefix = process.env.PREFIX || '.';
const client = new Discord.Client({ 'messageCacheMaxSize': 2000 });

export const Commands = new Discord.Collection<string, ICommand>();
export const Games = new Discord.Collection<string, SaveGame>();

importCommands();

export let DefaultServers: defaultServerObject = new defaultServerObject();

try {
	DefaultServers = deserialize(defaultServerObject, fs.readFileSync(`${process.env.SAVEPATH}defaultservers.json`, 'utf-8'));
}
catch (error) {
	console.log(error);
}

try {
	console.log('Loading default games');
	DefaultServers.loadAll(Games);
}
catch (error) {
	console.log('error during loading default games');
	console.log(error);
}


const cooldowns = new Discord.Collection<string, Discord.Collection<string, [number, number]>>();

client.once('ready', () => {
	console.log('Ready');
});

client.on('message', message => {
	message = (message as Discord.Message);
	const id = message.author.id;
	const guildid = message.guild?.id;
	if (guildid == undefined)
		return;
	const savegame = Games.get(guildid);
	if (!message.content?.startsWith(savegame?.Options.CustomPrefix ? savegame.Options.CustomPrefix : prefix) || message.author?.bot)
		return;
	{
		const args = message.content.slice(prefix.length).split(/ +/);
		console.log(args[0] + (args[1] ? ` ${args[1]}` : ''));
		const commandName = args.shift()?.toLowerCase();

		if (!commandName)
			return;

		if (args.some(a => a.startsWith('--h'))) {
			return Commands.get('help')?.execute(message, [commandName], client, savegame).catch(err => {
				message.channel?.send((err as Error).message);
			});
		}

		// Dynamic Commands
		const command: ICommand = Commands.get(commandName) as ICommand || Commands.find(cmd => {
			if (cmd.aliases?.includes(commandName))
				return true;
			return false;
		});
		if (!command) { return; }

		// Several permission checks defined by command properties
		{
			// Check Admin permission
			if (command.admin && (!message.member?.hasPermission('ADMINISTRATOR') || savegame?.Options.GMCheck(id))) {
				if (message.author?.id != '226766417918296064') {
					return message.channel.send('You do not have permission for this command.');
				}
			}

			// Check Args requirement
			if (command.args && !args.length) {
				return message.channel.send('Please provide the required arguments.');
			}

			// Check save presence
			if (!savegame && command.requireSave) {
				return message.channel.send('A game has to be loaded for this command');
			}

			// Check Cooldown
			if (command.cooldown && !message.member?.hasPermission('ADMINISTRATOR')) {
				let timestamps = cooldowns.get(command.name);
				if (timestamps == undefined) {
					timestamps = new Discord.Collection<string, [number, number]>();
					cooldowns.set(command.name, timestamps);
				}

				const now: number = Date.now().valueOf();
				let cooldownAmount = (command.cooldown) * 1000;

				if (timestamps.has(id)) {
					let record = timestamps.get(id);
					if (record == undefined)
						record = [0, 0];
					const expirationTime = record[0] + record[1];
					if (now < expirationTime) {
						const timeLeft = (expirationTime - now);
						let emoji = '❌';
						switch (12 - Math.floor(12 * timeLeft / cooldownAmount)) {
							case 1: emoji = '🕐'; break;
							case 2: emoji = '🕑'; break;
							case 3: emoji = '🕒'; break;
							case 4: emoji = '🕓'; break;
							case 5: emoji = '🕔'; break;
							case 6: emoji = '🕕'; break;
							case 7: emoji = '🕖'; break;
							case 8: emoji = '🕗'; break;
							case 9: emoji = '🕘'; break;
							case 10: emoji = '🕙'; break;
							case 11: emoji = '🕚'; break;
							case 12: emoji = '🕛'; break;
						}
						message.react(emoji);
						return;
						// return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
					}
				}

				timestamps.set(id, [now, cooldownAmount]);
				setTimeout(() => timestamps?.delete(id), cooldownAmount);
			}
		}
		// Command Execution
		command.execute(message, args, client, savegame).then(result => {
			if(typeof result === 'string')
				message.channel?.send(result);
			(message as Discord.Message).delete()
		}).catch(err => {
			console.log(err);
			message.channel?.send((err as Error).message);
		});


	}

});

client.on('messageReactionAdd', (reaction, user) => {
	try {
		if (reaction.emoji.name == 'log' && !reaction.me) {
			console.log('log react');
			let guild = reaction.message.guild;
			if (guild == null)
				return;
			if (!Games.get(guild.id)) { return reaction.message.channel.send('Game not loaded.'); }
			{
				// TODO log entry. tools.log(games.get(guild.id), user.id, `${reaction.message.cleanContent.slice(0, 80)}${reaction.message.cleanContent.length > 81 ? '...' : '' }`, { 'url': reaction.message.url, 'subjectid': reaction.message.author.id, 'timestamp' : reaction.message.createdAt });
				reaction.message.react('📝')
					.then(r => setTimeout(function () { if (client.user) r.users.remove(client.user.id); }, 30000));
			}
			reaction.users.remove((user as Discord.User));
		}
	}
	catch (error) {
		console.log(error);
		reaction.message.channel.send(error.message);
	}
});

function importCommands() {
	const commandConstructors = ICommands.GetImplementations();

	for (const ctor in commandConstructors) {
		// set a new item in the Collection
		// with the key as the command name and the value as the exported module
		const commandImplementation = new commandConstructors[ctor]();
		Commands.set(commandImplementation.name, commandImplementation);
	}

}


client.login(process.env.TOKEN);