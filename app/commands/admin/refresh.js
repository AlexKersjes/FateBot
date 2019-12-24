module.exports = {
	name: 'refresh',
	description: 'Refund all stress and clear all fleeting conditions. Use .refresh major to clear In Peril and refresh Fate points. Mention to clear on a specific person.',
	visibleReject: true,
	execute(message, args, client)
	{
		const savedata = client.currentgame[message.guild.id];
		Object.keys(savedata.PCs).forEach(key =>
		{
			const character = savedata.PCs[key];
			character.Stress.Current = 0;
			if (args[0] == 'session' && character.Fate) { character.Fate.Current = character.Fate.Refresh; }
			Object.keys(character.Conditions).forEach(cname =>
			{
				if(character.Conditions[cname].Severity == 'Fleeting')
				{ delete character.Conditions[cname]; }
			});
		});
		message.channel.send('Stress and Fleeting conditions cleared.');
		if (args[0] == 'session') { message.channel.send('Fate points refreshed.'); }
	},
};
