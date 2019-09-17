module.exports = {
	name: 'buy',
	description: 'Buy something, anything.',
	channels: ['convention', 'shop'],
	visibleReject: true,
	execute(message, args, client)
	{
		if (message.channel.id === client.channelDictionary['convention'])
		{
			if (args[0] === 'candle')
			{
				return message.channel.send('You bought an odd-looking candle. Unless you\'re trained in the spiritual arts, it will not be of much use to you.');
			}

			if (args[0] === 'dagger')
			{
				return message.channel.send('You bought a jagged dagger with strange carvings on it. It looks imposing and will make for a fine souvenir. Lethal, of course.');
			}
		}

		if (message.channel.id === client.channelDictionary['shop'])
		{
			if (args[0] === 'newspaper')
			{
				return message.channel.send('The headline is **"Cultists on the loose! Is ArcanaCon dangerous?"**. You flick through some articles. None grab your attention.');
			}

			if (args[0] === 'chips')
			{
				return message.channel.send('You bought a packet of potato chips. Salty and delicious.');
			}
		}
	},
};