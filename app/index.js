const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./data/config.json');
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('app/commands').filter(file => file.endsWith('.js'));

let rawdata = fs.readFileSync('app/data/channelId.json');
client.channelDictionary = JSON.parse(rawdata);
rawdata = fs.readFileSync('app/data/savedata.json');
client.save = JSON.parse(rawdata);

console.log(client.channelDictionary);

for (const file of commandFiles)
{
	const command = require(`./commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}

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
		console.log(args[0]);
		const commandName = args.shift().toLowerCase();

		// Dynamic Commands
		const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
		if(!command) { return; }

		// Several permission checks defined by command properties
		{
		// Check Admin permission
			if(command.admin && !message.member.hasPermission('ADMINISTRATOR'))
			{
				return;
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
				return message.channel.send('Caw?');
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
			message.channel.send('...');
		}

	}

});

function getKeyByValue(object, value)
{
	return Object.keys(object).find(key => object[key] === value);
}
client.login(token);