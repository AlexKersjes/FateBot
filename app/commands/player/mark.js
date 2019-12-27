const tools = require('../../tools.js');
module.exports = {
	name: 'mark',
	description: 'Mark a box. syntax: .mark "trait name" integer. Integer is change in the amount of boxes marked. **WIP**',
	aliases: ['markbox'],
	visibleReject: true,
	execute(message, args, client)
	{
		const character = tools.retrievecharacter(message, client);

		const name = message.cleanContent.split('"')[1];
		let int = parseInt(args[0]);
		if(args[0] == '+')
		{ int = 1; }
		if(args[0] == '-')
		{ int = -1; }


		const boxcondition = tools.findbymarkerrecursive(character, 'Boxes').filter(c => c[0] == name)[0];

		if (!isNaN(int))
		{
			if(boxcondition[1].Current + int > boxcondition[1].Maximum)
			{
				const overflow = boxcondition[1].Current + int - boxcondition[1].Maximum;
				message.channel.send(`${message.author}'s ${boxcondition[0]} maximum exceeded by ${overflow}.`);
				return boxcondition[1].Current = boxcondition[1].Maximum;
			}
			else if (boxcondition[1].Current + int < 0)
			{
				message.channel.send(`${message.author}'s ${boxcondition[0]} reduced to 0.`);
				return boxcondition[1].Current = 0;
			}
			else
			{
				boxcondition[1].Current += int;
				message.channel.send(`${message.author}'s ${boxcondition[0]} adjusted to ${boxcondition[1].Current}.`);
				return;
			}
		}
		return message.channel.send('Syntax error.');
	},
};