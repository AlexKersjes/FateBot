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
		if (!savedata.Log || args[0] == 'wipeall')
		{
			if(!message.member.hasPermission('ADMINISTRATOR')) { return message.channel.send('You do not have permission to reset the log.'); }
			savedata.Log = [];
			message.delete();
			return message.channel.send('Log reset.');
		}
		if(args[0] == 'wipe')
		{
			savedata.Log = savedata.Log.filter(entry => entry.loggerid != message.author.id);
			return message.channel.send('Your log was wiped.');
		}

		// user calls log display
		if(!args[0])
		{
			message.delete();
			const embeds = buildembeds(message, client, savedata);
			message.channel.send(embeds[0]).then(m => createlistener(m, client, embeds));
			return;
		}
		if(args[0] == 'full' || args[0] == 'all' || args[0] == 'spoilers')
		{
			message.delete();
			const embeds = buildembeds(message, client, savedata, true);
			message.channel.send(embeds[0]).then(m => createlistener(m, client, embeds));
			return;
		}

		if(args[0] == 'sort')
		{savedata.Log.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));}

		// deleting a log entry
		if (args[0] == 'delete')
		{
			const a = parseInt(args[1]);
			const b = parseInt(args[2]);
			if(!isNaN(a) && a)
			{
				let entries = savedata.Log.filter(entry => entry.loggerid == message.member.id);
				if(!isNaN(b) && b)
				{
					entries = entries.slice(a - 1, b);

					entries.forEach(element =>
					{
						savedata.Log.splice(savedata.Log.indexOf(element), 1);
					});
					return message.channel.send('Log entries deleted.');
				}
				const index = savedata.Log.indexOf(entries[a - 1]);
				savedata.Log.splice(index, 1);
				return message.channel.send('Log entry deleted.');
			}
			return message.channel.send('Failed to delete. Please check syntax.');
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

function buildembeds(message, client, savedata, showspoilers)
{
	let copylog = JSON.parse(JSON.stringify(savedata.Log));
	if (showspoilers != true)
	{
		copylog = copylog.filter(entry => !entry.spoiler);
	}
	copylog = copylog.filter(entry => entry.loggerid == message.member.id);

	let result = '';
	const resultarray = [];
	const entrycount = copylog.length;
	while(copylog[0])
	{
		const entry = copylog.shift();
		const tempresult = `${showspoilers ? `${entrycount - copylog.length}:` : '•'} ${entry.quote ? '"' : ''}[${entry.logstr}](${entry.url})${entry.quote ? '"' : ''}\n`;
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
		for(let i = 0; i < 1; i++)
		{
			if(resultarray[0])
			{
				const line = resultarray.shift();
				embed.addField(i == 0 ? 'Log:' : '_', line);
			}
			else
			{
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
		return (reaction.emoji.name == '◀️' || reaction.emoji.name == '▶️') && user.id != client.user.id;
	};

	const collector = message.createReactionCollector(filter, { time: 180000 });
	collector.on('collect', (reaction, user) =>
	{
		switch (reaction.emoji.name)
		{
		case '◀️' :
			embeds.unshift(embeds.pop());
			message.edit(embeds[0]);
			break;
		case '▶️' :
			embeds.push(embeds.shift());
			message.edit(embeds[0]);
			break;
		}
		/*
		const index = emojis.indexOf(reaction.name);
		if(index)
		{ message.edit(embeds[index]); }
		*/
		reaction.users.remove(user);
	});

	collector.on('end', collected =>
	{
		message.reactions.removeAll();
	});

	try
	{
		if(embeds.length > 1)
		{
			await message.react('◀️');
			await message.react('▶️');
		}
		/*
		for(let i = 0; i < embeds.length; i++)
		{
			await message.react(emojis[i]);
		}
		*/
	}
	catch
	{
		console.error('reaction promise failed');
	}

}

const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟' ];