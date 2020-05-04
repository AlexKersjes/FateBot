module.exports = {
	name: 'enable',
	description: 'Enable a command.',
	admin: 'true',
	args: true,
	execute(message, args, client)
	{
		// TODO make enable and disable server-specific, rather than global
		client.commands.get(args[0])['disabled'] = false;
		message.channel.send(`Enabled ${args[0]}.`);
	},
};