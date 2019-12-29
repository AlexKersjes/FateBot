module.exports = {
	name: 'charlist',
	description: 'Display a list of all characters in this save.',
	admin: 'true',
	execute(message, args, client)
	{
		if(!client.currentgame[message.guild.id])
		{ return message.channel.send('Game is not loaded'); }
		const savedata = client.currentgame[message.guild.id];
		let str = '';
		str += 'PCs:\n';
		Object.keys(savedata.PCs).forEach(key => {str += `   ${savedata.PCs[key].Name}\n`;});
		str += 'NPCs:\n';
		Object.keys(savedata.NPCs).forEach(key => {str += `   ${savedata.NPCs[key].Name}\n`;});
		if(savedata.Shortlist)
		{
			str += 'Shortlist:\n';
			Object.keys(savedata.Shortlist).forEach(key => {str += `   ${savedata.Shortlist[key].Name}\n`;});
		}

		return message.channel.send(str);
	},
};