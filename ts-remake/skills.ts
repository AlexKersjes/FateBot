import { FateOptions, FateVersion } from './options';
export class SkillList {
	SkillPoints: number = -1;
	Skills: Skill[] = [];

	AdjustSkillValue(Name: string, Amount: number, Options?: FateOptions, UserId?: string) {
		if (this.SkillPoints != -1) {
			if (Amount > this.SkillPoints) {
				throw Error('Not enough skill points.')
			}
			this.SkillPoints -= Amount;
		}
		const skill = this.FindSkill(Name);
		if(skill == undefined)
			throw Error(`No ${Options?.FateVersion == FateVersion.Accelerated? 'Approach' : 'Skill'} found by that name.`)
		if (Options?.SkillMax) {
			if (Options?.SkillMax < skill?.Value + Amount) {
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
	
	FindSkill(Name: string): Skill | undefined {
		return this.Skills.find(s => s.Name.toLowerCase() === Name.toLowerCase());
	}

	SwapSkills(Name1:string, Name2:string)
	{
		const Skill1 = this.FindSkill(Name1);
		const Skill2 = this.FindSkill(Name2);
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
}

class Skill {
	readonly Name : string;
	Value: number;
	constructor(Name: string, Value: number) {
		Name = Name.toLowerCase();
		this.Name = Name[0].toUpperCase() + Name.slice(1);
		this.Value = Value;
	}
}
