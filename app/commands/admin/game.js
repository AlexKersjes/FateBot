const fs = require('fs');
module.exports = {
	name: 'game',
	description: 'Modifies json file where game data is stored. Commands are ls, save, load.',
	admin: true,
	args: true,
	aliases: ['save', 'savedata'],
	execute(message, args, client)
	{
		if (!client.currentgame[message.guild.id])
		{ client.currentgame[message.guild.id] = {}; }
		let savedata = client.currentgame[message.guild.id];
		let rawdata;
		switch(args[0])
		{
		case 'ls':
			console.log(savedata);
			message.channel.send('Check console.');
			break;
		case 'save' :
			save(message, savedata);
			break;
		case 'load':
			let filename;
			if(savedata)
			{
				filename = savedata.GameName;
			}
			if (args[1])
			{
				filename = args[1];
			}
			if (!filename)
			{
				return message.channel.send('No file found.');
			}
			try
			{
				rawdata = fs.readFileSync(`app/data/${filename}game.json`);
			}
			catch
			{
				return message.channel.send('Save File could not be found.');
			}
			const temp = JSON.parse(rawdata);
			if (message.guild.id != temp.GuildId)
			{ throw console.error('This game is played on another server.'); }
			client.currentgame[message.guild.id] = temp;
			savedata = client.currentgame[message.guild.id];
			message.channel.send('Game loaded!');
			this.execute(message, ['autosave', savedata.saveTimer], client);
			//
			break;
		case 'start':
			if (!args[1])
			{
				return message.channel.send('Provide a game name.');
			}
			savedata.starttime = Date.now();
			savedata.GameName = args[1];
			savedata.GuildId = message.guild.id;
			savedata.saveTimer = 5;
			savedata.PCs = {};
			savedata.NPCs = {};
			rawdata = JSON.stringify(savedata);
			fs.writeFileSync(`app/data/${savedata.GameName}game.json`, rawdata);
			// TODO prevent overwrite griefing
			message.channel.send('The game has started.');
			break;
		case 'autosave' :
			if(args[1] == 'stop')
			{
				message.channel.send('Stopping autosaver.');
				return clearInterval(savedata.autosave);
			}
			if (!isNaN(parseInt(args[1])))
			{
				if (savedata.autosave)
				{ clearInterval(savedata.autosave); }
				savedata.autosave = autosave(message, savedata, parseInt(args[1]));
				savedata.saveTimer = parseInt(args[1]);
				message.channel.send(`Autosave started with ${args[1]} minute interval.`);
			}
			else
			{
				message.channel.send('Syntax error');
			}
			break;
		}

	},
};
function save(message, savedata)
{
	delete savedata.autosave;
	const rawdata = JSON.stringify(savedata);
	fs.writeFileSync(`app/data/${savedata.GameName}game.json`, rawdata);
	message.channel.send('Game saved!');
}
function autosave(message, savedata, minutes)
{
	return setInterval(() =>
	{
		save(message, savedata);
	}, minutes * 60 * 1000);
}