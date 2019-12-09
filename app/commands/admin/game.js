const fs = require('fs');
module.exports = {
	name: 'game',
	description: 'Modifies json file where game data is stored. Commands are ls, save, load.',
	admin: true,
	args: true,
	aliases: ['save', 'savedata'],
	execute(message, args, client)
	{
		const savedata = client.currentgame;
		let rawdata;
		switch(args[0])
		{
		case 'ls':
			console.log(savedata);
			message.channel.send('Check console.');
			break;
		case 'save' :
			rawdata = JSON.stringify(savedata);
			fs.writeFileSync(`app/data/${savedata.GameName}game.json`, rawdata);
			message.channel.send('Game saved!');
			break;
		case 'load':
			let filename;
			if(savedata.GameName)
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
			client.currentgame = JSON.parse(rawdata);
			message.channel.send('Game loaded!');
			break;
		case 'start':
			if (!args[1])
			{
				return message.channel.send('Provide a game name.');
			}
			savedata.starttime = Date.now();
			savedata.GameName = args[1];
			savedata.GuildId = message.guild.id;
			savedata.PCs = {};
			rawdata = JSON.stringify(savedata);
			fs.writeFileSync(`app/data/${savedata.GameName}game.json`, rawdata);
			message.channel.send('The game has started.');
			break;
		}

	},
};