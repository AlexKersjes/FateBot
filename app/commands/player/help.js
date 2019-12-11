module.exports = {
	name: 'help',
	description: 'Shows description and shorthands/aliases for a specific public command.',
	execute(message, args, client)
	{
		if(!args[0])
		{
			return client.commands.get('commands').execute(message, args, client);
		}
		const command = client.commands.get(args[0]) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));
		if(command && !command.admin)
		{
			let aliases = '';
			command.aliases.forEach(alias =>
			{
				aliases += `'${alias}' `;
			});
			return message.channel.send(`'${command.name}' ${aliases}: ${command.description}`);
		}
	},
};