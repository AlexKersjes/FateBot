import { ICommands, ICommand } from "../command";
import { Message, Client, DiscordAPIError } from "discord.js";
import { Player, SaveGame } from "../savegame";
import { FateFractal } from "../fatefractal";
import * as Discord from 'discord.js';
import { Atom, MarkableObject, IsInvokable, Stunt, IsMarkable, IsCondition, ConditionSeverity, Aspect, Boost } from "../dataelements";
import { SkillList } from "../skills";
import { getGenericResponse } from "../tools";

@ICommands.register
export class sheetCommand implements ICommand
{
	requireSave: boolean = true;
	name: string = 'sheet';
	description: string = 'Create or display a character sheet.';
	helptext: string | undefined;
	admin: boolean = false;
	GM : boolean = false;
	args: boolean = false;
	aliases: string[] | undefined = ['s'];
	cooldown: number | undefined;
	async execute(message: Message, args: string[], client: Client, save: SaveGame): Promise<void | string> {
		const player = save?.getPlayer(message);
		args = args.filter(i => !i.startsWith('<@'));
		let character = player.CurrentCharacter;
		if(args[0] == 'situation' || args[0] == '-s')
			character = save.Channels.FindDiscordChannel((message.channel as Discord.TextChannel)).situation;
		if(character == undefined){
			if(!args[0])
				args = await (await getGenericResponse(message, 'Please provide a character name')).split(' ');
			player.CurrentCharacter = new FateFractal(args.join(' '), save.Options);
			character = player.CurrentCharacter;
			message.channel.send('Created a new character sheet.');	
		}
		let member : Discord.GuildMember | undefined | null = message.guild?.member(player.id);
		if(!member)
			throw Error('Could not find GuildMember');
		const mss = await message.channel.send(sheetembed(character, member))
		createlistener(mss, client, character, member);
	}
}

// default character sheet layout
function sheetembed(character : FateFractal, member : Discord.GuildMember)
{
	const embed = new Discord.MessageEmbed()
		.setColor(member.displayColor)
		.setTitle(`**${character.FractalName}**`);
	if(character.HighConcept) { embed.setDescription(`the ***${character.HighConcept.Name}***`); }
	if(character.Trouble) { embed.addField('Trouble', `${character.Trouble.Name}`); }
	if(character.Aspects.length != 0 || !character.NPC)
	{
		embed.addField('Aspects', namesFromArray(character.Aspects))
			.addBlankField();
	}
	if(character.Stunts.length != 0 || !character.NPC) {embed.addField('Stunts', namesFromArray(character.Stunts), true);}
	if(character.Conditions.length != 0) { embed.addField('Conditions', namesFromArray(character.Conditions), true); }
	if(character.Tracks.length != 0) {embed.addBlankField();}
	character.Tracks.forEach(boxaspect =>
	{
		embed.addField(boxaspect.Name, boxaspect.BoxesString(), true);
	},
	);
	if(character.Skills[0] != undefined)
	{
		const skills : SkillList = character.Skills[0];

		embed.addBlankField()
			.addField(skills.ListName, skills.toString());
	}
	embed.setThumbnail(character.imgUrl ? character.imgUrl : member.user.avatarURL() || '');
	return embed;
}

function detailembed<T extends Atom>(character : FateFractal, member : Discord.GuildMember, pageName : string, contents : Array<T | Array<T | FateFractal>>)
{
	const embed = new Discord.MessageEmbed()
		.setColor(member.displayColor)
		.setThumbnail(character.imgUrl ? character.imgUrl : member.user.avatarURL() || '')
		.setTitle(character.FractalName)
		.setDescription(`${pageName}:`);
	
	const flatcontents =  contents.flat();
	flatcontents.forEach(element =>
		{
			if (element instanceof FateFractal)
			{
				embed.addField(element.FractalName, 'Fractal');
				return;
			}
			if(element instanceof Boost){
				embed.addField(element.Name, 'Boost')
				return;
			}
			let severity = '';
			if(IsCondition(element)){
				severity =` [${ConditionSeverity[element.Severity]}]`;
			}
			let cost = '';
			if(IsInvokable(element)){
				if(element instanceof Stunt)
					cost = element.InvokeCost == 0 ? '' : `Cost: ${element.InvokeCost},`;
				else
					cost = element.InvokeCost == 1 ? '' : `Cost: ${element.InvokeCost},`
			}
			let boxes = '';
			if(IsMarkable(element)){
				boxes = element.BoxesString() + ': ';
			}
			embed.addField(`${boxes}${cost}${element.Name}:${severity}`, element.Description ? element.Description : 'No description');
		});
	return embed;
}

async function createlistener(message : Discord.Message, client : Discord.Client, character : FateFractal, member : Discord.GuildMember)
{
	const filter = (reaction : Discord.MessageReaction, user : Discord.User) =>
	{
		return (reaction.emoji.name == '🏠' || reaction.emoji.name == '🇩' || reaction.emoji.name == '🇦' || reaction.emoji.name == '🇸' || reaction.emoji.name == '🇨' || reaction.emoji.name == '⏹️') && user.id != client.user?.id;
	};

	const collector = message.createReactionCollector(filter, { time: 180000 });

	collector.on('collect', (reaction, user) =>
	{
		switch(reaction.emoji.name)
		{
		case '🏠' :
			message.edit(sheetembed(character, member));
			break;
		case '🇦':
			const contents : Array<Aspect | Array<Aspect | FateFractal>> = [character.Aspects];	
			if(character.Trouble)
				contents.unshift(character.Trouble);
			if(character.HighConcept)
				contents.unshift(character.HighConcept);
			message.edit(detailembed(character, member, 'Aspects', contents));
			break;
		case '🇸':
			message.edit(detailembed(character, member,'Stunts', [character.Stunts]));
			break;
		case '🇨':
			message.edit(detailembed(character, member, 'Conditions', [character.Conditions]));
			break;
		case '🇩':
			if(character.Details)
				message.edit(detailembed(character, member, 'Details', [character.Details]));
			break;
		case '⏹️' :
			message.reactions.removeAll();
			collector.stop();
		}

		reaction.users.remove(user);
		message.reactions.resolve(reaction);
	});

	collector.on('end', collected =>
	{
		message.reactions.removeAll();
	});

	try
	{
		await message.react('🏠');
		if(character.Details)
			await message.react('🇩');
		if(character.Aspects.length > 0 || character.HighConcept ||character.Trouble) {await message.react('🇦');}
		if(character.Stunts.length > 0) {await message.react('🇸');}
		if(character.Conditions.length > 0) {await message.react('🇨');}
		await message.react('⏹️');
	}
	catch
	{
		console.error('reaction promise failed');
	}
}

// utility functions below
function namesFromArray<T extends Atom>(array: Array<T | FateFractal>)
{
	if (array.length == 0)
	{ return 'None'; }
	
	let string = '';
	array.forEach(i =>
	{
		if (i instanceof FateFractal)
		{
			string += i.FractalName;
		}
		else
		{
			if(i.Hidden)
				string += '[HIDDEN]'
			else
				string += i.Name;
		}
		string += '\n';
	});
	return string;
}