const fs = require('fs');
module.exports = {
	name: 'channel',
	description: 'Modifies json file where channel ids are stored. Commands are ls, lsall, register, deregister, save, load.',
	admin: true,
	args: true,
	aliases: ['channels'],
	execute(message, args, client)
	{
		let newstring;
		let savedata;
		switch(args[0])
		{
		case 'ls':
			newstring = 'Registered channels: \n';
			for(const p in client.channelDictionary)
			{
				newstring += `${p} : <#${client.channelDictionary[p]}>\n`;
			}
			message.channel.send(newstring);
			break;
		case 'lsall':
			newstring = 'The channels available to this client are:\n';
			for (const channel of client.channels)
			{
				newstring += `${channel[1].name}, <#${channel[0]}>, ${channel[0]}\n`;
			}
			message.channel.send(newstring);
			break;
		case 'register':
			client.channelDictionary[args[1]] = message.channel.id;
			message.channel.send(`<#${message.channel.id}> was registered as ${args[1]}`);
			console.log(client.channelDictionary);
			break;
		case 'deregister':
			if(args[1] === 'all')
			{
				for(const channel in client.channelDictionary)
				{
					delete client.channelDictionary[channel];
				}
				return message.channel.send('All channels deregistered');
			}
			delete client.channelDictionary[args[1]];
			message.channel.send(`${args[1]} deregistered`);
			break;
		case 'save' :
			const data = JSON.stringify(client.channelDictionary);
			fs.writeFileSync('app/data/channelId.json', data);
			message.channel.send('Channels saved!');
			break;
		case 'load':
			const rawdata = fs.readFileSync('app/data/channelId.json');
			client.channelDictionary = JSON.parse(rawdata);
			console.log(client.channelDictionary);
			message.channel.send('Channels loaded!');
			break;
		case 'murder':
			if(client.save.corpse)
			{
				client.save.corpse2 = true;
				console.log(client.save);
				savedata = JSON.stringify(client.save);
				fs.writeFileSync('app/data/savedata.json', savedata);
				message.channel.send('A second murder occurred.');
				return;
			}
			client.save.corpse = true;
			console.log(client.save);
			savedata = JSON.stringify(client.save);
			fs.writeFileSync('app/data/savedata.json', savedata);
			message.channel.send('A murder occurred.');
			break;
		case 'start':
			client.save.starttime = Date.now();
			savedata = JSON.stringify(client.save);
			fs.writeFileSync('app/data/savedata.json', savedata);
			message.channel.send('The game has started.');
			break;
		}

	},
};