module.exports = {
	name: 'checkin',
	description: 'Checks a player in to their private room.',
	admin: true,
	disabled: true,
	execute(message, args, client)
	{
		checkin(message, args, client);
	},
};

async function checkin(message, args, client)
{
	// todo :  put descriptions in a seperate file
	const descriptions = ['A plain room with a soft bed. You feel comfortable', 'A bright room perfumed with a floral scent. Your senses sharpen.',
		'A dim room. A record player stands in the corner. You relax.', 'A large room. You feel alone, but at ease.', 'A safe room. A bed. A lamp stands in the corner.',
		'A normal room. The floor seems oddly askew. You feel eerie.', 'When you enter the room, a light flickers. Looking around everything seems perfectly ordinary, yet you feel nervous.'];

	let description = descriptions[Math.floor(Math.random() * descriptions.length)];
	description += '\n\n*Here you may rest, and collect your thoughts. Perhaps keep a notebook, if you feel so inclined.*';


	const { privateChannelCategory } = require('../../data/config.json');
	const channel = await message.guild.createChannel(args[0], { type: 'text', topic: description, parent: `${privateChannelCategory}` });

	for (const member of message.mentions.members)
	{
		channel.overwritePermissions(member[1], {
			VIEW_CHANNEL: true,
		});
	}
	return channel.send('You were checked in.');
}