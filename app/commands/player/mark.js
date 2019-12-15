const sheet = require('./sheet.js');
module.exports = {
	name: 'mark',
	description: 'Mark a box. syntax: .mark "trait name" integer. Integer is change in the amount of boxes marked. **WIP**',
	aliases: ['markbox'],
	disabled: true,
	visibleReject: true,
	execute(message, args, client)
	{
		const character = sheet.retrievecharacter(message, client);

		const name = message.cleanContent.split('"')[1];
		const int = isNaN(parseInt(args[1])) ? undefined : parseInt(args[1]);
		return message.channel.send('test');
	},
};