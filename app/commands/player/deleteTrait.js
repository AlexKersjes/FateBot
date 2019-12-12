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

		if(!client.currentgame.GameName)
		{ return message.channel.send('Game is not loaded'); }

		const character = client.currentgame.PCs[message.author.id];

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
		case 'stunt' :
			if(int)
			{ deletebyindex(character.Stunts, int); break;}
			delete character.Stunts[name];
			break;
		case 'approach' :
			delete character.Approaches[name];
			break;
		case 'detail':
			if(character[name] == undefined || typeof character[name] == 'string' && name != 'Name' || name != 'Trouble' || name != 'High Concept')
			{ delete character[name]; }
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