const Discord = require('discord.js');
const fs = require('fs');
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

		timestamps.set(user.id, { now, cooldownAmount });
		setTimeout(() => timestamps.delete(user.id), cooldownAmount);
	},

	log: function(savedata, loggerid, logstr, options)
	{
		const logentry =
		{
			loggerid : loggerid,
			spoiler : options.spoiler ? true : false,
			url : options.url,
			logstr : logstr,
			timestamp : options.timestamp ? options.timestamp : Date.now,
			subject : options.subjectid ? options.subjectid : loggerid,
			quote : options.quote == undefined ? true : options.quote,
		};
		savedata.Log.push(logentry);
		savedata.Log.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
		return logentry;
	},

	findbyvalue: function(array, value)
	{
		const result = [];
		Object.keys(array).forEach(key =>
		{
			if(array[key] == value)
			{ result.push(key); }
		});
		return result;
	},

	findbymarkerrecursive: function(array, value)
	{
		const result = [];
		Object.keys(array).forEach(key =>
		{
			if(array[key][value])
			{ result.push([key, array[key]]); }
			else if (typeof array[key] == 'object')
			{
				if(!this.isEmpty(this.findbymarkerrecursive(array[key], value)))
				{result.push(this.findbymarkerrecursive(array[key], value)[0]);}
			}
		});
		return result;
	},

	findbytype: function(array, type)
	{
		const result = [];
		Object.keys(array).forEach(key =>
		{
			if(typeof (array[key]) == type)
			{ result.push(key); }
		});
		return result;
	},

	isEmpty: function(obj)
	{
		if(Object.keys(obj).length == 0)
		{ return true; }
		return false;
	},
};