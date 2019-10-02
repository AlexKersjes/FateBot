module.exports = {
	name: 'enter',
	description: 'A player enters the game.',
	admin: 'true',
	execute(message, args, client)
	{
		const newPlayer = message.mentions.members.first();
		newPlayer.addRole('621431140330373141');
		const channel = client.channels.get(client.channelDictionary['lobby']);
		channel.overwritePermissions(newPlayer, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true,
			// READ_MESSAGE_HISTORY: true,
		});
		let name = newPlayer.user.username;
		if(newPlayer.nickname != null)
		{
			name = newPlayer.nickname;
		}
		channel.send(`${name} has entered the lobby.`);
		return message.delete();
	},
};