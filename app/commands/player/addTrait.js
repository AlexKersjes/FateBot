module.exports = {
	name: 'add',
	description: 'Add something to or change something your character sheet. Editable categories are: name concept aspect condition stunt approach img.\nnon-optional: "trait name". optional: /trait description/, [severity], Hidden',
	aliases: ['edit'],
	args: true,
	visibleReject: true,
	execute(message, args, client)
	{
		const name = message.cleanContent.split('"')[1];
		let description = message.cleanContent.split('/')[1];
		if (!message.cleanContent.includes('/')) { description = 'No description.'; }
		let severity = message.cleanContent.split('[').pop().split(']')[0];
		if (!message.cleanContent.includes('[')) { severity = ''; }
		const hidden = args.includes('Hidden') ? true : false;
		const int = isNaN(parseInt(args[1])) || parseInt(args[1]) == undefined ? 0 : parseInt(args[1]);

		if(!client.currentgame.GameName)
		{ return message.channel.send('Game is not loaded'); }

		if (name == undefined && args[0].toLowerCase() != 'img')
		{
			return message.channel.send('Please enter a valid name for your trait.');
		}

		const character = client.currentgame.PCs[message.author.id];

		switch (args[0].toLowerCase())
		{
		case 'name' :
			character.Name = name;
			break;
		case 'concept' :
			character.HighConcept = name;
			break;
		case 'aspect' :
			character.Aspects[name] = { 'Description' : description, 'Hidden' : hidden };
			break;
		case 'condition' :
			character.Conditions[name] = { 'Description' : description, 'Severity' : severity, 'Hidden' : hidden };
			break;
		case 'stunt' :
			character.Stunts[name] = { 'Description' : description, 'Hidden' : hidden };
			if(int) { character.Stunts[name].Cost = int; }
			break;
		case 'approach' :
			character.Approaches[name.charAt(0).toUpperCase() + name.slice(1)] = int;
			break;
		case 'img' :
			character.imgURL = args[1];
			break;
		default :
			return message.channel.send('Please input a valid category.');
		}

		const categoryCaptitalized = args[0].charAt(0).toUpperCase() + args[0].slice(1);
		return message.channel.send(`${categoryCaptitalized} edited.`);
	},
};