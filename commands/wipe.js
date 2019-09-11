module.exports = {
	name: 'wipe',
	description: 'wipe a channel',
	admin: 'true',
	execute(message, args, client)
	{
		wipe(message);
	},
};

async function wipe(message)
{
	let fetched;
	do
	{
		fetched = await message.channel.fetchMessages({ limit: 100 });
		message.channel.bulkDelete(fetched);
	}
	while(fetched.size >= 2);
	message.channel.send('SKREE!');
	return;
}