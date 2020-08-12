import { FateOptions, FateVersion } from './options';
import { Type, Exclude } from 'class-transformer';
export class SkillLibrary {
	@Type(() => SkillList)
	Lists : SkillList[] = [];

	RepairConnections() {
		if(this.Lists.length < 1)
			return;
		for (let i = 0; i < this.Lists.length; i++) {
			const List = this.Lists[i];
			List.Skills.forEach(s => {
				let attached;
				if(!s.AttachCheck()) {
					for (let i2 = 0; i2 < this.Lists.length; i2++) {
						if(i == i2)
							return;
						const List2 = this.Lists[i2];
						if(s.attachedSkillName)
						attached = List2.FindSkill(s.attachedSkillName)
						if(attached != undefined)
							break;
					}
					if(attached == undefined)
						return s.Detach();
					s.Attach(attached);
				}
			})	
		}
	}

	FindSkill(input: string, excludeList? : SkillList) : [Skill, SkillList] | undefined {
		if(input == '')
			return undefined;
		let returnSkill = undefined;
		const returnList = this.Lists.find(skillList => {
			if(excludeList == skillList)
				return false;
			const s = skillList.FindSkill(input);
			if(s != undefined){
				returnSkill = s;
				return true;
			}
			return false;
		});
		if(returnSkill == undefined || returnList == undefined)
			return undefined;
		return [returnSkill, returnList];
	}

	FindList(input: string) : SkillList | undefined {
		if(input == '')
			return undefined;
		return this.Lists.find(l => l.match(input));
	}

	Attach(skill1:string, skill2:string)
	{
		if(this.Lists.length < 1)
			throw Error('Attachments can\'t be made between two skills on the same list. At least two lists are required.')
		const temp = this.FindSkill(skill1);
		if(!temp)
			throw Error(`Could not find skill to match "${skill1}".`);
		const Skill1 = temp[0];
		const temp2 = this.FindSkill(skill2, temp[1]);
		if(!temp2)
			throw Error(`Could not find skill to match "${skill2}".`);
		const Skill2 = temp2[0];

		Skill1.Attach(Skill2);

		return `Successfully attached "${Skill1.Name}" to "${Skill2.Name}"`;
	}

	CreateList(Name?:string,  prefill? : boolean, Options?: FateOptions,) {
		const List = new SkillList(Name, Options, prefill);
		this.Lists.push(List);
		return List
	}

	DeleteList(currentList: SkillList) {
		currentList.Skills.forEach(s => { s.DisposeConnections(); s.Detach() });
		this.Lists.splice(this.Lists.indexOf(currentList), 1);
	}

	getActive(): SkillList | undefined {
		return this.Lists[0];
	}

	setActive(list: SkillList) {
		this.Lists.unshift(this.Lists.splice(this.Lists.indexOf(list), 1)[0]);
	}
	

	rotate() {
		const l = this.Lists.shift();
		if(l != undefined)
			this.Lists.push(l);
		return this.getActive();
	}
}

export class SkillList {
	ListName : string;
	private _skillPoints: number = -1;
	@Type(() => _Skill)
	private _skills: _Skill[] = [];
	Hidden : boolean = false;

	get SkillPoints () {return this._skillPoints}
	set SkillPoints (value : number) { if(value < -1) value = -1; this._skillPoints = value; }
	get Skills() : Skill[] { return this._skills }

	match(input: string): boolean {
		let regStr = '.*';
		for (let i = 0; i < input.length; i++) {
			regStr += `${input[i]}.*`;
		}
		const expression = new RegExp(regStr, 'ig');
		if (this.ListName.match(expression) == null) {
			return false;
		}
		return true;
	}

	AdjustSkillValue(Skill: Skill, Amount: number, Options: FateOptions, UserId: string) {
		const trueSkill = (Skill as _Skill)
		if (this.SkillPoints != -1) {
			if (Amount > this.SkillPoints) {
				throw Error('Not enough skill points.')
			}
			this.SkillPoints -= Amount;
		}
		if(Skill == undefined)
			throw Error(`No ${Options?.FateVersion == FateVersion.Accelerated? 'Approach' : 'Skill'} found by that name.`)
		if (Options?.SkillMax) {
			if (Options.SkillMax < Skill?.Value + Amount && Options.SkillMax > 0) {
				throw Error('Increase exceeds skill Maximum.')
			}
		}
		trueSkill.Value += Amount;

		if (Options?.SkillColumns && !Options.GMCheck(UserId)) {
			if (!this.CheckColumns()) {
				trueSkill.Value -= Amount;
				if(this.SkillPoints!=-1)
				{this.SkillPoints += Amount;}
				throw Error('Invalid Skill Columns.');
			}
		}

		this.SortSkills();
	}
	
	AddSkill(Name: string, Value: number, Options?: FateOptions) : Skill
	{
		if (this.SkillPoints != -1) {
			try{this.AddSkillPoints(-Value)}catch{ throw Error('Not enough skill points.') };
		}
		const skill = new _Skill(Name, Value);
		this._skills.unshift(skill);
		if (Options?.SkillColumns) {
			if (!this.CheckColumns()) {
				this._skills.shift();
				if(this.SkillPoints!=-1)
				{this.AddSkillPoints(Value)}
				throw Error('Invalid Skill Columns.');
			}
		}
		this.SortSkills();
		return skill;
	}

	DeleteSkill(Skill: Skill) {
		Skill.DisposeConnections();
		this._skills.splice(this._skills.indexOf((Skill as _Skill)), 1);
	}
	
	FindSkill(Name :string) : Skill | undefined {
		return (this._FindSkill(Name) as Skill)
	}

	private _FindSkill(Name: string): _Skill | undefined {
		const matched = this._skills.filter(s => s.match(Name));
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
		return [Skill1, Skill2];
	}

	AddSkillPoints(Value:number)
	{
		if(this.SkillPoints + Value < 0)
			throw Error('May not add skill points to a sum of negative value.')
		this.SkillPoints += Value;
	}

	SortSkills(alphabetical = false)
	{
		this._skills.sort((a,b) => {
			if(alphabetical && b.Value == a.Value)
				return a.Name.localeCompare(b.Name);
			return b.Value - a.Value;
		});
	}

	CheckColumns(): boolean {
		let skillsChecked = 0;
		let rowNumber = 1;
		let lastRowSize = 99;
		while (lastRowSize > 0) {
			const row = this._skills.filter(s => s.Value === rowNumber);
			if (row.length > lastRowSize) { return false; }
			lastRowSize = row.length;
			skillsChecked += lastRowSize;
		}
		if (skillsChecked < this._skills.length) { return false }
		return true;
	}

	
	toString(neat: boolean = false) : string {
		if(this.Hidden)
			return '[HIDDEN]';
		if(this._skills.length ==0)
			return 'No Skills.';
		this.SortSkills();
		let currentValue = this.Skills[0].Value;
		let str = `${currentValue > 0 ? '+'+ currentValue + ' : ': '' }`;
		if(currentValue == 0 && !neat)
			str = `0 : `
		this._skills.forEach(s => {
			if(s.Value == 0 && neat)
				return;
			if(s.Value < currentValue){
				str = str.slice(0, -2);
				currentValue = s.Value;
				if(currentValue != 0 || !neat)
					str += `\n${currentValue > 0 ? '+' + currentValue : currentValue } : `; 
			}
			str += `${s.Name}, `
		});
		str = str.slice(0, -2);
		if (str.length == 0)
			return 'Skills are set at 0';
		return str;
	}

	constructor(Name = '', Options: FateOptions = new FateOptions(FateVersion.Core), prefill: boolean = true){
		this.ListName = Name;
		if(Name == '')
			this.ListName = (Options.FateVersion == FateVersion.Accelerated) ? 'Approaches' : 'Skills';
		if (prefill) {
			this.SkillPoints = Options.StartingSkillPoints;
			Options.DefaultSkills.forEach(s => this._skills.push(new _Skill(s, 0)));
		}
	}
}

class _Skill implements Skill {
	readonly Name : string;
	Value: number;
	@Exclude()
	AttachedSkill : _Skill | undefined;
	@Exclude()
	private _dependents : _Skill[] = [];
	private _attachedSkillName : string | undefined;
	get attachedSkillName () : string | undefined  { return this._attachedSkillName};

	constructor(Name: string = 'Unnamed', Value: number = 0) {
		if(Name.length > 50)
		{ throw Error('Skills cannot have names longer than 50 characters.') }
		this.Name = Name[0].toUpperCase() + Name.slice(1);
		this.Value = Value;
	}

	@Exclude()
	get AdjustedValue(): number {
		if(!this.AttachCheck())
			throw Error(`${this.Name} skill was not properly attached to ${this._attachedSkillName} skill.`)
		if(this.AttachedSkill != undefined)
			return this.Value + this.AttachedSkill.AdjustedValue;
		return this.Value;	}

	AttachCheck() : boolean {
		if(this._attachedSkillName != undefined)
			if(this.AttachedSkill == undefined)
				return false;
		return true;
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

	DisposeConnections(): void {
		this._dependents.forEach(s => s.Detach());
		this._dependents = [];
	}
	Detach(): void {
		this.AttachedSkill = undefined;
		this._attachedSkillName = undefined;
	}
	Attach(attachedTo: _Skill) {
		if(this.attachedSkillName)
			this.Detach();
		if(attachedTo.RecursionDetection(this.Name))
			throw Error('Recursion is not allowed.')
		attachedTo.AddDependent(this);
		this._attachedSkillName = attachedTo.Name;
		this.AttachedSkill = attachedTo;
	}
	AddDependent(skill: this) {
		this._dependents.push(skill);
	}
	RecursionDetection(Name : string) : boolean {
		if(this._attachedSkillName == undefined)
			return false;
		else if(this._attachedSkillName == Name)
			return true;
		else
		{
			if(!this.AttachedSkill)
				throw Error(`Broken skill attachment at ${this.Name}.`);
			return this.AttachedSkill.RecursionDetection(Name);
		}
	}
}

export interface Skill {
	readonly Name : string;
	readonly Value : number;
	readonly AttachedSkill : Skill | undefined;
	readonly attachedSkillName: string | undefined;
	readonly AdjustedValue : number;
	Detach() : void;
	Attach(skill: Skill) : void;
	AttachCheck () : boolean;
	DisposeConnections() : void;
	match(string: string) : boolean;
}
