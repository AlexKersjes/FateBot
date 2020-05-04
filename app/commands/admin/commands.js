module.exports = {
	name: 'commands',
	description: 'This list.',
	aliases: ['command'],
	async execute(message, args, client)
	{
		let newstring = 'Bot commands:\n';
		for (const command of client.commands)
		{
			if (command[1].disabled) { continue; }
			let admin = '';
			if(command[1].admin)
			{
				if (!message.member.hasPermission('ADMINISTRATOR')) { continue; }
				admin = ', **admin only**';
			}
			newstring += `**${command[0]}** : ${command[1].description.split('.')[0]}.${admin}\n`;
		}
		if(newstring.length > 2000)
		{
			for(let i = 0; i < Math.ceil(newstring.length / 2000); i++)
			{
				await message.channel.send(newstring.slice(i * 2000, (i + 1) * 2000));
			}
		}
		else
		{message.channel.send(newstring);}
		message.delete();
	},
};