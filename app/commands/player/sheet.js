const Discord = require('discord.js');
module.exports = {
	name: 'sheet',
	description: 'Display your character sheet. Click the buttons to refresh or navigate. 🏠:home, D:details, A:aspects, S:stunts, C:conditions',
	visibleReject: true,
	aliases: ['character', 'charactersheet', 'status'],
	execute(message, args, client)
	{
		if(!client.currentgame[message.guild.id])
		{ return message.channel.send('Game not loaded'); }
		const savedata = client.currentgame[message.guild.id];
		console.log(savedata);
		let character;

		// load character / create blank sheet for players without characters
		try
		{
			this.retrievecharacter(message, client);
		}
		catch
		{
			character =
			{
				'Fate' : { 'Current' : 3, 'Refresh' : 3 },
				'Name' : 'Unnamed',
				'High Concept' : 'Undefined',
				'Trouble' : ['No Trouble', 'No description'],
				'Stress' : { 'Boxes' : true, 'Current' : 0, 'Maximum' : 6 },
				'In Peril' : { 'Boxes' : true, 'Current' : 0, 'Maximum' : 1 },
				'Doomed' : { 'Boxes' : true, 'Current' : 0, 'Maximum' : 1 },
				'Aspects' :
			{
			},
				'Conditions' :
			{
			},
				'Stunts' :
			{
			},
				'Approaches' :
			{
				'Forceful' : 0,
				'Sneaky' : 0,
				'Careful' : 0,
				'Quick' : 0,
				'Clever' : 0,
				'Flashy' : 0,
			},
				'imgURL' : '',
				'NPC' : false,
			};
			savedata.PCs[message.author.id] = character;
			message.channel.send('Created character sheet');
			return;
		}

		switch (args[0])
		{
		case 'aspects' :
			message.channel.send(detailembed(character, message, 'Aspects')).then(m => createlistener(m, character, message));
			break;
		case 'conditions' :
			message.channel.send(detailembed(character, message, 'Conditions')).then(m => createlistener(m, character, message));
			break;
		case 'stunts' :
			message.channel.send(detailembed(character, message, 'Stunts')).then(m => createlistener(m, character, message));
			break;
		case 'icebox':
			if(character.Name == 'Unnamed')
			{ message.delete(); return message.channel.send('Name character to icebox.'); }
			savedata.NPCs[character.Name] = character;
			message.channel.send(`Iceboxed ${character.Name}`);
			delete savedata.PCs[message.author.id];
			break;
		default :
			message.channel.send(sheetembed(character, message)).then(m => createlistener(m, character, message));
			break;
		}
		message.delete();
	},

	retrievecharacter : function(message, client)
	{
		try
		{
			let character;
			if(message.mentions && message.member.hasPermission('ADMINISTRATOR'))
			{ character = client.currentgame[message.guild.id].PCs[message.mentions.member.first().id]; }
			else
			{ character = client.currentgame[message.guild.id].PCs[message.author.id]; }
			if (!character)
			{
				throw new console.error('No character found.');
			}
			return character;
		}
		catch
		{
			throw new console.error('No character found.');
		}
	},
};

// default character sheet layout
function sheetembed(character, message)
{
	const embed = new Discord.RichEmbed()
		.setColor(message.member.displayColor)
		.setTitle(`**${character.Name}**`);
	if(!character.NPC) { embed.setDescription(`the ***${character['High Concept']}***`); }
	if (character.Trouble[0] != 'No Trouble') { embed.addField('Trouble', `${character.Trouble[0]}`); }
	if(!isEmpty(character.Aspects) || !character.NPC)
	{
		embed.addField('Aspects', keysstring(character.Aspects))
			.addBlankField();
	}
	if(!isEmpty(character.Aspects) || !character.NPC) {embed.addField('Stunts', keysstring(character.Stunts), true);}
	if(!isEmpty(character.Conditions)) { embed.addField('Conditions', keysstring(character.Conditions), true); }
	embed.addBlankField();
	findbymarkerrecursive(character, 'Boxes').forEach(boxaspect =>
	{
		embed.addField(boxaspect[0], boxesmarked(boxaspect[1]), true);
	}
	);
	if(!isEmpty(character.Aspects) || !character.NPC)
	{
		embed.addBlankField()
			.addField('Approaches', sortapproaches(character.Approaches));
	}
	embed.setThumbnail(character.imgURL ? character.imgURL : message.author.avatarURL);
	return embed;
}

function detailembed(character, message, detail)
{
	const embed = new Discord.RichEmbed()
		.setColor(message.member.displayColor)
		.setThumbnail(character.imgURL ? character.imgURL : message.author.avatarURL)
		.setTitle(character.Name)
		.setDescription(`${detail}:`);
	if (detail == 'Aspects')
	{ if (character.Trouble[0] != 'No Trouble') { embed.addField(character.Trouble[0], character.Trouble[1]); } }
	Object.keys(character[detail])
		.forEach(key =>
		{
			if (character[detail][key].Hidden)
			{
				embed.addField('[HIDDEN]', '[REDACTED]');
				return;
			}
			const severity = character[detail][key].Severity ? ` [${character[detail][key].Severity}]` : '' ;
			const cost = character[detail][key].Cost ? `{${character[detail][key].Cost}} ` : '' ;
			const boxes = character[detail][key].Boxes ? boxesmarked(character[detail][key]) + ': ' : '';
			embed.addField(`${boxes}${cost}${key}:${severity}`, character[detail][key].Description);
		});
	return embed;
}

function plainembed(character, message)
{
	const embed = new Discord.RichEmbed()
		.setColor(message.member.displayColor)
		.setThumbnail(character.imgURL ? character.imgURL : message.author.avatarURL)
		.setTitle(character.Name)
		.setDescription('Details:');
	findbytype(character, 'string')
		.forEach(key =>
		{
			if(key != 'imgURL')
			{ embed.addField(`${key}:`, character[key]); }
		});
	return embed;
}

async function createlistener(message, character, originalmessage)
{
	const filter = (reaction, user) =>
	{
		return (reaction.emoji.name == '🏠' || reaction.emoji.name == '🇩' || reaction.emoji.name == '🇦' || reaction.emoji.name == '🇸' || reaction.emoji.name == '🇨') && user.id != message.author.id;
	};

	try
	{
		await message.react('🏠');
		await message.react('🇩');
		if(!isEmpty(character.Aspects)) {await message.react('🇦');}
		if(!isEmpty(character.Stunts)) {await message.react('🇸');}
		if(!isEmpty(character.Conditions)) {await message.react('🇨');}
	}
	catch
	{
		console.error('reaction promise failed');
	}
	// message.react('🏠').then(message.react('🇩')).then(message.react('🇦')).then(message.react('🇸')).then(message.react(''));

	const collector = message.createReactionCollector(filter, { time: 180000 });

	collector.on('collect', (reaction, reactionCollector) =>
	{
		switch(reaction.emoji.name)
		{
		case '🏠' :
			message.edit(sheetembed(character, originalmessage));
			break;
		case '🇦':
			message.edit(detailembed(character, originalmessage, 'Aspects'));
			break;
		case '🇸':
			message.edit(detailembed(character, originalmessage, 'Stunts'));
			break;
		case '🇨':
			message.edit(detailembed(character, originalmessage, 'Conditions'));
			break;
		case '🇩':
			message.edit(plainembed(character, originalmessage));
			break;
		}
		reaction.users.forEach(i =>
		{ if(i.id != reactionCollector.message.author.id) { reaction.remove(i);}});
	});

	collector.on('end', collected =>
	{
		message.clearReactions();
	});

}

// utility functions below
function keysstring(object)
{
	if (isEmpty(object))
	{ return 'None'; }
	const array = Object.keys(object);
	let string = '';
	array.forEach((key, index) =>
	{
		if (object[key].Hidden)
		{
			string += '[HIDDEN]';
		}
		else
		{
			string += key;
		}
		if (index != array.length - 1)
		{ string += '\n'; }
	});
	return string;
}

function boxesmarked(boxcondition)
{
	let string = '';
	for (let i = 0; i < boxcondition.Maximum; i++)
	{
		if (boxcondition.Current <= i)
		{
			string += '[ ] ';
		}
		else
		{
			string += '[x] ';
		}
	}
	return string;
}

function sortapproaches(approaches)
{
	let str = '';
	for (let i = -2; i < 9; i++)
	{
		if(i == 0)
		{ continue; }
		const filtered = findbyvalue(approaches, i);
		if(filtered.length == 0)
		{ continue; }
		const plus = i > 0 ? '+' : '';
		let tempstr = `${plus}${i}: `;
		filtered.forEach(approach => { tempstr += `${approach}, `; });
		tempstr = tempstr.slice(0, -2);
		tempstr += '\n';
		str = tempstr + str;
	}
	str = str.slice(0, -1);
	if(!str)
	{ str = 'No Approaches'; }
	return str;
}

function findbyvalue(array, value)
{
	const result = [];
	Object.keys(array).forEach(key =>
	{
		if(array[key] == value)
		{ result.push(key); }
	});
	return result;
}

function findbymarkerrecursive(array, value)
{
	const result = [];
	Object.keys(array).forEach(key =>
	{
		if(array[key][value])
		{ result.push([key, array[key]]); }
		else if (typeof array[key] == 'object')
		{
			if(!isEmpty(findbymarkerrecursive(array[key], value)))
			{result.push(findbymarkerrecursive(array[key], value)[0]);}
		}
	});
	return result;
}

function findbytype(array, type)
{
	const result = [];
	Object.keys(array).forEach(key =>
	{
		if(typeof (array[key]) == type)
		{ result.push(key); }
	});
	return result;
}

function isEmpty(obj)
{
	if(Object.keys(obj).length == 0)
	{ return true; }
	return false;
}