module.exports = {
	name: 'floorplan',
	aliases: ['map'],
	description: 'Look at the floor plan.',
	channels: ['lobby'],
	disable: true,
	execute(message, args, client)
	{
		message.channel.send('', { file: 'app/data/floorplan.jpg' });
		message.delete();
	},
};