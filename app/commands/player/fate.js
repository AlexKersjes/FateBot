const tools = require('../../tools.js');
module.exports = {
	name: 'fate',
	description: 'Adjust Fate points with + or - or an integer.',
	visibleReject: true,
	execute(message, args, client)
	{
		const character = tools.retrievecharacter(message, client);
		let int = parseInt(args[0]);

		if(!character.Fate)
		{ character.Fate = { 'Current': 3, 'Refresh': 3 }; }
		message.delete();

		if(!args[0])
		{ return message.channel.send(`Current Fate points: ${character.Fate.Current} (${character.Fate.Refresh}).`); }
		if(args[0] == '+')
		{ int = 1; }
		if(args[0] == '-')
		{ int = -1; }

		if (!isNaN(int))
		{
			if(args[1] == 'refresh')
			{
				character.Fate.Refresh = int;
				return message.channel.send(`Refresh set to ${int}.`);
			}

			if (character.Fate.Current + int < 0)
			{
				return message.channel.send(`${message.author} cannot pay that many Fate points.`);
			}
			else
			{
				character.Fate.Current += int;
				message.channel.send(`${int > -1 ? 'Gaining' : 'Spending'} ${int < 0 ? int * -1 : int} Fate point${ int * int > 1 ? 's' : ''}, ${message.author} now has ${character.Fate.Current} Fate points.`);
				return;
			}
		}
		return message.channel.send('Syntax error.');
	},
};