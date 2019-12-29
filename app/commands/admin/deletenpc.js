const charselect = require('../player/charselect.js');
module.exports = {
	name: 'deletenpc',
	description: 'Delete an NPC.',
	admin: 'true',
	args: true,
	execute(message, args, client)
	{
		if(message.mentions.users.first()) { return message.channel.send('Mentions are disabled for this command.'); }
		const savedata = client.currentgame[message.guild.id];
		const name = message.cleanContent.split('"')[1];
		if(!savedata.NPCs[name])
		{ return message.channel.send(`${name} could not be found.`); }
		delete savedata.NPCs[name];
		return message.channel.send(`${name} was deleted.`);
	},
};