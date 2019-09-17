module.exports = {
	name: 'listen',
	description: 'Listen closely.',
	channels: ['garden', 'library'],
	visibleReject: true,
	execute(message, args, client)
	{
		const channel = message.channel;
		message.delete();
		if (channel.id === client.channelDictionary['garden'])
		{
			if (client.save.corpse)
			{
				return channel.send('The garden is quiet, but every few seconds a robin breaks the silence. The birdsong is pleasant.', { file: 'app/data/Birdsong.mp3' });
			}

			return channel.send('It\'s eerily quiet in the dark. Suddenly, you hear an owl, then quiet again.', { file: 'app/data/Owl.mp3' });

		}
	},
};
