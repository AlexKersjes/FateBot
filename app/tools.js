const Discord = require('discord.js');
module.exports = {
	move: function(message, client, channelName, member)
	{
		member = member || message.author;
		message.channel.permissionOverwrites.get(member.id).delete();
		client.channels.get(client.channelDictionary[channelName])
			.overwritePermissions(member, {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: true,
			});
	},
	setCooldown: function(client, commandName, user, amount)
	{
		if (!client.cooldowns.has(commandName))
		{
			client.cooldowns.set(commandName, new Discord.Collection());
		}

		const now = Date.now();
		const timestamps = client.cooldowns.get(commandName);
		const cooldownAmount = (amount) * 1000;

		timestamps.set(user.id, now);
		setTimeout(() => timestamps.delete(user.id), cooldownAmount);
	},
};