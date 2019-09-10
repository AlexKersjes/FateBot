module.exports = {
	name: 'mute',
	description: 'modifies json file where channel ids are stored',
	execute(message, args) {
        if(!args.length)
        {
            return message.channel.send('...');
        }
        
	},
};