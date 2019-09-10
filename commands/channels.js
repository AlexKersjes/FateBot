const fs = require('fs');
module.exports = {
	name: 'channel',
	description: 'modifies json file where channel ids are stored',
	execute(message, args) {
        message.channel.send(message.channel.id);
	},
};