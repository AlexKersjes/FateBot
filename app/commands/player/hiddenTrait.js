module.exports = {
	name: 'hide',
	description: 'Hide something on your character sheet. .hide category "name" OR listnumber',
	aliases: ['hidden'],
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
			{ hiddenbyindex(character.Aspects, int); break;}
			character.Aspects[name].Hidden = character.Aspects[name].Hidden ? false : true;
			break;
		case 'condition' :
			if(int)
			{ hiddenbyindex(character.Conditions, int); break;}
			character.Conditions[name].Hidden = character.Conditions[name].Hidden ? false : true;
			break;
		case 'stunt' :
			if(int)
			{ hiddenbyindex(character.Stunts, int); break;}
			character.Stunts[name].Hidden = character.Stunts[name].Hidden ? false : true;
			break;
		case 'approach' :
			character.Approaches[name];
			break;
		default :
			return message.channel.send('Please input a valid category.');
		}

		const categoryCapitalized = args[0].charAt(0).toUpperCase() + args[0].slice(1);
		return message.channel.send(`${categoryCapitalized} Hidden status changed.`);
	},
};
function hiddenbyindex(object, int)
{
	const trait = object[Object.keys(object)[int - 1]];
	trait.Hidden = trait.Hidden ? false : true;
}