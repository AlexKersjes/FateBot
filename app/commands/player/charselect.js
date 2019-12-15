const sheet = require('./sheet.js');
module.exports = {
	name: 'charselect',
	description: 'Options for character selection. **icebox** your sheet, or **load** a character by **"**name**"**',
	visibleReject: true,
	args: true,
	aliases: ['characterselect'],
	execute(message, args, client)
	{
		const savedata = client.currentgame[message.guild.id];
		const name = message.cleanContent.split('"')[1];

		switch (args[0])
		{
		case 'icebox':
			this.icebox(message, client);
			break;
		case 'load':
			if(!name)
			{ return message.channel.send('Please provide a name.'); }
			if(!savedata.NPCs[name])
			{ return message.channel.send(`Can't find ${name}.`); }
			if(savedata.NPCs[name].NPC == true && !message.member.hasPermission('ADMINISTRATOR'))
			{ throw console.error('You do not have permission to load this character.'); }
			this.icebox(message, client);
			savedata.PCs[message.author.id] = savedata.NPCs[name];
			message.channel.send(`Loaded ${name}.`);
			delete savedata.NPCs[name];
			break;
		}
		message.delete();
	},
	icebox : function(message, client)
	{
		let character;
		try{ character = sheet.retrievecharacter(message, client); }
		catch {}
		if(!character)
		{ return message.channel.send('Nothing to icebox.'); }
		if(character.Name == 'Unnamed')
		{
			message.delete();
			return message.channel.send(`${character.Name} can not be iceboxed, to icebox a name is required .`);
		}
		if(client.currentgame[message.guild.id].NPCs[character.Name])
		{ throw console.error('Character with that name already in icebox, rename to stash.'); }
		client.currentgame[message.guild.id].NPCs[character.Name] = character;
		message.channel.send(`Iceboxed ${character.Name}.`);
		delete client.currentgame[message.guild.id].PCs[message.author.id];
	},
};