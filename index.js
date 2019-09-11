const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const rawdata = fs.readFileSync('channelId.json');
client.channelDictionary = JSON.parse(rawdata);
console.log(client.channelDictionary);

for (const file of commandFiles)
{
	const command = require(`./commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}

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
		if (!client.commands.has(commandName)) return;

		const command = client.commands.get(commandName);

		// Several permission checks defined by command properties
		{
		// Check Admin permission
			if(command.admin && !message.member.hasPermission('ADMINISTRATOR'))
			{
				return;
			}

			// Check Channel requirement
			if (!command.channels.includes(getKeyByValue(client.channelDictionary, message.channel.id)))
			{
				return message.react('❌');
			}

			// Check Args requirement
			if(command.args && !args.length)
			{
				return message.channel.send('...?');
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

client.login(token);

function getKeyByValue(object, value)
{
	return Object.keys(object).find(key => object[key] === value);
}