const tools = require('../../tools.js');
module.exports = {
	name: 'charselect',
	description: 'Options for character selection. **icebox** your sheet, or **load** a character by **"**name**"**. Default case will attempt to load a character. e.g. *.select "Alex"*',
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
			if(savedata.NPCs[name].NPC == true && !(message.member.hasPermission('ADMINISTRATOR') || message.author.id == 226766417918296064))
			{
				{ return message.channel.send('You do not have permission to load this character.'); }
			}
			if(tools.retrievecharacter(message, client))
			{ this.icebox(message, client); }
			let id = message.author.id;
			if(message.mentions.users.first() != undefined && (message.member.hasPermission('ADMINISTRATOR') || message.author.id == 226766417918296064))
			{ id = message.mentions.users.first().id; }
			savedata.PCs[id] = savedata.NPCs[name];
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
		{ message.channel.send('Nothing to icebox.'); return; }
		const name = character.Name;
		if(name == 'Unnamed' || name == undefined)
		{
			message.delete();
			message.channel.send(`${character.Name} could not be iceboxed, to icebox a name is required .`);
			return;
		}
		if(savedata.NPCs[name])
		{ throw console.error('Character with that name already in icebox, rename to stash.'); }
		savedata.NPCs[name] = character;
		message.channel.send(`Iceboxed ${name}.`);
		delete savedata.PCs[tools.findbyvalue(savedata.PCs, character)];
		return savedata.NPCs[name];
	},
};