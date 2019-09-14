module.exports = {
	name: 'help',
	args: true,
	description: 'Shows description for a specific public command. Public.',
	execute(message, args, client)
	{
		const command = client.commands.get(args[0]);
		if(command && !command.admin)
		{
			return message.channel.send(command.description);
		}
	},
};