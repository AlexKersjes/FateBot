module.exports = {
	name: 'unmute',
	description: 'regrants speaking permissions',
	admin: true,
	execute(message, args, client)
	{
		message.mentions.channels.first()
			.overwritePermissions(message.mentions.members.first(), {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: true,
			// READ_MESSAGE_HISTORY: true,
			});

	},
};