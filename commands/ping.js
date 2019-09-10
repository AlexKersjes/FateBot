const fs = require('fs');
module.exports = {
	name: 'ping',
    description: 'Ping!',
	execute(message, args) {
        
        var responses = ['Pong.','Pong!','pong',];
        if(message.channel.id === '610083558643466290')
        {
            message.channel.send(responses[Math.floor(Math.random()*responses.length)]);
        }



	},
};