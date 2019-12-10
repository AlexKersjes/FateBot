module.exports = {
	name: 'unlock',
	description: 'Allows access with the move command.',
	admin: true,
	disabled: true,
	execute(message, args, client)
	{
		client.commands.get('move').channels.push(args[0]);
		return message.channel.send(`Unlocked ${args[0]}`);
	},
};