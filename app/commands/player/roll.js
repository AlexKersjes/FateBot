module.exports = {
	name: 'roll',
	description: 'Roll dice. syntax: .roll modifier approach. modifier and approach are optional.',
	visibleReject: true,
	execute(message, args, client)
	{
		if(!client.currentgame.GameName)
		{ return message.channel.send('Game is not loaded'); }
		let modifier = 0;
		let approachstr = '';
		modifier = args[0] ? parseInt(args[0]) : 0;
		let approachmodifier = 0;
		try
		{
			if (isNaN(modifier))
			{
				const approachCapitalized = args[0].charAt(0).toUpperCase() + args[0].slice(1);
				modifier = 0;
				approachmodifier = findApproach(message, approachCapitalized, client);
				approachstr = ` using **${approachCapitalized}**,` ;
			}
			else if(args[1])
			{
				const approachCapitalized = args[1].charAt(0).toUpperCase() + args[1].slice(1);
				approachmodifier = findApproach(message, approachCapitalized, client);
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
				string += '<:minuskey:653966380319899669> ';
				total -= 1;
				break;
			case 1 :
				string += '<:voidkey:653966403363274792> ';
				break;
			case 2:
				string += '<:pluskey:653966438704480256> ';
				total += 1;
				break;
			}
		}
		total += approachmodifier + modifier;
		let modifierstr = '';
		modifierstr = approachmodifier == 0 && modifier == 0 ? '' : approachmodifier == 0 ? ` with a modifier of ${modifier},` : modifier == 0 ? ` with a modifier of ${approachmodifier},` : ` with a modifier of ${approachmodifier} + ${modifier},`;
		message.channel.send(`${string}:${approachstr}${modifierstr}\n${message.author} rolled **[ ${total} ]** .`);
		return message.delete();
	},
};

function findApproach(message, approach, client)
{
	const character = client.currentgame.PCs[message.author.id];

	const modifier = character.Approaches[approach];
	if (modifier == undefined)
	{ throw new console.error('Approach not found'); }
	return modifier;
}