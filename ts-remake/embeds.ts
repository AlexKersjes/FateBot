import * as Discord from 'discord.js';
import { FateFractal } from './fatefractal';
import { SkillList } from './skills';
import { Atom, Boost, IsCondition, ConditionSeverity, IsInvokable, Stunt, IsMarkable } from './dataelements';

// default character sheet layout
export function sheetembed(character : FateFractal, member : Discord.GuildMember)
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

export function detailembed<T extends Atom>(character : FateFractal, member : Discord.GuildMember, pageName : string, contents : Array<T | Array<T | FateFractal>>)
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
				severity = element.Severity != ConditionSeverity.None ? ` <${ConditionSeverity[element.Severity]}>` : '' ;
			}
			let cost = '';
			let bonus = '';
			if(IsInvokable(element)){
				if(element instanceof Stunt){
					cost = element.InvokeCost == 0 ? '' : `Cost: **${element.InvokeCost}. **`;
					bonus = element.BonusShifts == 0 ? '' : `, **[ ${element.BonusShifts > 0 ? '+'+ element.BonusShifts: element.BonusShifts} ]**`;
				}
				else
					cost = element.InvokeCost == 1 ? '' : `Cost: **${element.InvokeCost}**. `;
			}
			let boxes = '';
			if(IsMarkable(element)){
				boxes = element.BoxesString() + ': ';
			}
			embed.addField(`${boxes}${element.Name}${bonus}:${severity}`, element.Description ? cost + element.Description : cost + 'No description');
		});
	return embed;
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