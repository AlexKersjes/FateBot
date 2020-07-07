import * as Discord from 'discord.js';
import { Exclude } from 'class-transformer';
import { RollContest } from './rollcontest';
import { FateFractal } from './fatefractal';

export class ChannelDictionary
{
	Channels = new Array<Channel>();

	FindDiscordChannel(channel : Discord.GuildChannel) : Channel
	{
		let c = this.Channels.find(c => c.id === channel.id);
		if (c == undefined){
			c = new Channel(channel);
			this.Channels.push(c)
		}
		return c;
	}

	FindChannel(name : string) : Channel | undefined
	{
		return this.Channels.find(c => c.name == name);
	}


	ConnectChannels(channel1 : Discord.GuildChannel, channel2 : Discord.GuildChannel, timeout? : number, oneway = false)
	{
		let c1 = this.FindDiscordChannel(channel1);
		let c2 = this.FindDiscordChannel(channel2);
		c1.addConnection(c2, timeout);
		if(!oneway)
			c2.addConnection(c1, timeout);
	}

	DeleteConnection(channel1 : Discord.GuildChannel, channel2 : Discord.GuildChannel, oneway = false)
	{
		let c1 = this.FindDiscordChannel(channel1);
		let c2 = this.FindDiscordChannel(channel2);
		c1.deleteConnection(c2);
		if(!oneway)
			c2.deleteConnection(c1);
	}

	LockConnection(channel1 : Discord.GuildChannel, channel2 : Discord.GuildChannel, oneway = false)
	{
		let c1 = this.FindDiscordChannel(channel1);
		let c2 = this.FindDiscordChannel(channel2);
		c1.switchLock(c2);
		if(!oneway)
			c2.switchLock(c1);
	}

	AddChannel(channel : Discord.GuildChannel, defaulttimeout? : number) : Channel // also used to reset all timeouts on a connection to default.
	{
		let c = this.FindDiscordChannel(channel);
		c.defaulttimeout = defaulttimeout? defaulttimeout : 0;
		c.setAllTimeouts(defaulttimeout);
		return c;
	}

	RenameChannel(channel : Discord.GuildChannel, name : string)
	{
		let c = this.FindDiscordChannel(channel);
		if (c == undefined)
			c = this.AddChannel(channel);
		c.name = name;
	}

	CheckConnection(channel : Discord.GuildChannel, name : string) : [boolean, number]
	{
		let c = this.FindDiscordChannel(channel);
		if (c == undefined)
			throw Error('This channel is not connected to the movement system.');
		let c2 = this.FindChannel(name);
		if (c2 == undefined)
			throw Error('Could not find target channel.');
		return c.getConnection(c2);
	}

	DeleteChannel(channel : Discord.GuildChannel)
	{
		let c = this.Channels.find(a => a.id == channel.id)
		if(c == undefined)
			throw Error('This channel is not connected to the movement system.');
		this.Channels.splice(this.Channels.indexOf(c), 1);
		for (let i = 0; i < this.Channels.length; i++) {
			this.Channels[i].deleteConnection(c);
		}
	}
}

class Channel {
	id : string;
	name : string;
	defaulttimeout : number = 0;
	situation : FateFractal | undefined;
	private connections : [string, number, boolean][] = [];
	@Exclude()
	contest : RollContest | undefined;

	constructor(channel : Discord.GuildChannel)
	{
		this.id = channel.id;
		this.name = channel.name;
	}

	setAllTimeouts(timeout? : number)
	{
		this.connections.forEach(a => a[1] = timeout? timeout : 0);
	}

	addConnection(otherChannel : Channel, timeout = this.defaulttimeout)
	{
		const existingConnection = this.connections.find(c => otherChannel.id == c[0]);
		if (existingConnection != undefined)
			return existingConnection[1] = timeout;
		return this.connections.push([otherChannel.id, timeout, true])
	}

	deleteConnection(otherChannel: Channel)
	{
		const c = this.connections.find(a => a[0] == otherChannel.id);
		if(c != undefined)
			this.connections.splice(this.connections.indexOf(c),1)
	}

	switchLock(otherChannel : Channel) : boolean
	{
		const connection = this.connections.find(c => c[0] === otherChannel.id);
		if(!connection)
			throw Error('Cannot lock or unlock an unconnected channel.')
		return connection[2] = !connection[2];
	}
	
	getConnection(otherChannel : Channel) : [boolean, number]{
		const otherConnection = this.connections.find(c => otherChannel.id == c[0] );
		if (otherConnection == undefined)
			throw Error('No connection set up between these channels.');
		return [otherConnection[2], otherConnection[1]];
	}
}