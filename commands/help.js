module.exports = {
	name: 'help',
	args: true,
	execute(message, args, client)
	{
		const command = client.commands.get(args[0]);
		if(command && !command.admin)
		{
			return message.channel.send(command.description);
		}
	},
};