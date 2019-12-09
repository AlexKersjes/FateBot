const Discord = require('discord.js');
module.exports = {
	name: 'charactersheet',
	description: 'Display your character sheet.',
	visibleReject: true,
	aliases: ['character', 'sheet', 'status'],
	execute(message, args, client)
	{
		if(!client.currentgame.GameName)
		{ return message.channel.send('Game not loaded'); }
		const savedata = client.currentgame;
		let character;

		try
		{
			console.log(savedata);
			character = savedata.PCs[message.author.id];
			if (!character)
			{
				throw new console.error('No character found.');
			}
		}
		catch
		{
			character =
			{
				'Name' : '',
				'HighConcept' : '',
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
				'Stress' : 0,
				'MaxStress' : 6,
				'InPeril' : 0,
				'MaxPeril' : 1,
				'Doomed' : 0,
				'MaxDoomed' : 1,
			};
			client.currentgame.PCs[message.author.id] = character;
			message.channel.send('Created character sheet');
			return;
		}

		// fixing null fields
		{
			character.Name = character.Name ? character.Name : 'Unnamed';
			character.HighConcept = character.HighConcept ? character.HighConcept : 'Undefined';
			if (character.Aspects.length > 0) { character.Aspects = { 'No Aspects' : { 'Description' : 'No Aspects', 'Hidden': false } }; }
			if (character.Conditions.length > 0) { character.Conditions = { 'No Conditions': { 'Description' : 'No Conditions', 'Hidden': false } }; }
			if (character.Stunts.length > 0) { character.Stunts = { 'No Stunts' : { 'Description' : 'No Stunts', 'Hidden': false } }; }
		}

		const embed = new Discord.RichEmbed()
			.setColor(message.member.displayColor)
			.setTitle(character.Name)
			.setDescription(`***${character.HighConcept}***`)
			.addField('Aspects', keysstring(character.Aspects))
			.addBlankField()
			.addField('Conditions', keysstring(character.Conditions), true)
			.addField('Stunts', keysstring(character.Stunts), true)
			.addBlankField()
			.addField('Stress', boxesmarked(character.MaxStress, character.Stress), true)
			.addField('In Peril', boxesmarked(character.MaxPeril, character.InPeril), true)
			.addField('Doomed', boxesmarked(character.MaxDoomed, character.Doomed), true)
			.addBlankField()
			.addField('Approaches', sortapproaches(character.Approaches))
			.setThumbnail(message.author.avatarURL);
		message.channel.send(embed);
	},
};

function keysstring(object)
{
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

function boxesmarked(max, current)
{
	let string = '';
	for (let i = 0; i < max; i++)
	{
		if (current <= i)
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

	console.log(approaches);

	return 'WIP';
}

function findbyvalue(array, value)
{
	let result = {};
	array.forEach(element =>
	{
		if (array[element] == value)
		{ result += element; }
	});
	return result;
}
/* const embed = new Discord.RichEmbed()
			.setColor(message.member.displayColor)
			.setTitle('Mina Volare')
			.setDescription('***the INTERPLANAR RANGER.***')
			.addField('Aspects', 'Vigilante Legacy,\nToo cool for her own good,\nTinfoil Hat')
			.addBlankField()
			.addField('Conditions', 'Role: *The Smuggler* [Sticky],\n Flame-scarred [Lasting]', true)
			.addField('Stunts', 'A trusty tool & A useful souvenir,\n Dramatic Exit', true)
			.addBlankField()
			.addField('Stress', '[ ]  [ ]  [ ]  [ ]  [ ]  [ ]', true)
			.addField('In Peril', '[ ]', true)
			.addField('Doomed', '[ ]', true)
			.setThumbnail('https://cdn.discordapp.com/attachments/617186171612692491/650849322371383328/tfc_bluemoons_v3.png');*/