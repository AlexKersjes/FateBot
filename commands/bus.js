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
			return move(message, 'lobby', client);
		}

		move(message, 'bus', client);

		message.channel.send(`${message.author.username} is taking the bus to town.`);

	},
};

function move(message, target, client)
{
	message.channel.permissionOverwrites.get(message.author.id).delete();
	client.channels.get(client.channelDictionary[target])
		.overwritePermissions(message.author, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true,
			// READ_MESSAGE_HISTORY: true,
		});
}
