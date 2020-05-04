module.exports = {
	name: 'unmute',
	description: 'Grants speaking permissions in the current or mentioned channel. Use with user mention.',
	admin: true,
	execute(message, args, client)
	{
		const channel = message.mentions.channels.first() || message.channel;
		if(!message.mentions.members.first()) { channel.message.send('No member specified.'); }
		channel
			.overwritePermissions(message.mentions.members.first(), {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: true,
			});
		message.delete();
	},
};