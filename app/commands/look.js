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
			return channel.send('A mounted deer head stares into the distance. It has probably been hanging in the lounge since before this was a hotel, likely a trophy of the old lord of the manor.');
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
				return channel.send('The roof remains a lonely place. In the light of the Sun you see that a few tiles are missing from the roof. Perhaps they blew away in the storm last week.');
			}
			return channel.send('The roof is cold and lonely. The sky is cloudless. There is not much to be found here barring comforting visage of the Moon. The tiles you stand on are awash in a bluish white.');
		}

		if (channel.id === client.channelDictionary['kitchen'])
		{
			if (client.save.knifetaken)
			{
				return channel.send('It\'s a normal kitchen, bar its size. There is a stack of plates in the sink. An arrangement of knives sorted by size. A medium size knife is missing.');
			}
			return channel.send('It\'s a normal kitchen, bar its size. There is a stack of plates in the sink. An arrangement of knives sorted by size.');
		}

		if (channel.id === client.channelDictionary['library'])
		{
			if(client.save.corpse)
			{
				if(args[0] === 'math' || args[0] === 'mathematics')
				{ return channel.send('Most of the books seem to be related to geometry and shape. A book seems to be out of place, the alphabetical order broken.'); }
				if(args[0] === 'astrology')
				{ return channel.send('The books on astrology are too dense for you to make much sense of. The amount of books on the subject here must imply that the old lord of the manor believed the subject to be of importance though.'); }
				if(args[0] === 'book')
				{
					channel.send('"Invisible Geometry" by Richard Rhoad. It is placed near the edge of the bookcase, when in fact it should be near the middle.');
				}
				return channel.send('You find yourself in a corner of the library where the books on mathematics meet astrology. This strikes you as odd. Surely these aren\'t all that related?');
			}
			return channel.send('You browse the books but nothing in particular grabs your attention.');
		}

		if (channel.id === client.channelDictionary['crimescene'])
		{

		}

		if (channel.id === client.channelDictionary['convention'])
		{
			return channel.send('There are so many stall, the products of each one more outrageous than the stall before. Someone appears to be selling common dirt as a magical ingredient, another sells ritual candles that supposedly make the dead appear. There is a stall you hesitate to approach which sells what appear to be ritual daggers. There\'s no way those are real right?');
		}

		if (channel.id === client.channelDictionary['shop'])
		{
			return channel.send('The shop sells newspapers, chips, and a nice single person tent.');
		}

		if (channel.id === client.channelDictionary['invisible'])
		{
			if(client.save.corpse2)
			{
				return channel.send('On the stone tablet lies Heather, several of her organs outside their container.');
			}
		}

		return channel.send('👀');
	},
};