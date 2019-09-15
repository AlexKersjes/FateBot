const Discord = require('discord.js');
module.exports = {
	name: 'wipe',
	description: 'Wipe a channel (.wipe) or a specific amount of messages (.wipe x).',
	admin: 'true',
	execute: async (message, args, client) =>
	{
		{
			if(args[0] === 'cooldowns')
			{
				client.cooldowns = new Discord.Collection();
				message.channel.send('Cooldowns wiped.');
			}

			let fetched;
			if(args[0])
			{
				fetched = message.channel.fetchMessages({ limit: args[0] + 1 })
					.then(unfiltered =>
					{
						const notPinned = unfiltered.filter(fetchedMsg => !fetchedMsg.pinned);

						message.channel.bulkDelete(notPinned, true);
					});
				return;
			}

			do
			{
				fetched = message.channel.fetchMessages({ limit: 100 })
					.then(unfiltered =>
					{
						const notPinned = unfiltered.filter(fetchedMsg => !fetchedMsg.pinned);

						message.channel.bulkDelete(notPinned, true);
					});
			}
			while(fetched.size >= 2);
			message.channel.send('SKREE!');
			return;
		}
	},
};