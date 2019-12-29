const sheet = require('../player/sheet.js');
const charselect = require('../player/charselect.js');
module.exports = {
	name: 'shortlist',
	description: 'Use for quick access between multiple NPCs.',
	visibleReject: true,
	admin: true,
	execute(message, args, client)
	{
		const savedata = client.currentgame[message.guild.id];
		let name = message.cleanContent.split('"')[1];
		let character;
		if (!savedata.Shortlist)
		{ savedata.Shortlist = []; }
		switch (args[0])
		{
		case 'rotate':
			if(savedata.PCs[message.author.id])
			{ savedata.Shortlist.push(savedata.PCs[message.author.id]); }
			character = savedata.Shortlist.shift();
			savedata.PCs[message.author.id] = character;
			message.channel.send(`${character.Name} is now your active character.`);
			break;
		case 'remove':
			if(!name)
			{
				message.channel.send('Please enter a name.');
				break;
			}
			message.channel.send(`${savedata.Shortlist.splice(savedata.Shortlist.indexOf(c => c.Name == name), 1)[0].Name} was removed.`);
			break;
		case 'reset':
			if(args[1] != 'hard')
			{
				savedata.Shortlist.forEach(listchar =>
				{
					savedata.NPCs[listchar.Name] = listchar;
				});
			}
			savedata.Shortlist = [];
			message.channel.send('Shortlist cleared.');
			break;
		case 'add':
			if(savedata.NPCs[name])
			{
				savedata.Shortlist.push(savedata.NPCs[name]);
				delete savedata.NPCs[name];
			}
			else
			{
				character = charselect.icebox(message, client);
				if(!character)
				{ message.channel.send('No character selected to add to list.'); break; }
				savedata.Shortlist.push(character);
				delete savedata.NPCs[character.Name];
				name = character.name;
			}
			message.channel.send(`${savedata.Shortlist[savedata.Shortlist.length - 1].Name} was added to shortlist.`);
			break;
		default :
			break;
		}
		message.delete();
	},
};
