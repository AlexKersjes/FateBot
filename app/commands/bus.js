const tools = require ('../tools');
module.exports = {
	name: 'bus',
	description: 'Take the bus to town. If you\'re already on the bus, go back instead.',
	channels: ['lobby', 'dmchannel', 'bus'],
	cooldown: 40,
	visibleReject: true,
	disabled: false,
	execute(message, args, client)
	{
		if (message.channel.id === client.channelDictionary['bus'])
		{
			return tools.move(message, client, 'lobby');
		}

		tools.move(message, client, 'bus');

		tools.setCooldown(client, 'proceed', message.author, 7200);

		// console.log(client.cooldowns);
		message.channel.send(`${message.author.username} is taking the bus to town.`);
		return message.delete();
	},
};
