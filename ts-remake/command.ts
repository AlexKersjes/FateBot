import Discord = require('discord.js');
export interface Command {
	name : string;
	description : string;
	admin : boolean;
	args : boolean;
	aliases : string[] | undefined;
	disabledInServers : string[];
	execute(message : Discord.Message, args : string[], client : Discord.Client) : void
}