const Discord = require('discord.js');
const fs = require('fs');
module.exports = {
	name: 'wipe',
	description: 'Wipe a channel (.wipe) or a specific amount of messages (.wipe x).',
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

			if(args[0] === 'save')
			{
				client.save.corpse = 0;
				client.save.corpse2 = 0;
				client.save.knifetaken = null;
				const savedata = JSON.stringify(client.save);
				fs.writeFileSync('app/data/savedata.json', savedata);
				message.channel.send('Save data was wiped.');
				return;
			}

			let fetched;
			if(args[0])
			{
				fetched = message.channel.fetchMessages({ limit: args[0] })
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