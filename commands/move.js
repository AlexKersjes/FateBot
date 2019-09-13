const tools = require ('./tools');
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

			const target = message.mentions.members.first();
			tools.move(message, client, args[0], target);
			return message.channel.send(`${target} was moved to ${args[0]}.`);

		}

		tools.move(message, client, args[0]);
		return message.channel.send(`${message.author.username} moved to ${args[0]}.`);

	},
};