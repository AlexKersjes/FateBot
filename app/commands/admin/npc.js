module.exports = {
	name: 'npc',
	description: 'Flip NPC condition on the current sheet.',
	visibleReject: true,
	admin: true,
	execute(message, args, client)
	{
		let character;
		try
		{
			character = client.currentgame[message.guild.id].PCs[message.author.id];
			if (!character)
			{
				throw new console.error('No character found.');
			}
		}
		catch
		{
			return message.channel.send('No character found.');
		}

		message.delete();

		character.NPC = character.NPC ? false : true;

		message.channel.send(`NPC: ${character.NPC}`);
	},
};