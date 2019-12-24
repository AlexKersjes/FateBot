const tools = require('../../tools.js');
const Discord = require('discord.js');
module.exports = {
	name: 'log',
	description: 'Use this command to log memorable moments.',
	visibleReject: true,
	async execute(message, args, client)
	{
		const savedata = client.currentgame[message.guild.id];
		if (!savedata.Log)
		{ savedata.Log = []; }

		if(!args[0])
		{
			const embed = new Discord.MessageEmbed();
			embed.setTitle(`${message.member.displayName}'s Log:`)
				.setColor(client.guilds.get(message.guild.id).me.displayColor)
				.addField('Log:', logstring());
			return message.channel.send(embed);
		}


		const int = parseInt(args[0]);
		let logmessage;
		await message.channel.messages.fetch(int).then(m => console.log(m)).catch(error => console.log('Error: ' + error.message));
		let logstr = logmessage.cleanContent.length > 80 ? logmessage.cleanContent.slice(80) : logmessage.cleanContent;

		const logargs = { 'spoiler' : args.includes('SPOILER') ? true : false };

		if(args.includes('/me'))
		{
			logstr = `<@${message.author.id}> *${message.cleanContent.split('/me ')[1]}*`;
			const newmessage = await message.channel.send(logstr);
		}
		else if(message.cleanContent.split('"')[1])
		{
			logstr = message.cleanContent.split('"')[1];
		}


		args.forEach(element =>
		{
			if(element.startsWith('https://discordapp.com/channels)')) { logargs.url = element; }
		});

		tools.log(savedata, logmessage ? logmessage.author.id : message.author.id, logstr, logargs);
		return;
	},


};

function logstring(savedata, userid, spoiler)
{
	let copylog = JSON.parse(JSON.stringify(savedata.Log));
	if (spoiler)
	{
		copylog = copylog.filter(entry => !entry.spoiler);
	}
}
