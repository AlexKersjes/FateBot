module.exports = {
	name: 'bus',
	description: 'Take the bus to town.',
	channels: ['lobby', 'dmchannel', 'bus'],
	cooldown: 60,
	disabled: true,
	execute(message, args, client)
	{
		message.channel.send(`${message.author.username} is taking the bus to town.`);
		message.channel.permissionOverwrites.get(message.author.id).delete();
		client.channels.get('621833585506385920')
			.overwritePermissions(message.author, {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: true,
				// READ_MESSAGE_HISTORY: true,
			});
	},
};