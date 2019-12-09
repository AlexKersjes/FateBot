const tools = require ('../../tools');
module.exports = {
	name: 'move',
	description: 'Allows a player to move from one place to another.',
	cooldown: 40,
	channels: [],
	// TODO limit move command only to proper channels
	disabled: true,
	aliases: ['go', 'goto'],
	visibleReject: true,
	execute(message, args, client)
	{
		if(message.member.hasPermission('ADMINISTRATOR'))
		{

			const target = message.mentions.members.first();
			tools.move(message, client, args[0], target);
			return message.channel.send(`${target} was moved to ${args[0]}.`);

		}

		if (!this.channels.includes(args[0]))
		{
			return message.react('❔');
			// Remember that to successfully move to a location it has to be in the channels property.
		}


		tools.move(message, client, args[0]);
		message.channel.send(`${message.member.displayName} moved to ${args[0]}.`);
		return message.delete();
	},
};