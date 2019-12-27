const tools = require('../../tools.js');
module.exports = {
	name: 'charselect',
	description: 'Options for character selection. **icebox** your sheet, or **load** a character by **"**name**"**',
	visibleReject: true,
	args: true,
	aliases: ['characterselect', 'select'],
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
		default :
			if(!name)
			{ return message.channel.send('Please provide a name.'); }
			if(!savedata.NPCs[name])
			{ return message.channel.send(`Can't find ${name}.`); }
			if(savedata.NPCs[name].NPC == true && !message.member.hasPermission('ADMINISTRATOR'))
			{ return message.channel.send('You do not have permission to load this character.'); }
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
		const savedata = client.currentgame[message.guild.id];
		const character = tools.retrievecharacter(message, client);

		if(!character)
		{ return message.channel.send('Nothing to icebox.'); }
		const name = character.Name;
		if(name == 'Unnamed' || name == undefined)
		{
			message.delete();
			return message.channel.send(`${character.Name} could not be iceboxed, to icebox a name is required .`);
		}
		if(savedata.NPCs[name])
		{ throw console.error('Character with that name already in icebox, rename to stash.'); }
		savedata.NPCs[name] = character;
		message.channel.send(`Iceboxed ${name}.`);
		delete savedata.PCs[tools.findbyvalue(savedata.PCs, character)];
		return savedata.NPCs[name];
	},
};