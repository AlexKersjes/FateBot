module.exports = {
	name: 'floorplan',
	aliases: ['map'],
	description: 'Look at the floor plan.',
	channels: ['lobby'],
	execute(message, args, client)
	{
		if(client.save.corpse)
		{
			message.channel.send('', { file: 'app/data/floorplan.jpg' });
			message.delete();
		}
	},
};