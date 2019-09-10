module.exports = {
	name: 'channel',
	description: 'modifies json file where channel ids are stored',
	admin: true,
	args: true,
	execute(message, args, client)
	{
		switch(args[0])
		{
		case 'ls':

			let newstring = 'The channels available to this client are:\n';

			for (const channel of client.channels)
			{
				newstring += channel[1].name + ', ' + channel[0] + ', <#' + channel[0] + '>\n';
			}
			message.channel.send(newstring);
			break;
		case 'register':
			break;
		}

	},
};