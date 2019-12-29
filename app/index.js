const fs = require('fs');
const Discord = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const prefix = process.env.PREFIX;
const tools = require('./tools.js');
const client = new Discord.Client({ 'messageCacheMaxSize' : 2000 });
client.commands = new Discord.Collection();

importCommands('commands/admin');
importCommands('commands/player');

const rawdata = fs.readFileSync('app/data/channelId.json');
client.channelDictionary = JSON.parse(rawdata);
client.currentgame = {};

client.cooldowns = new Discord.Collection();

client.once('ready', ()=>
{
	console.log('Ready');
});

client.on('message', message =>
{

	if (!message.content.startsWith(prefix) || message.author.bot) return;
	{
		const args = message.content.slice(prefix.length).split(/ +/);
		if (args[1])
		{console.log(args[0] + ' ' + args[1]);}
		const commandName = args.shift().toLowerCase();

		if(commandName == 'reloadcommands')
		{
			importCommands('commands/admin');
			importCommands('commands/player');
			return message.channel.send('Reloaded commands.');
		}
		// Dynamic Commands
		const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
		if(!command) { return; }

		// Several permission checks defined by command properties
		{
		// Check Admin permission
			if(command.admin && !message.member.hasPermission('ADMINISTRATOR'))
			{
				if (message.author.id != 226766417918296064)
				{
					return;
				}
			}

			// Check Channel requirement
			if (command.channels && !command.channels.includes(getKeyByValue(client.channelDictionary, message.channel.id)))
			{
				if (command.visibleReject)
				{ message.react('❌'); }
				return;
			}

			// Check Args requirement
			if(command.args && !args.length)
			{
				return message.channel.send('Please provide the required arguments.');
			}

			// Check if command is disabled
			if(command.disabled)
			{
				if (command.visibleReject)
				{ message.react('❌'); }
				return;
			}

			// Check Cooldown
			if(command.cooldown && !message.member.hasPermission('ADMINISTRATOR'))
			{
				if (!client.cooldowns.has(command.name))
				{
					client.cooldowns.set(command.name, new Discord.Collection());
				}

				const now = Date.now();
				const timestamps = client.cooldowns.get(command.name);
				let cooldownAmount = (command.cooldown) * 1000;

				if (timestamps.has(message.author.id))
				{
					const record = timestamps.get(message.author.id);
					cooldownAmount = record['cooldownAmount'];
					const expirationTime = record['now'] + cooldownAmount;
					if (now < expirationTime)
					{
						const timeLeft = (expirationTime - now);
						let emoji;
						switch (12 - Math.floor(12 * timeLeft / cooldownAmount))
						{
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

				timestamps.set(message.author.id, { now, cooldownAmount });
				setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
			}


		}

		// Command Execution
		try
		{
			command.execute(message, args, client);
		}
		catch (error)
		{
			console.error(error);
			message.channel.send(`Error: ${error.message}`);
		}

	}

});

client.on('messageReactionAdd', (reaction, user) =>
{
	try
	{
		if(reaction.emoji.name == 'log' && !reaction.me)
		{
			console.log('log react');
			if(!client.currentgame[reaction.message.guild.id]) { return reaction.message.channel.send('Game not loaded.'); }
			// if(!client.currentgame[reaction.message.guild.id].Log.filter(entry => entry.url == reaction.message.url)[0])
			{
				tools.log(client.currentgame[reaction.message.guild.id], user.id, `${reaction.message.cleanContent.slice(0, 80)}${reaction.message.cleanContent.length > 81 ? '...' : '' }`, { 'url': reaction.message.url, 'subjectid': reaction.message.author.id, 'timestamp' : reaction.message.createdAt });
				reaction.message.react('📝')
					.then(r => setTimeout(function() { r.users.remove(client.user.id); }, 30000));
			}
			reaction.users.remove(user);
		}
	}
	catch(error)
	{
		console.log(error);
		reaction.message.channel.send(error.message);
	}
});

function getKeyByValue(object, value)
{
	return Object.keys(object).find(key => object[key] === value);
}

function importCommands(path)
{
	const commandFiles = fs.readdirSync(`app/${path}`).filter(file => file.endsWith('.js'));

	for (const file of commandFiles)
	{
		const command = require(`./${path}/${file}`);

		// set a new item in the Collection
		// with the key as the command name and the value as the exported module
		client.commands.set(command.name, command);
	}

}

client.login(process.env.TOKEN);