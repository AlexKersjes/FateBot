module.exports = {
	name: 'mute',
	description: 'denies speaking permissions',
	admin: true,
	execute(message, args, client)
	{
		message.mentions.channels.first()
			.overwritePermissions(message.mentions.members.first(), {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: false,
			// READ_MESSAGE_HISTORY: true,
			});

	},
};