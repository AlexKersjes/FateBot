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
		fetched = message.channel.fetchMessages({ limit: 100 })
			.then(unfiltered =>
			{
				const notPinned = unfiltered.filter(fetchedMsg => !fetchedMsg.pinned);

				message.channel.bulkDelete(notPinned, true);
			});
	}
	while(fetched.size >= 2);
	message.channel.send('SKREE!');
	return;
}