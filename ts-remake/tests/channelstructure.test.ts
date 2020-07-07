import { ChannelDictionary } from '../channelstructure';
import * as Discord from 'discord.js';
const Channels = new ChannelDictionary();
const TestChannelA = ({ id : '123456789', name : 'ChannelA' } as Discord.GuildChannel);
const TestChannelB = ({ id : '987654321', name : 'ChannelB' } as Discord.GuildChannel);

test('Creating a connection.', () =>{
	Channels.ConnectChannels(TestChannelA, TestChannelB);
	const BObject = Channels.FindDiscordChannel(TestChannelB);
	if(BObject == undefined)
		throw Error('Error in Channel creation or Channel searching.');
	expect(Channels.FindDiscordChannel(TestChannelA)?.getConnection(BObject)[0]).toBe(true);
})

test('Test Locking.', () =>{
	Channels.LockConnection(TestChannelB, TestChannelA, true);
	expect(Channels.FindDiscordChannel(TestChannelA)?.getConnection(Channels.FindDiscordChannel(TestChannelB))[0]).toBe(true);
	expect(Channels.FindDiscordChannel(TestChannelB)?.getConnection(Channels.FindDiscordChannel(TestChannelA))[0]).toBe(false);
})