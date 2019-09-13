module.exports = {
	name: 'move',
	description: 'Allows a player to move from one place to another.',
	cooldown: 40,
	channels: ['lobby', 'dininghall', 'lounge', 'gameroom', 'garden', 'roof', 'library', 'crimescene'],
	aliases: ['go', 'goto'],
	visibleReject: true,
	execute(message, args, client)
	{
		if (!this.channels.includes(args[0]))
		{
			return message.react('❔');
			// Remember that to successfully move to a location it has to be in the channels property.
		}

		if(message.member.hasPermission('ADMINISTRATOR'))
		{
			for (const channel of client.channels)
			{
				if (client.channelDictionary[args[0]] == channel[0])
				{
					const target = message.mentions.members.first();
					message.channel.send(`${target} was moved to ${args[0]}.`);
					move(message, target, channel);
				}
			}
		}

		for (const channel of client.channels)
		{
			if (client.channelDictionary[args[0]] == channel[0])
			{
				message.channel.send(`${message.author.username} moved to ${args[0]}.`);
				move(message, message.author, channel);
			}
		}

	},
};

function move(message, target, channel)
{
	message.channel.permissionOverwrites.get(target.user.id).delete();

	channel[1]
		.overwritePermissions(target, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true,
			// READ_MESSAGE_HISTORY: true,
		});
	return message.delete();
}