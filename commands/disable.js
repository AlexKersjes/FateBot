module.exports = {
	name: 'disable',
	description: 'Disable a command.',
	admin: 'true',
	args: true,
	execute(message, args, client)
	{
		client.commands.get(args[0])['disabled'] = true;
		message.channel.send(`disabled ${args[0]}`);
	},
};