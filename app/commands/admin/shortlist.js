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
		if (!savedata.Shortlist)
		{ savedata.Shortlist = []; }
		switch (args[0])
		{
		case 'add':
			if(name)
			{
				savedata.Shortlist.push(savedata.NPCs[name]);
				delete savedata.NPCs[name];
			}
			else
			{
				const character = charselect.icebox(message, client);
				savedata.Shortlist.push(character);
				delete savedata.NPCs[character.name];
				name = character.name;
			}
			message.channel.send(`${name} was added to shortlist.`);
			break;
		case 'rotate':
			if(savedata.PCs[message.author.id])
			{ savedata.Shortlist.push(savedata.PCs[message.author.id]); }
			const character = savedata.Shortlist.shift();
			savedata.PCs[message.author.id] = character;
			message.channel.send(`${character.Name} is now your active character.`);
			break;
		case 'remove':
			if(!name)
			{
				message.channel.send('Please enter a name.');
				break;
			}
			// TODO
			break;
		case 'reset':
			savedata.Shortlist.forEach(listchar =>
			{
				savedata.NPCs[listchar.Name] = listchar;
			});
			savedata.Shortlist = [];
			message.channel.send('Shortlist cleared.');
			break;
		}
		message.delete();
		return;
	},
};
