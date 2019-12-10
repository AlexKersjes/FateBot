module.exports = {
	name: 'intercom',
	description: 'A creacky intercom. Leave a message, responsibly.',
	channels: ['lobby', 'dmchannel'],
	cooldown: 120,
	disabled: true,
	args: true,
	visibleReject: true,
	execute(message, args, client)
	{
		const responses = ['\'s voice sounds over the intercom :', '\'s voice creaks on the intercom :',
			' can be heard on the intercom, saying', ' is on the intercom.'];
		let newstring = `*<@${message.member.id}>${responses[Math.floor(Math.random() * responses.length)]}*\n`;
		newstring += `"${message.cleanContent.split('.intercom ')[1]}"`;

		for (const channel of client.channels)
		{
			if (client.channelDictionary['intercom'] == channel[0])
			{
				return channel[1].send(newstring);
			}
		}

		throw new console.error('No intercom was found');
	},
};