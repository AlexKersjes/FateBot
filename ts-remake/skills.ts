import { FateOptions, FateVersion } from './options';
export class SkillList {
	ListName : string;
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

	toString(): string {
		if(this.Skills.length ==0)
			return 'No Skills.';
		this.SortSkills();
		let currentValue = this.Skills[0].Value;
		let str = `${currentValue > 0 ? '+': '' + currentValue} : `;
		this.Skills.forEach(s => {
			if(s.Value == 0)
				return;
			if(s.Value < currentValue){
				str = str.slice(0, -2);
				currentValue = s.Value;
				str += `\n${currentValue > 0 ? '+': '' + currentValue} : `; 
			}
			str += `${s.Name}, `
		});
		str.slice(0, -2);
		return str;
	}

	constructor(Options: FateOptions, prefill: boolean = false){
		this.ListName = (Options.FateVersion == FateVersion.Accelerated) ? 'Approaches' : 'Skills';
		if (prefill) {
			if(Options.DefaultSkills)
			{
				Options.DefaultSkills.forEach(s => {
					this.Skills.unshift(new Skill(s, 0));
				});
			}
			else
			{
				switch (Options.FateVersion)
				{
					case FateVersion.Accelerated:
						this.Skills = [new Skill('Careful', 0), new Skill('Clever', 0), new Skill('Flashy', 0), new Skill('Forceful', 0),new Skill('Quick', 0), new Skill('Sneaky', 0)];
						break;
					case FateVersion.Condensed:
						this.Skills.push(new Skill('Academics', 0));
					case FateVersion.Core:
						const list = ['Academics', 'Athletics', 'Burglary', 'Contacts', 'Crafts', 'Deceive', 'Drive', 'Empathy', 'Fight', 'Investigate', 'Lore', 'Notice', 'Physique', 'Provoke', 'Rapport', 'Resources', 'Shoot', 'Stealth', 'Will'];
						list.forEach(i => this.Skills.push(new Skill(i, 0)));
						break;
					
				}
			}
		}
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
