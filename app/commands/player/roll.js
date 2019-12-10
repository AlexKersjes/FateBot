module.exports = {
	name: 'roll',
	description: 'Roll dice.',
	visibleReject: true,
	execute(message, args, client)
	{
		if(!client.currentgame.GameName)
		{ return message.channel.send('Game is not loaded'); }
		let modifier = 0;
		let approachstr = '';
		modifier = args[0] ? parseInt(args[0]) : 0;
		try
		{
			if (isNaN(modifier))
			{
				const approachCapitalized = args[0].charAt(0).toUpperCase() + args[0].slice(1);
				modifier = 0;
				modifier += findApproach(message, approachCapitalized, client);
				approachstr = ` using **${approachCapitalized}**,` ;
			}
			else if(args[1])
			{
				const approachCapitalized = args[1].charAt(0).toUpperCase() + args[1].slice(1);
				modifier += findApproach(message, approachCapitalized, client);
				approachstr = ` using **${approachCapitalized}**,`;
			}
		}
		catch
		{
			return message.channel.send('Approach not found.');
		}
		let string = '';
		let total = 0;
		for(let i = 0; i < 4; i++)
		{
			const roll = Math.floor(3 * Math.random());
			switch (roll)
			{
			case 0:
				string += '-';
				total -= 1;
				break;
			case 1 :
				string += '0';
				break;
			case 2:
				string += '+';
				total += 1;
				break;
			}
		}
		total += modifier;
		message.channel.send(`${string}:${approachstr} with a modifier of ${modifier}, ${message.member.displayName} rolled **${total}**.`);
		return message.delete();
	},
};

function findApproach(message, approach, client)
{
	const character = client.currentgame.PCs[message.author.id];
	console.log(character.Approaches);

	const modifier = character.Approaches[approach];
	if (modifier == undefined)
	{ throw new console.error('Approach not found'); }
	return modifier;
}