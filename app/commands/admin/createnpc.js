const charselect = require('../player/charselect.js');
module.exports = {
	name: 'createnpc',
	description: 'Create a new NPC.',
	admin: 'true',
	execute(message, args, client)
	{
		if(message.mentions.users.first()) { return message.channel.send('Mentions are disabled for this command.'); }
		const savedata = client.currentgame[message.guild.id];
		charselect.icebox(message, client);
		savedata.PCs[message.author.id] =
		{
			'Name' : 'Unnamed',
			'Aspects' : {},
			'Conditions' : {},
			'Stunts' : {},
			'Approaches' : {},
			'imgURL' : '',
			'NPC' : true,
		};
		return message.channel.send('New NPC created.');
	},
};