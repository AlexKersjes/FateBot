const tools = require('../../tools.js');
module.exports = {
	name: 'delete',
	description: 'Remove something from your character sheet. .del category "name" OR listnumber',
	aliases: ['remove', 'del'],
	args: true,
	visibleReject: true,
	execute(message, args, client)
	{
		const name = message.cleanContent.split('"')[1];
		const int = isNaN(parseInt(args[1])) ? undefined : parseInt(args[1]);

		if(!client.currentgame[message.guild.id].GameName)
		{ return message.channel.send('Game is not loaded'); }

		const character = tools.retrievecharacter(message, client);

		switch (args[0].toLowerCase())
		{
		case 'aspect' :
			if(int)
			{ deletebyindex(character.Aspects, int); break;}
			delete character.Aspects[name];
			break;
		case 'condition' :
			if(int)
			{ deletebyindex(character.Conditions, int); break;}
			delete character.Conditions[name];
			break;
		case 'boxcondition':
			if(!character[name].Boxes) { return message.channel.send('Not a boxcondition.'); }
			delete character[name];
			break;
		case 'stunt' :
			if(int)
			{ deletebyindex(character.Stunts, int); break;}
			delete character.Stunts[name];
			break;
		case 'approach' :
			delete character.Approaches[name];
			break;
		case 'detail':
			if(character[name] == undefined || typeof character[name] == 'string' && name != 'Name' || name != 'High Concept')
			{ delete character[name]; }
			break;
		case 'concept':
			if(character['High Concept'] && character.NPC == false)
			{ return message.channel.send('Player characters require a High Concept.'); }
			delete character['High Concept'];
			break;
		case 'trouble':
			if(character.Trouble && character.NPC == false)
			{ return message.channel.send('Player characters require a Trouble.'); }
			delete character.Trouble;
			break;
		default :
			return message.channel.send('Please input a valid category.');
		}

		const categoryCapitalized = args[0].charAt(0).toUpperCase() + args[0].slice(1);
		return message.channel.send(`${categoryCapitalized} removal completed.`);
	},
};
function deletebyindex(object, int)
{
	delete object[Object.keys(object)[int - 1]];
}