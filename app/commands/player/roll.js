module.exports = {
	name: 'roll',
	description: 'Roll dice.',
	visibleReject: true,
	execute(message, args, client)
	{
		const modifier = args[0] ? parseInt(args[0]) : 0;
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
		message.channel.send(`${string}: with a modifier of ${modifier}, ${message.author} rolled ${total}.`);
		return message.delete();
	},
};
