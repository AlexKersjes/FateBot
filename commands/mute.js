module.exports = {
	name: 'mute',
	description: 'Denies speaking permissions.',
	admin: true,
	execute(message, args, client)
	{
		const channel = message.mentions.channels.first() || message.channel;
		channel
			.overwritePermissions(message.mentions.members.first(), {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: false,

			});
		channel.send('Shh.');
	},
};