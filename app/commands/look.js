module.exports = {
	name: 'look',
	description: 'Look around.',
	aliases: ['investigate', 'explore', 'inspect'],
	visibleReject: true,
	execute(message, args, client)
	{
		const channel = message.channel;
		message.delete();

		if (channel.id === client.channelDictionary['lobby'])
		{

		}

		if (channel.id === client.channelDictionary['dininghall'])
		{

		}

		if (channel.id === client.channelDictionary['lounge'])
		{

		}

		if (channel.id === client.channelDictionary['gameroom'])
		{
			return channel.send('The cupboard near the door is stacked with board games and light fiction. A tall stack of Mills and Boon books hides an old Magic 8 Ball and a deck of cards.');
		}

		if (channel.id === client.channelDictionary['garden'])
		{
			if(client.save.corpse)
			{
				if(!args[0])
				{
					return channel.send('The garden is quiet in the morning dew. As you stroll around you see a figure slouched against the southern wall of the hotel. It doesn\'t appear to be moving.');
				}

				if(args[0] === 'figure' || args[0] === 'corpse')
				{
					return channel.send('As you approach, you see that the figure is actually Jeremie Chevalier, famous eccentric. His shirt is drenched in blood. On closer inspection it reveals a triplet of holes.');
				}

				if(args[0] === 'wound' || args[0] === 'hole' || args[0] === 'holes' || args[0] === 'blood')
				{
					return channel.send('The narrow slits extend into Jeremie\'s flesh, multiple inches deep. One into the liver, another into the lower abdomen. The third pierces between his ribs, striking where you assume his heart is. The amount of blood is perplexing.');
				}
			}

			return channel.send('The garden is quiet, but every few seconds a robin breaks the silence. The birdsong is pleasant.', { file: 'app/data/Birdsong.mp3' });
		}

		if (channel.id === client.channelDictionary['roof'])
		{
			if(client.save.corpse)
			{

			}
			return channel.send('The roof is cold and lonely. The sky is cloudless. There is not much to be found here barring comforting visage of the Moon. The tiles you stand on are awash in a bluish white.');
		}

		if (channel.id === client.channelDictionary['kitchen'])
		{

		}

		if (channel.id === client.channelDictionary['library'])
		{

		}

		if (channel.id === client.channelDictionary['crimescene'])
		{

		}

		if (channel.id === client.channelDictionary['convention'])
		{

		}

		if (channel.id === client.channelDictionary['shop'])
		{

		}

		return message.react('👀');
	},
};