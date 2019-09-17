const tools = require ('../tools');
module.exports = {
	name: 'proceed',
	description: 'Continue to either the shops or the convention in Aldburgh.',
	channels: ['bus', 'convention', 'shop'],
	cooldown: 40,
	execute(message, args, client)
	{
		if (message.channel.id === client.channelDictionary['bus'])
		{
			if(args[0] == 'shop')
			{
				tools.move(message, client, 'shop');
				message.channel.send(`${message.member.displayName} went to the shop.`);
				return message.delete();
			}
			if(args[0] == 'convention')
			{
				tools.move(message, client, 'convention');
				message.channel.send(`${message.member.displayName} went to the convention`);
				return message.delete();
			}

			return message.channel.send('No valid target location found.');
		}

		tools.move(message, client, 'bus');

		tools.setCooldown(client, 'bus', message.author, 7200);

		message.channel.send(`${message.member.displayName} returned to the streets.`);
		return message.delete();
	},
};