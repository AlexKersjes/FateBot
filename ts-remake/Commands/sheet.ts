import { ICommands, ICommand } from "../command";
import { Message, Client } from "discord.js";
import { SaveGame } from "../savegame";
import { FateFractal } from "../fatefractal";
import * as Discord from 'discord.js';
import { Aspect } from "../dataelements";
import { getGenericResponse } from "../responsetools";
import { sheetembed, detailembed } from "../embeds";

@ICommands.register
export class sheetCommand implements ICommand {
	requireSave: boolean = true;
	name: string = 'sheet';
	description: string = 'Create or display a character sheet. `sheet -s` to display the current situation.';
	helptext: string | undefined;
	admin: boolean = false;
	GM: boolean = false;
	args: boolean = false;
	aliases: string[] | undefined = ['sh'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		const player = save?.getPlayerAuto(message);
		let character = player.CurrentCharacter;
		if (args.includes('situation') || args.includes('-s'))
			character = save.ChannelDictionary.FindDiscordChannel((message.channel as Discord.TextChannel)).situation;

		let permanent = false;
		args = args.filter(a => {
			if (['-p', 'perm', 'permanent'].includes(a)) {
				permanent = true;
				return false;
			}
			if (a.startsWith('<@'))
				return false;
			return true;
		});


		if (character == undefined) {
			if (!args[0])
				args = await (await getGenericResponse(message, 'Please provide a character name:')).split(' ');
			player.CurrentCharacter = new FateFractal(args.join(' '), save.Options, save.Options.GMCheck(player.id));
			character = player.CurrentCharacter;
			message.channel.send('Created a new character sheet.');
			save.dirty();
		}
		let member: Discord.GuildMember | undefined | null = message.guild?.member(player.id);
		if (!member)
			throw Error('Could not find GuildMember');
		const mss = await message.channel.send(sheetembed(character, member))
		character.subscribeSheet(mss, member);
		createlistener(mss, client, character, member, permanent);
	}
}



async function createlistener(message: Discord.Message, client: Discord.Client, character: FateFractal, member: Discord.GuildMember, permanent: boolean) {
	const filter = (reaction: Discord.MessageReaction, user: Discord.User) => {
		return (reaction.emoji.name == '🏠' || reaction.emoji.name == '🇩' || reaction.emoji.name == '🇦' || reaction.emoji.name == '🇸' || reaction.emoji.name == '🇨' || reaction.emoji.name == '⏹️') && user.id != client.user?.id;
	};

	const collector = message.createReactionCollector(filter, permanent ? {} : { time: 180000 });

	collector.on('collect', (reaction, user) => {
		switch (reaction.emoji.name) {
			case '🏠':
				message.edit(sheetembed(character, member));
				break;
			case '🇦':
				const contents: Array<Aspect | Array<Aspect | FateFractal>> = [character.Aspects];
				if (character.Trouble)
					contents.unshift(character.Trouble);
				if (character.HighConcept)
					contents.unshift(character.HighConcept);
				message.edit(detailembed(character, member, 'Aspects', contents));
				break;
			case '🇸':
				message.edit(detailembed(character, member, 'Stunts', [character.Stunts]));
				break;
			case '🇨':
				message.edit(detailembed(character, member, 'Conditions', [character.Conditions]));
				break;
			case '🇩':
				if (character.Details)
					message.edit(detailembed(character, member, 'Details', [character.Details]));
				break;
			case '⏹️':
				if (!permanent) {
					message.reactions.removeAll();
					collector.stop();
				}
		}

		reaction.users.remove(user);
		message.reactions.resolve(reaction);
	});

	collector.on('end', collected => {
		character.unsubscribeSheet(message);
		message.reactions.removeAll();
	});

	try {
		await message.react('🏠');
		if (character.Details)
			await message.react('🇩');
		await message.react('🇦');
		await message.react('🇸');
		if (character.Conditions.length > 0) { await message.react('🇨'); }
		if (!permanent)
			await message.react('⏹️');
	}
	catch
	{
		console.error('reaction promise failed');
	}
}

