module.exports = {
	move: function(message, client, channelName, member)
	{
		member = member || message.author;
		message.channel.permissionOverwrites.get(member.id).delete();
		client.channels.get(client.channelDictionary[channelName])
			.overwritePermissions(member, {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: true,
			});
	},
};