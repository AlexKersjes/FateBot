module.exports = {
	name: 'commands',
	description: 'This list.',
	admin: 'true',
	aliases: ['command'],
	execute(message, args, client)
	{
		let newstring = 'Bot commands:\n';
		for (const command of client.commands)
		{
			console.log(command);
			let admin = '';
			if(command[1].admin) {admin = ', **admin only**';}
			newstring += `${command[0]} : ${command[1].description}${admin}\n`;
		}
		message.channel.send(newstring);
		message.delete();
	},
};