import * as Discord from 'discord.js';

export function botCheck(message:Discord.Message, client: Discord.Client) {
	if(message.author != client.user)
		return true;
	return false;
}