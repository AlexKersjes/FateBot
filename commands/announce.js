module.exports = {
	name: 'announce',
	description: 'The crow speaks. announce <channel> <markup>(optional) /<your message> ',
	admin: 'true',
	execute(message, args, client)
	{
		let markup = args[1];
		if(args[1].charAt(0) == '/')
		{
			markup = '*';
		}
		client.channels.get(message.mentions.channels.first().id).send(`${markup}${message.cleanContent.split('/')[1]}${markup}`);
	},
};