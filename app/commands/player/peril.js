const sheet = require('./sheet.js');
module.exports = {
	name: 'peril',
	description: 'Adjust In Peril with + or - or an integer.',
	args: true,
	visibleReject: true,
	execute(message, args, client)
	{
		let character;
		let int = parseInt(args[0]);
		try
		{
			character = client.currentgame[message.guild.id].PCs[message.author.id];
			if (!character)
			{
				throw new console.error('No character found.');
			}
		}
		catch
		{
			return message.channel.send('No character found.');
		}

		message.delete();

		if(args[0] == '+')
		{ int = 1; }
		if(args[0] == '-')
		{ int = -1; }

		if (!isNaN(int))
		{
			if(character['In Peril'].Current + int > character['In Peril'].Maximum)
			{
				const overflow = character['In Peril'].Current + int - character['In Peril'].Maximum;
				message.channel.send(`${message.author}'s In Peril exceeded the maximum.`);
				return character['In Peril'].Current = character['In Peril'].Maximum;
			}
			else if (character['In Peril'].Current + int < 0)
			{
				message.channel.send(`${message.author} is no longer In Peril`);
				return character['In Peril'].Current = 0;
			}
			else
			{
				character['In Peril'].Current += int;
				if (character['In Peril'].Current == 0)
				{
					message.channel.send(`${message.author} is no longer In Peril`);
				}
				else if (character['In Peril'].Current == character['In Peril'].Maximum)
				{
					message.channel.send(`${message.author} is In Peril`);
				}
				else
				{
					message.channel.send(`${message.author}'s In Peril adjusted to ${character['In Peril'].Current}.`);
				}
				return;
			}
		}
		return message.channel.send('Syntax error.');
	},
};