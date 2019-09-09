const fs = require('fs');
const Discord = require('discord.js');
const {prefix, token} = require('./config.json');
const client = new Discord.Client();
client.commands =  new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));


for (const file of commandFiles) {
	const command = require(`./commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}

client.once('ready', ()=>{
    console.log('Ready')
})

client.on('message', message =>{

    if (!message.content.startsWith(prefix) || message.author.bot) return;
    {
        const args = message.content.slice(prefix.length).split(' +');
        const command = args.shift().toLowerCase();
        //Admin Commands
        if (message.member.hasPermission("ADMINISTRATOR"))
        {
            
        }
        
        //Channel specific commands
        if (!client.commands.has(command)) return;

        try 
        {
	        client.commands.get(command).execute(message, args);
        } 
        catch (error) 
        {
	        console.error(error);
	        message.reply('...');
        }
        
    }

} )

client.login(token);