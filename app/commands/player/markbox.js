const sheet = require('./character.js');
module.exports = {
	name: 'mark',
	description: 'Mark a box. syntax: .mark "trait name" integer. Integer is change in the amount of boxes marked. **WIP**',
	aliases: ['markbox'],
	disabled: true,
	args: true,
	visibleReject: true,
	execute(message, args, client)
	{
		let character;
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

		const name = message.cleanContent.split('"')[1];
		const int = isNaN(parseInt(args[1])) ? undefined : parseInt(args[1]);

		sheet.findbymarkerrecursive(character, 'Boxes');

	},
};