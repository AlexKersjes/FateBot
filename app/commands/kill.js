const fs = require('fs');
module.exports = {
	name: 'kill',
	aliases: ['stab', 'murder'],
	description: 'Take a life.',
	channels: ['kitchen', 'garden', 'library', 'roof'],
	visibleReject: true,
	execute(message, args, client)
	{
		if (client.save.knifetaken != message.author.id)
		{
			return message.react('❌');
		}

		message.channel
			.overwritePermissions(message.mentions.members.first(), {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: false,

			}).then(message.channel.send(`You stabbed ${message.mentions.members.first()}.`));

		client.commands.get('disable').execute(message, ['kill'], client);
	},
};