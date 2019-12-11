module.exports = {
	name: 'commands',
	description: 'This list.',
	aliases: ['command'],
	execute(message, args, client)
	{
		let newstring = 'Bot commands:\n';
		for (const command of client.commands)
		{
			if (command[1].disabled) { continue; }
			console.log(command);
			let admin = '';
			if(command[1].admin)
			{
				if (!message.member.hasPermission('ADMINISTRATOR')) { continue; }
				admin = ', **admin only**';
			}
			newstring += `**${command[0]}** : ${command[1].description}${admin}\n`;
		}
		message.channel.send(newstring);
		message.delete();
	},
};