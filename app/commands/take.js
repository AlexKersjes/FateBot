const fs = require('fs');
module.exports = {
	name: 'take',
	description: 'Take something, anything.',
	channels: ['kitchen'],
	visibleReject: true,
	execute(message, args, client)
	{
		if (client.save.knifetaken)
		{
			return message.react('❌');
		}

		client.save.knifetaken = message.author.id;
		const savedata = JSON.stringify(client.save);
		fs.writeFileSync('app/data/savedata.json', savedata);
		message.author.send('You took the knife.');
		client.channels.get(client.channelDictionary['dmchannel']).send(`${message.author} took the knife.`);
	},
};