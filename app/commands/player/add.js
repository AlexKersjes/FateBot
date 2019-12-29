const tools = require('../../tools.js');
module.exports = {
	name: 'add',
	description: 'Add something to or edit something your character sheet. Editable categories are: name, trouble, concept, aspect, condition, stunt, approach, boxcondition, detail, img.\nSyntax: __.add category **"**trait name**"**__ **/**trait description**/** **[**severity**]** **Hidden** **\\|**current boxes**\\|**max boxes**\\|**\ne.g. .add aspect Hidden "Aspect of Dummy Value" /This aspect signifies the value of dumminess./',
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

		const currentboxes = 0;
		const maxboxes = parseInt(message.cleanContent.split('|')[1]);

		if(!client.currentgame[message.guild.id])
		{ return message.channel.send('Game is not loaded'); }

		if (name == undefined && args[0].toLowerCase() != 'img')
		{
			return message.channel.send('Please enter a valid name for your trait.');
		}

		const character = tools.retrievecharacter(message, client);

		if (hidden) {message.delete();}

		switch (args[0].toLowerCase())
		{
		case 'name' :
			character.Name = name;
			break;
		case 'trouble':
			character.Trouble = [name, description];
			break;
		case 'concept' :
			character['High Concept'] = name;
			break;
		case 'aspect' :
			character.Aspects[name] = { 'Description' : description, 'Hidden' : hidden };
			break;
		case 'condition' :
			character.Conditions[name] = { 'Description' : description, 'Severity' : severity, 'Hidden' : hidden };
			if(maxboxes)
			{
				if(currentboxes > maxboxes || currentboxes < 0)
				{ message.channel.send('Invalid boxes.'); }
				else
				{
					character.Conditions[name].Boxes = true;
					character.Conditions[name].Maximum = maxboxes;
					character.Conditions[name].Current = currentboxes;
				}
			}
			break;
		case 'boxcondition' :
			if(!isNaN(maxboxes))
			{
				if(currentboxes > maxboxes)
				{ return message.channel.send('Invalid boxes.'); }
				else
				{
					character[name] = {};
					character[name].Boxes = true;
					character[name].Maximum = maxboxes;
					character[name].Current = currentboxes;
					break;
				}
			}
			else { return message.channel.send('Invalid boxcondition.'); }
		case 'stunt' :
			character.Stunts[name] = { 'Description' : description, 'Hidden' : hidden };
			if(int) { character.Stunts[name].Cost = int; }
			break;
		case 'approach' :
			character.Approaches[name.charAt(0).toUpperCase() + name.slice(1)] = int;
			break;
		case 'img' :
			console.log(message.attachments.first().url);
			if(message.attachments.first().url)
			{ character.imgURL = message.attachments.first().url; break; }
			character.imgURL = args[1];
			break;
		case 'detail' :
			if(character[name] == undefined || typeof character[name] == 'string')
			{character[name] = description;}
			else { return message.channel.send('Protected key.'); }
			break;
		default :
			return message.channel.send('Please input a valid category.');
		}

		const categoryCaptitalized = args[0].charAt(0).toUpperCase() + args[0].slice(1);
		return message.channel.send(`${categoryCaptitalized} edited.`);
	},
};