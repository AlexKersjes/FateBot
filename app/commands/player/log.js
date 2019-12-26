const tools = require('../../tools.js');
const Discord = require('discord.js');
module.exports = {
	name: 'log',
	description: 'Use this command to log memorable moments.',
	visibleReject: true,
	async execute(message, args, client)
	{
		// getting appropriate log
		const savedata = client.currentgame[message.guild.id];
		if(!savedata) { return message.channel.send('Game not loaded.'); }
		if (!savedata.Log || args[0] == 'wipe')
		{
			if(!message.member.hasPermission('ADMINISTRATOR')) { return message.channel.send('You do not have permission to reset the log.'); }
			savedata.Log = [];
			message.delete();
			return message.channel.send('Log reset.');
		}

		// user calls log display
		if(!args[0])
		{
			message.delete();
			return message.channel.send(buildembeds(message, client, savedata)[0]);
		}

		// making a log entry
		let logmessage;
		let logstr;
		const logargs = { 'spoiler' : args.includes('SPOILER') ? true : false };

		// getting custom logstring
		if(args.includes('/me'))
		{
			logstr = `<@${message.author.id}> *${message.cleanContent.split('/me ')[1]}*`;
			logmessage = await message.channel.send(logstr).catch(error => console.log(error));
			logargs.quote = false;
		}
		else if(message.cleanContent.split('"')[1])
		{
			logstr = message.cleanContent.split('"')[1];
			logargs.quote = false;
		}

		// looking for target message
		if (!isNaN(parseInt(args[0])))
		{
			if(args[0].length > 2)
			{
				logmessage = await message.channel.messages.fetch(args[0]).catch(error => console.log(error));
			}
			else
			{
				const logmessages = await message.channel.messages.fetch({ limit: parseInt(args[0]) > 0 ? parseInt(args[0]) + 1 : 2 });
				logmessage = logmessages.last();
			}
			if(!logmessage) { return message.channel.send('Message not found.'); }
		}

		for(let i = 0; i < args.length; i++)
		{
			if(args[i].startsWith('https://discordapp.com/channels'))
			{
				try
				{
					const array = args[i].split('/');
					const channel = message.guild.channels.resolve(array[array.length - 2]);
					logmessage = await channel.messages.fetch(array[array.length - 1]);
					message.channel.send('Linked message logged.');
				}
				catch (error)
				{
					console.log(error);
					logargs.url = args[i];
				}
			}
		}

		if(logmessage)
		{
			if(!logstr)
			{ logstr = logmessage.cleanContent.length > 200 ? logmessage.cleanContent.slice(200) + '...' : logmessage.cleanContent; }
			logargs.url = logmessage.url;
			logargs.timestamp = logmessage.createdAt;
			logargs.subjectid = logmessage.author.id;
			logmessage.react('📝')
				.then(r => setTimeout(function() { r.users.remove(client.user.id); }, 10000));
		}

		if(logstr == undefined)
		{ return message.channel.send('No valid log string found.'); }
		tools.log(savedata, message.author.id, logstr, logargs);
		return message.delete();
	},


};

function buildembeds(message, client, savedata)
{
	let copylog = JSON.parse(JSON.stringify(savedata.Log));
	if (!message.member.hasPermission('ADMINISTRATOR'))
	{
		copylog = copylog.filter(entry => !entry.spoiler);
	}
	copylog = copylog.filter(entry => entry.loggerid == message.member.id);

	let result = '';
	const resultarray = [];
	while(copylog[0])
	{
		const entry = copylog.shift();
		const tempresult = `• ${entry.quote ? '"' : ''}[${entry.logstr}](${entry.url})${entry.quote ? '"' : ''}\n`;
		if (tempresult.length + result.length < 950)
		{
			result += tempresult;
		}
		else
		{
			resultarray.push(result);
			result = tempresult;
		}

		if(!copylog[0])
		{
			resultarray.push(result);
		}

	}

	const embeds = [];
	do
	{
		const embed = new Discord.MessageEmbed();
		embed.setTitle(`${message.member.displayName}'s Log:`)
			.setColor(client.guilds.get(message.guild.id).me.displayColor);
		for(let i = 0; i < 6; i++)
		{
			if(resultarray[0])
			{
				const line = resultarray.shift();
				embed.addField(i == 0 ? 'Log:' : '_', line);
			}
			else
			{
				embeds.push(embed);
				break;
			}
		}
		embeds.push(embed);
	}
	while(resultarray[0]);
	return embeds;
}

async function createlistener(message, client, embeds)
{
	const filter = (reaction, user) =>
	{
		return user.id != client.me.user.id;
	};

	try
	{
		for(let i = 0; i < embeds.length; i++)
		{
			await message.react(emojis[i]);
		}
	}
	catch
	{
		console.error('reaction promise failed');
	}


	const collector = message.createReactionCollector(filter, { time: 180000 });

	collector.on('collect', (reaction, user) =>
	{
		const index = emojis.indexOf(reaction.name);
		if(index)
		{ message.edit(embeds[index]); }
		reaction.users.remove(user);
	});

	collector.on('end', collected =>
	{
		message.clearReactions();
	});

}

const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟' ];