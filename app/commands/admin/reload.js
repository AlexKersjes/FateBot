module.exports =
{
	name: 'reload',
	admin: true,
	execute(message, args, client)
	{
		if(!args || args.length < 1) return message.reply('Must provide a command name to reload.');
		const commandName = args[0];
		// Check if the command exists and is valid
		if(!client.commands.has(commandName))
		{
			return message.reply('That command does not exist');
		}

		let props;
		// the path is relative to the *current folder*, so just ./filename.js
		try
		{
			delete require.cache[require.resolve(`./${commandName}.js`)];
			client.commands.delete(commandName);
			props = require(`./${commandName}.js`);
		}
		catch
		{
			delete require.cache[require.resolve(`../player/${commandName}.js`)];
			client.commands.delete(commandName);
			props = require(`../player/${commandName}.js`);
		}
		// We also need to delete and reload the command from the client.commands Enmap

		client.commands.set(commandName, props);
		message.reply(`The command ${commandName} has been reloaded`);
	},
};