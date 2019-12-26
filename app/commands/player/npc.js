const sheet = require('./sheet.js');
module.exports = {
	name: 'npc',
	description: 'Flip NPC condition on the current sheet.',
	visibleReject: true,
	execute(message, args, client)
	{
		const character = sheet.retrievecharacter(message, client);

		message.delete();

		character.NPC = character.NPC ? false : true;

		message.channel.send(`NPC: ${character.NPC}`);
	},
};