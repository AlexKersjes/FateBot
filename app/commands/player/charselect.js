module.exports = {
	name: 'charselect',
	description: 'Options for character selection. **icebox** your sheet, or **load** a character by **"**name**"**',
	visibleReject: true,
	aliases: ['characterselect'],
	execute(message, args, client)
	{
		const savedata = client.currentgame[message.guild.id];
		let character;
		try
		{
			character = savedata.PCs[message.author.id];
			if (!character)
			{
				throw new console.error('No character found.');
			}
		}
		catch
		{
			return message.channel.send('No character found. You can create a new one with .sheet.');
		}

		switch (args[0])
		{
		case 'icebox':
			if(character.Name == 'Unnamed')
			{ message.delete(); return message.channel.send('Name character to icebox.'); }
			savedata.NPCs[character.name] = character;
			delete savedata.PCs[message.author.id];
			message.channel.send(`Iceboxed ${character.name}`);
			break;
		case 'load':
			break;
		}
	},
};