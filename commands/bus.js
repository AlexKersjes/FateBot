const tools = require ('../tools');
module.exports = {
	name: 'bus',
	description: 'Take the bus to town. If you\'re already on the bus, go back instead.',
	channels: ['lobby', 'dmchannel', 'bus'],
	cooldown: 40,
	disabled: true,
	execute(message, args, client)
	{
		if (message.channel.id === client.channelDictionary['bus'])
		{
			return tools.move(message, 'lobby', client);
		}

		tools.move(message, client, 'bus');

		message.channel.send(`${message.author.username} is taking the bus to town.`);

	},
};
