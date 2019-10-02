module.exports = {
	name: 'announce',
	description: 'The crow speaks. .announce <channel mention> <markup eg. \\*\\* >(optional) /<your message> ',
	admin: 'true',
	execute(message, args, client)
	{
		let markup = args[1];
		if(!args[2].includes('/'))
		{
			if(args[1].charAt(0) == '/')
			{
				markup = '';
			}
			else
			{
				return message.send('Incorrect syntax');
			}
		}
		client.channels.get(message.mentions.channels.first().id).send(`${markup}${message.cleanContent.split('/')[1]}${markup}`);
	},
};