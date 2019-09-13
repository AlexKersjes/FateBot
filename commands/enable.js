module.exports = {
	name: 'enable',
	description: 'enable a command',
	admin: 'true',
	args: true,
	execute(message, args, client)
	{
		client.commands.get(args[0])['disabled'] = false;
		message.channel.send(`enabled ${args[0]}`);
	},
};