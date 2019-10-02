module.exports = {
	name: 'lock',
	description: 'Denies access with the move command.',
	admin: true,
	execute(message, args, client)
	{
		const locations = client.commands.get('move').channels;
		for(let i = 0; i < locations.length; i++)
		{
			if (locations[i] === args[0])
			{
				locations.splice(i, 1);
			}
		}
		client.commands.get('move').locations = locations;
		return message.channel.send(`Locked ${args[0]}`);
	},
};