module.exports = {
	name: 'list',
	description: 'a simple list',
	channels: ['lobby'],
	execute(message, args, client)
	{
		let newstring = '*You find these channels on the list:* \n';
		for(const p in client.channelDictionary)
		{
			if (client.commands.get('move').channels.includes(p))
			{
				newstring += `<#${client.channelDictionary[p]}> : ${p}\n`;
			}
		}
		message.channel.send(newstring);
	},
};