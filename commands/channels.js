const fs = require('fs');
module.exports = {
	name: 'channel',
	description: 'Modifies json file where channel ids are stored. Commands are ls, lsall, register, deregister, save, load.',
	admin: true,
	args: true,
	execute(message, args, client)
	{
		let newstring;
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
			delete client.channelDictionary[args[1]];
			message.channel.send(`${args[1]} deregistered`);
			break;
		case 'save' :
			const data = JSON.stringify(client.channelDictionary);
			fs.writeFileSync('./channelId.json', data);
			message.channel.send('Channels saved!');
			break;
		case 'load':
			const rawdata = fs.readFileSync('channelId.json');
			client.channelDictionary = JSON.parse(rawdata);
			console.log(client.channelDictionary);
			break;
		}

	},
};