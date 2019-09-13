module.exports = {
	name: 'wipe',
	description: 'wipe a channel',
	admin: 'true',
	execute(message, args, client)
	{
		wipe(message, args);
	},
};

async function wipe(message, args)
{
	let fetched;
	if(args[0])
	{
		fetched = message.channel.fetchMessages({ limit: args[0] })
			.then(unfiltered =>
			{
				const notPinned = unfiltered.filter(fetchedMsg => !fetchedMsg.pinned);

				message.channel.bulkDelete(notPinned, true);
			});
		return;
	}

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