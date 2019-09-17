module.exports = {
	name: 'tarot',
	aliases: ['cards'],
	description: 'Read a fortune. It will not be the same tomorrow.',
	channels: ['gameroom'],
	execute(message, args, client)
	{
		if(!client.save.starttime) { return; }

		if((Date.now() - client.save.starttime) / (1000 * 60 * 60 * 24) < 1)
		{
			message.channel.send('', { file: 'app/data/tarot1.jpg' });
		}
		else if((Date.now() - client.save.starttime) / (1000 * 60 * 60 * 24) < 2)
		{
			message.channel.send('', { file: 'app/data/tarot2.jpg' });
		}
		else
		{
			message.channel.send('', { file: 'app/data/tarot3.jpg' });
		}
	},
};