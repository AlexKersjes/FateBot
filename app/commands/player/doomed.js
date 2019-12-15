const sheet = require('./sheet.js');
module.exports = {
	name: 'doomed',
	description: 'Adjust Doomed with + or - or an integer.',
	args: true,
	visibleReject: true,
	execute(message, args, client)
	{
		const character = sheet.retrievecharacter(message, client);
		let int = parseInt(args[0]);

		message.delete();

		if(args[0] == '+')
		{ int = 1; }
		if(args[0] == '-')
		{ int = -1; }

		if (!isNaN(int))
		{
			if(character['Doomed'].Current + int > character['Doomed'].Maximum)
			{
				const overflow = character['Doomed'].Current + int - character['Doomed'].Maximum;
				message.channel.send(`${message.author}'s Doomed exceeded the maximum.`);
				return character['Doomed'].Current = character['Doomed'].Maximum;
			}
			else if (character['Doomed'].Current + int < 0)
			{
				message.channel.send(`${message.author} is no longer Doomed`);
				return character['Doomed'].Current = 0;
			}
			else
			{
				character['Doomed'].Current += int;
				if (character['Doomed'].Current == 0)
				{
					message.channel.send(`${message.author} is no longer Doomed`);
				}
				else if (character['Doomed'].Current == character['Doomed'].Maximum)
				{
					message.channel.send(`${message.author} is Doomed`);
				}
				else
				{
					message.channel.send(`${message.author}'s Doomed adjusted to ${character['Doomed'].Current}.`);
				}
				return;
			}
		}
		return message.channel.send('Syntax error.');
	},
};