const tools = require('../../tools.js');
module.exports = {
	name: 'npc',
	description: 'Flip NPC condition on the current sheet.',
	visibleReject: true,
	execute(message, args, client)
	{
		const character = tools.retrievecharacter(message, client);

		message.delete();

		character.NPC = character.NPC ? false : true;

		message.channel.send(`NPC: ${character.NPC}`);
	},
};