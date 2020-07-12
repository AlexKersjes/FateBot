type Constructor<T = {}> = new (...args: any[]) => T;
import { FateFractal } from './fatefractal';
import { FateOptions } from './options';
import { basename } from 'path';

export class Atom {
	Name: string;
	Description: string | undefined = undefined;
	Hidden: boolean | undefined = undefined;


	constructor(Name: string, Description?: string) {
		this.Name = Name;
		this.Description = Description;
	}

	match(input: string) : boolean
	{
		let regStr = '.*';
		for (let i = 0; i < input.length; i++) {
			regStr +=  `${input[i]}.*`;
		}
		const expression = new RegExp(regStr, 'gi');
		if(this.Name.match(expression) == null)
		{
			return false;
		}
		return true;
	}
}



function Conditionable<TBase extends Constructor>(Base: TBase) {
	return class extends Base {
		constructor(...args: any[]) {
			super(...args);
		}
		Severity: ConditionSeverity = ConditionSeverity.Fleeting;
	}
}
export enum ConditionSeverity {
	None = -1,
	Fleeting = 1,
	Sticky = 2,
	Lasting = 3
}


function Markable<TBase extends Constructor>(Base: TBase) {
	return class extends Base {
		constructor(...args: any[]) {
			super(...args);
		}
		
		private _BoxValues: number[] = [0];
		get BoxValues() { return this._BoxValues; };
		private _BoxMarks: boolean[] = [false];
		get BoxMarks() { return this._BoxMarks };

		BoxesString() : string {
			let string = '';
			for (let i = 0; i < this.BoxMarks.length; i++)
			{
				if (this.BoxMarks[i])
				{
					string += '[x] ';
				}
				else
				{
					string += `[${this.BoxValues[i] == 0 ? ' ' : this.BoxValues[i]}] `;
				}
			}
			return string;
		}

		SetMaxBoxes(n: number) {
			if(n === 0)
				throw Error('Markable objects must have at least one box.');
			this._BoxMarks = new Array<boolean>(n).fill(false);
			let staircase = false
			if(this._BoxValues[0] == this.BoxValues[1] - 1)
				staircase = true;
			this._BoxValues = new Array<number>(n).fill(this._BoxValues[0]);
			if (staircase)
				this.StaircaseValues();
		}
		SetBoxValue(boxNumber:number, value:number){
			this._BoxValues[boxNumber -1] = value;
		}
		StaircaseValues() {
			for (let i = 0; i < this._BoxValues.length; i++) {
				this._BoxValues[i] = i + 1;
			}
		}
		Mark(int: number, Options?: FateOptions) :number {

			if (Options?.DresdenStress) {
				let total = 0;
				if (int > 0) {
					let index = 0;
					
					while (int > 0) {
						if (index > this._BoxMarks.length) {
							throw Error(`Could not fully absorb hit. ${int} boxes left. ${total} absorbed.`);
						}
						if (!this._BoxMarks[index]) {
							this._BoxMarks[index] = true;
							total += this._BoxValues[index];
							int--;
						}
						index++;
					}
				}
				else if (int < 0) {
					this._BoxMarks.reverse();
					this._BoxValues.reverse();
					int = -int;
					let index = 0;
					while (int > 0) {
						if (index > this._BoxMarks.length) {
							throw Error('Could not recover more boxes.');
						}
						if (this._BoxMarks[index]) {
							this._BoxMarks[index] = false;
							total -= this._BoxValues[index];
							int--;
						}
						index++;
					}
					this._BoxMarks.reverse();
					this._BoxValues.reverse();
				}
				return total;
			}

			this._BoxMarks[int - 1] = !this._BoxMarks[int - 1];
			if(this._BoxMarks[int -1])
				return this._BoxValues[int -1];
			else
				return -this._BoxValues[int -1];
		}

		MarkedBoxes(): number {
			let total = 0;
			this._BoxMarks.forEach(bool => { if (bool) { total++ } });
			return total;
		}
	}
}

export function Invokable<TBase extends Constructor>(Base: TBase) {
	return class extends Base {
		BonusShifts: number = 2;
		InvokeCost: number = 1;
		private FreeInvokes: string[] = [];
		public TryFreeInvoke(UserId: string): boolean {
			if (this.InvokeCost === 0)
				return true;
			if (!this.FreeInvokes.some(id => id === UserId))
				return false;
			this.FreeInvokes.splice(this.FreeInvokes.indexOf(UserId), 1);
			return true;
		}
		public AddFreeInvoke(UserId: string) {
			this.FreeInvokes.push(UserId);
		}
		public GetFreeInvokes() { return this.FreeInvokes; }
	}
}

export function IsInvokable(element: unknown): element is InvokableObject {
	return (element as InvokableObject).InvokeCost !== undefined && (element as InvokableObject).Name !== undefined;
}
export function IsMarkable(element: unknown): element is MarkableObject {
	return (element as MarkableObject).BoxMarks !== undefined
}
export function IsCondition(element: unknown): element is Condition {
	return (element as Condition).Severity !== undefined
} 

export class InvokableObject extends Invokable(Atom) { }
export class MarkableObject extends Markable(Atom) { }

export class Track extends Markable(Atom)
{
	CreatesCondition : ConditionSeverity = ConditionSeverity.None;
	constructor(Name: string, Boxes: number, CreatesCondition?: ConditionSeverity, Description?: string) { 
		super(Name, Description); 
		this.SetMaxBoxes(Boxes); 
		if(CreatesCondition == undefined)
			this.CreatesCondition = ConditionSeverity.None
		else
			this.CreatesCondition = CreatesCondition; 
	}
	Mark(int: number, Options?: FateOptions) :number
	{
		const value = super.Mark(int, Options);
		// TODO prompt aspect/condition creation
		if(Options?.UseConditions && this.CreatesCondition != ConditionSeverity.None)
			console.log('Create a condition of severity ' + ConditionSeverity[this.CreatesCondition]);
		else if(this.CreatesCondition != ConditionSeverity.None)
			console.log('Create an aspect to reflect your consequence.');
		return value;
	}
}
export class Stunt extends Invokable(Atom)
{
	constructor(Name: string, Description : string) { super(Name, Description); this.InvokeCost = 0; this.BonusShifts = 2; }
}
export class Aspect extends Invokable(Atom)
{
	constructor(Name: string, Description? : string) { super(Name, Description); }
}
export class Boost extends Aspect
{
	Boost : boolean = true;
	TryFreeInvoke(UserId : string) : boolean{
		try{
			return super.TryFreeInvoke(UserId);
		}
		finally{
			throw this;
		}
	}
	constructor(Name: string) { super(Name) }
}
export class Condition extends Conditionable(Invokable(Atom))
{
	constructor(Name: string, Severity: ConditionSeverity, Description?: string) { super(Name, Description); this.Severity = Severity; }
}
export class BoxCondition extends Markable(Condition)
{
	constructor(Name: string, Severity: ConditionSeverity, Boxes: number, Description?: string) { super(Name, Severity, Description); this.SetMaxBoxes(Boxes); }
}
