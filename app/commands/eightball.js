const Discord = require('discord.js');
module.exports = {
	name: '8ball',
	description: 'Ping!',
	channels: ['gameroom'],
	args: true,
	execute: async (message, args, client) =>
	{
		if (args[0] == 'help') return message.reply('Usage: ;8ball <question>');

		const replies = ['yes', 'no', 'maybe', 'try again later', 'stop it get some help', 'probably not', 'no u', 'signs point to you are gay', 'probably', 'mostlikely not', 'mostlikely', 'i don\'t know'];
		const result = Math.floor((Math.random() * replies.length));
		const question = args.slice(0).join(' ');

		const ballembed = new Discord.RichEmbed()
			.setAuthor(message.author.tag)
			.setColor('#1401FF')
			.addField('Question', question)
			.addField('Answer', replies[result]);
		message.channel.send(ballembed);
	},
};