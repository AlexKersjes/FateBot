class SkillList {
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
	}
	FindSkill(Name: string, Options?:FateOptions): Skill {
		const skill = this.Skills.find(s => s.Name = Name.toLowerCase());
		if (!skill)
		{
			throw Error(`No ${Options?.FateVersion == FateVersion.Accelerated ? 'Approach' : 'Skill'} found by that name.`)
		}
		return skill;
	}

	SwapSkills(Name1:string, Name2:string)
	{
		throw Error('Not Implemented.')
	}

	AddSkillPoints(Value:number)
	{
		this.SkillPoints += Value;
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
	Name: string;
	Value: number;
	constructor(Name: string, Value: number) {
		this.Name = Name.toLowerCase();
		this.Value = Value;
	}
}
