import { FateOptions, FateVersion } from './options';
import { Type } from 'class-transformer';
export class SkillList {
	ListName : string;
	SkillPoints: number = -1;
	@Type(() => Skill)
	Skills: Skill[] = [];

	AdjustSkillValue(Name: string, Amount: number, Options: FateOptions, UserId: string) {
		if (this.SkillPoints != -1) {
			if (Amount > this.SkillPoints) {
				throw Error('Not enough skill points.')
			}
			this.SkillPoints -= Amount;
		}
		const skill = this._FindSkill(Name);
		if(skill == undefined)
			throw Error(`No ${Options?.FateVersion == FateVersion.Accelerated? 'Approach' : 'Skill'} found by that name.`)
		if (Options?.SkillMax) {
			if (Options.SkillMax < skill?.Value + Amount && Options.SkillMax > 0) {
				throw Error('Increase exceeds skill Maximum.')
			}
		}
		skill.Value += Amount;

		if (Options?.SkillColumns && !Options.GMCheck(UserId)) {
			if (!this.CheckColumns()) {
				skill.Value -= Amount;
				if(this.SkillPoints!=-1)
				{this.SkillPoints += Amount;}
				throw Error('Invalid Skill Columns.');
			}
		}

		this.SortSkills();
	}
	AddSkill(Name: string, Value: number, Options?: FateOptions)
	{
		if (this.SkillPoints != -1) {
			if (Value > this.SkillPoints) {
				throw Error('Not enough skill points.')
			}
			this.SkillPoints -= Value;
		}
		const skill = new Skill(Name, Value);
		this.Skills.unshift(skill);
		if (Options?.SkillColumns) {
			if (!this.CheckColumns()) {
				this.Skills.shift();
				if(this.SkillPoints!=-1)
				{this.SkillPoints += Value;}
				throw Error('Invalid Skill Columns.');
			}
		}
		this.SortSkills();
	}
	
	FindSkill(Name :string ) : ReadOnlySkill | undefined {
		return this._FindSkill(Name)
	}

	private _FindSkill(Name: string): Skill | undefined {
		const matched = this.Skills.filter(s => s.match(Name));
		if(matched.length == 1)
			return matched[0];
		if(matched.length == 0)
			return undefined;
		let errstring = 'Too many Skills matched. Matches:';
		matched.forEach(a => errstring += `\n   ${a.Name}`);
		throw Error(errstring);
	}

	SwapSkills(Name1:string, Name2:string)
	{
		const Skill1 = this._FindSkill(Name1);
		const Skill2 = this._FindSkill(Name2);
		if(Skill1 == undefined || Skill2 == undefined)
			throw Error('One of the skills could not be found.')
		const Rating1 = Skill1.Value;
		Skill1.Value = Skill2.Value;
		Skill2.Value = Rating1;
		this.SortSkills();
	}

	AddSkillPoints(Value:number)
	{
		this.SkillPoints += Value;
	}

	SortSkills()
	{
		this.Skills.sort((a,b) => b.Value - a.Value);
	}

	CheckColumns(): boolean {
		let skillsChecked = 0;
		let rowNumber = 1;
		let lastRowSize = 99;
		while (lastRowSize > 0) {
			const row = this.Skills.filter(s => s.Value === rowNumber);
			if (row.length > lastRowSize) { return false; }
			lastRowSize = row.length;
			skillsChecked += lastRowSize;
		}
		if (skillsChecked < this.Skills.length) { return false }
		return true;
	}

	toString() : string {
		if(this.Skills.length ==0)
			return 'No Skills.';
		this.SortSkills();
		let currentValue = this.Skills[0].Value;
		let str = `${currentValue > 0 ? '+'+ currentValue + ' : ': '' }`;
		this.Skills.forEach(s => {
			if(s.Value == 0)
				return;
			if(s.Value < currentValue){
				str = str.slice(0, -2);
				currentValue = s.Value;
				str += `\n${currentValue > 0 ? '+'+ currentValue: '' } : `; 
			}
			str += `${s.Name}, `
		});
		str.slice(0, -2);
		if (str.length == 0)
			return 'Skills are set at 0';
		return str;
	}

	constructor(Options: FateOptions = new FateOptions(FateVersion.Core), prefill: boolean = false){
		this.ListName = (Options.FateVersion == FateVersion.Accelerated) ? 'Approaches' : 'Skills';
		if (prefill) {
			Options.DefaultSkills.forEach(s => this.Skills.push(new Skill(s, 0)));
		}
	}
}

class Skill {
	readonly Name : string;
	Value: number;
	constructor(Name: string, Value: number) {
		this.Name = Name[0].toUpperCase() + Name.slice(1);
		this.Value = Value;
	}

	match(input: string): boolean {
		let regStr = '.*';
		for (let i = 0; i < input.length; i++) {
			regStr += `${input[i]}.*`;
		}
		const expression = new RegExp(regStr, 'ig');
		if (this.Name.match(expression) == null) {
			return false;
		}
		return true;
	}
}

export interface ReadOnlySkill {
	readonly Name : string;
	readonly Value : number;
}
