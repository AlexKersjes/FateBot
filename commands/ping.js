module.exports = {
	name: 'ping',
	description: 'Ping!',
	channels: ['gameroom'],
	execute(message, args, client)
	{
		const responses = ['Pong.', 'Pong!', 'pong' ];
		message.channel.send(responses[Math.floor(Math.random() * responses.length)]);
	},
};