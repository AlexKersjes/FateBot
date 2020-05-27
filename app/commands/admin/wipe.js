const Discord = require('discord.js');
const fs = require('fs');
module.exports = {
	name: 'wipe',
	description: 'Wipe a channel or a specific amount of messages.',
	admin: 'true',
	execute(message, args, client)
	{
		{
			if(args[0] === 'cooldowns')
			{
				client.cooldowns = new Discord.Collection();
				message.channel.send('Cooldowns wiped.');
				return;
			}

			let fetched;
			if(args[0])
			{
				fetched = message.channel.messages.fetch({ limit: args[0] })
					.then(unfiltered =>
					{
						const notPinned = unfiltered.filter(fetchedMsg => !fetchedMsg.pinned);
						message.channel.bulkDelete(notPinned, true);
					});
				return;
			}

			do
			{
				fetched = message.channel.messages.fetch({ limit: 100 })
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