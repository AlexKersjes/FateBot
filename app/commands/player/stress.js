const sheet = require('./character.js');
module.exports = {
	name: 'stress',
	description: 'Adjust Stress with + or - or an integer.',
	args: true,
	visibleReject: true,
	execute(message, args, client)
	{
		let character;
		let int = parseInt(args[0]);
		try
		{
			character = client.currentgame.PCs[message.author.id];
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
			if(character['Stress'].Current + int > character['Stress'].Maximum)
			{
				const overflow = character['Stress'].Current + int - character['Stress'].Maximum;
				message.channel.send(`${message.author}'s Stress maximum exceeded by ${overflow}.`);
				return character['Stress'].Current = character['Stress'].Maximum;
			}
			else if (character['Stress'].Current + int < 0)
			{
				message.channel.send(`${message.author}'s Stress reduced to 0.`);
				return character['Stress'].Current = 0;
			}
			else
			{
				character['Stress'].Current += int;
				message.channel.send(`${message.author}'s Stress adjusted to ${character['Stress'].Current}.`);
				return;
			}
		}
		return message.channel.send('Syntax error.');
	},
};