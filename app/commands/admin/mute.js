module.exports = {
	name: 'mute',
	description: 'Denies speaking permissions in current or mentioned channel. Use with user mention.',
	admin: true,
	execute(message, args, client)
	{
		const channel = message.mentions.channels.first() || message.channel;
		if(!message.mentions.members.first()) { channel.message.send('No member specified.'); }
		channel
			.overwritePermissions(message.mentions.members.first(), {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: false,

			}).then(channel.send('Shh.'));
		message.delete();
	},
};