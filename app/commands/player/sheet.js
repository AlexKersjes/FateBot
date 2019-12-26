const Discord = require('discord.js');
const tools = require('../../tools.js');
const charselect = require('./charselect.js');
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
		let character;

		// load character / create blank sheet for players without characters
		try
		{
			character = this.retrievecharacter(message, client);
		}
		catch (error)
		{
			console.log(error);
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
			message.channel.send(detailembed(character, message, 'Aspects')).then(m => createlistener(m, client, character, message));
			break;
		case 'conditions' :
			message.channel.send(detailembed(character, message, 'Conditions')).then(m => createlistener(m, client, character, message));
			break;
		case 'stunts' :
			message.channel.send(detailembed(character, message, 'Stunts')).then(m => createlistener(m, client, character, message));
			break;
		case 'icebox':
			charselect.icebox(message, client);
			break;
		default :
			message.channel.send(sheetembed(character, message)).then(m => createlistener(m, client, character, message));
			break;
		}
		message.delete();
	},

	retrievecharacter : function(message, client)
	{
		let character;
		if(message.mentions.users.first() != undefined && message.member.hasPermission('ADMINISTRATOR'))
		{ character = client.currentgame[message.guild.id].PCs[message.mentions.users.first().id]; }
		else
		{ character = client.currentgame[message.guild.id].PCs[message.author.id]; }
		if (character == undefined)
		{
			throw new console.error('No character found.');
		}
		return character;
	},
};

// default character sheet layout
function sheetembed(character, message)
{
	const embed = new Discord.MessageEmbed()
		.setColor(message.member.displayColor)
		.setTitle(`**${character.Name}**`);
	if(!character.NPC || character['High Concept']) { embed.setDescription(`the ***${character['High Concept']}***`); }
	if (character.Trouble[0] != 'No Trouble') { embed.addField('Trouble', `${character.Trouble[0]}`); }
	if(!tools.isEmpty(character.Aspects) || !character.NPC)
	{
		embed.addField('Aspects', keysstring(character.Aspects))
			.addBlankField();
	}
	if(!tools.isEmpty(character.Aspects) || !character.NPC) {embed.addField('Stunts', keysstring(character.Stunts), true);}
	if(!tools.isEmpty(character.Conditions)) { embed.addField('Conditions', keysstring(character.Conditions), true); }
	embed.addBlankField();
	tools.findbymarkerrecursive(character, 'Boxes').forEach(boxaspect =>
	{
		embed.addField(boxaspect[0], boxesmarked(boxaspect[1]), true);
	}
	);
	if(!tools.isEmpty(character.Aspects) || !character.NPC)
	{
		embed.addBlankField()
			.addField('Approaches', sortapproaches(character.Approaches));
	}
	embed.setThumbnail(character.imgURL ? character.imgURL : message.author.avatarURL());
	return embed;
}

function detailembed(character, message, detail)
{
	const embed = new Discord.MessageEmbed()
		.setColor(message.member.displayColor)
		.setThumbnail(character.imgURL ? character.imgURL : message.author.avatarURL())
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
	const embed = new Discord.MessageEmbed()
		.setColor(message.member.displayColor)
		.setThumbnail(character.imgURL ? character.imgURL : message.author.avatarURL())
		.setTitle(character.Name)
		.setDescription('Details:');
	tools.findbytype(character, 'string')
		.forEach(key =>
		{
			if(key != 'imgURL')
			{ embed.addField(`${key}:`, character[key]); }
		});
	return embed;
}

async function createlistener(message, client, character, originalmessage)
{
	const filter = (reaction, user) =>
	{
		return (reaction.emoji.name == '🏠' || reaction.emoji.name == '🇩' || reaction.emoji.name == '🇦' || reaction.emoji.name == '🇸' || reaction.emoji.name == '🇨')
			&& user.id != client.me.user.id;
	};

	try
	{
		await message.react('🏠');
		await message.react('🇩');
		if(!tools.isEmpty(character.Aspects)) {await message.react('🇦');}
		if(!tools.isEmpty(character.Stunts)) {await message.react('🇸');}
		if(!tools.isEmpty(character.Conditions)) {await message.react('🇨');}
	}
	catch
	{
		console.error('reaction promise failed');
	}


	const collector = message.createReactionCollector(filter, { time: 180000 });

	collector.on('collect', (reaction, user) =>
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

		reaction.users.remove(user);
		message.reactions.resolve(reaction);
	});

	collector.on('end', collected =>
	{
		message.clearReactions();
	});

}

// utility functions below
function keysstring(object)
{
	if (tools.isEmpty(object))
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
		const filtered = tools.findbyvalue(approaches, i);
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