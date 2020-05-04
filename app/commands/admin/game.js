const fs = require('fs');
const Discord = require('discord.js');
module.exports = {
	name: 'game',
	description: 'Modifies json file where game data is stored. Commands are ls, save, load.',
	admin: true,
	args: true,
	aliases: ['save', 'savedata'],
	async execute(message, args, client)
	{
		if (!client.currentgame[message.guild.id])
		{ client.currentgame[message.guild.id] = {}; }
		const savedata = client.currentgame[message.guild.id];
		let rawdata;
		switch(args[0])
		{
		case 'ls':
			console.log(savedata);
			message.channel.send('Check console.');
			break;
		case 'save' :
			save(message, savedata);
			message.channel.send('Game saved!');
			break;
		case 'load':
			let filename;
			if(savedata != undefined)
			{
				filename = savedata.GameName;
			}
			if (args[1])
			{
				filename = args[1];
			}
			if (!filename)
			{
				return message.channel.send('No filename input found.');
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
			if (temp.password != undefined)
			{
				passwordedload(message, client, filename, temp);
			}
			else
			{
				load(message, client, filename, temp);
			}
			break;
		case 'start':
			if (!args[1])
			{
				return message.channel.send('Provide a game name.');
			}
			if(fs.existsSync(`app/data/${savedata.GameName}game.json`))
			{
				return message.channel.send('That game already exists.');
				// TODO allow overwrites if you have the password
			}
			const newgame = {};
			newgame.starttime = Date.now();
			newgame.GameName = args[1];
			newgame.GuildId = message.guild.id;
			newgame.saveTimer = 5;
			newgame.PCs = {};
			newgame.NPCs = {};
			newgame.Log = [];
			rawdata = JSON.stringify(newgame);
			client.currentgame[message.guild.id] = newgame;
			fs.writeFileSync(`app/data/${newgame.GameName}game.json`, rawdata);
			message.channel.send('The game has started. Protecting your game with a password is highly recommended to stop unwanted access and prevent abuse.');
			break;
		case 'autosave' :
			if(args[1] == 'stop')
			{
				message.channel.send('Stopping autosaver.');
				delete savedata.saveTimer;
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
		case 'password':
			passwordset(message, client, savedata);
			break;
		}

	},
};
function save(message, savedata)
{
	const temp = savedata.autosave;
	delete savedata.autosave;
	const rawdata = JSON.stringify(savedata);
	fs.writeFileSync(`app/data/${savedata.GameName}game.json`, rawdata);
	savedata.autosave = temp;
}
function load(message, client, gamename, gamedata)
{
	client.currentgame[message.guild.id] = gamedata;
	const savedata = client.currentgame[message.guild.id];
	message.channel.send('Game loaded!');
	setdefaultload(message, client, gamename);
	if(savedata.saveTimer)
	{
		if (savedata.autosave)
		{ clearInterval(savedata.autosave); }
		savedata.autosave = autosave(message, savedata, parseInt(savedata.saveTimer));
		message.channel.send(`Autosave started with ${savedata.saveTimer} minute interval.`);
	}
}
function autosave(message, savedata, minutes)
{
	return setInterval(() =>
	{
		save(message, savedata);
	}, minutes * 60 * 1000);
}
function setdefaultload(message, client, name)
{
	for(const k in client.defaultload)
	{
		if(client.defaultload[k] === name)
		{
			delete client.defaultload[k];
		}
	}
	client.defaultload[message.guild.id] = name;
	const rawdata = JSON.stringify(client.defaultload);
	fs.writeFileSync('app/data/defaultgames.json', rawdata);
}
async function passwordedload(message, client, gamename, gamedata)
{
	let channel;
	try
	{
		channel = await message.author.createDM();
	}
	catch (error)
	{
		message.channel.send('Error confirming the password.');
		return console.log(error);
	}
	channel.send('This game is password protected. Please enter the password:');
	const collector = new Discord.MessageCollector(channel, m =>
	{
		if(m.author != client.user)
		{ return true; }
		else{ return false;}
	},
	{ time : 30000, max : 1 });
	collector.on('collect', m =>
	{
		if (m.content === gamedata.password)
		{
			channel.send('The game will now be loaded.');
			load(message, client, gamename, gamedata);
		}
		else
		{
			channel.send('That is not the correct password. The game will not be loaded.');
			message.channel.send('Game not loaded.');
		}
	},
	);
}
async function passwordset(message, client, gamedata)
{
	// TODO
	let channel;
	try
	{
		channel = await message.author.createDM();
	}
	catch (error)
	{
		message.channel.send('Error confirming the password.');
		return console.log(error);
	}
	if(gamedata.password)
	{
		channel.send('Please enter the password:');
		const collector = new Discord.MessageCollector(channel, m =>
		{
			if(m.author != client.user)
			{ return true; }
			else{ return false;}
		},
		{ time : 30000, max : 1 });
		collector.on('collect', m =>
		{
			if (m.content === gamedata.password)
			{
				channel.send('Please enter the new password.');
				const collector2 = new Discord.MessageCollector(channel, m2 =>
				{
					if(m2.author != client.user)
					{ return true; }
					else{ return false;}
				},
				{ time : 30000, max : 1 });
				collector2.on('collect', m2 =>
				{
					gamedata.password = m2.content;
					channel.send('Password set. Please keep it secure.');
					save(message, gamedata);
					message.channel.send('Password changed.');
				},

				);
			}
			else
			{
				channel.send('That is not the correct password.');
				return;
			}
		},
		);
	}


}