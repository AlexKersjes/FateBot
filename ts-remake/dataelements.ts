type Constructor<T = {}> = new (...args: any[]) => T;
import { FateFractal } from './fatefractal';
import { FateOptions } from './options';

class Atom {
	Name: string;
	Description: string | undefined = undefined;


	constructor(Name: string, Description?: string) {
		this.Name = Name;
		this.Description = Description;
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
		BoxValues: number[] = [0];
		BoxMarks: boolean[] = [false];
		SetMaxBoxes(n: number) {
			if(n === 0)
				throw Error('Markable objects must have at least one box.');
			this.BoxMarks = new Array<boolean>(n).fill(false);
			this.BoxValues = new Array<number>(n).fill(this.BoxValues[0]);
		}
		SetBoxValue(boxNumber:number, value:number){
			this.BoxValues[boxNumber -1] = value;
		}
		StaircaseValues() {
			for (let i = 0; i < this.BoxValues.length; i++) {
				this.BoxValues[i] = i + 1;
			}
		}
		Mark(int: number, Options?: FateOptions) :number {

			if (Options?.DresdenStress) {
				let total = 0;
				if (int > 0) {
					let index = 0;
					
					while (int > 0) {
						if (index > this.BoxMarks.length) {
							throw Error(`Could not fully absorb hit. ${int} boxes left. ${total} absorbed.`);
						}
						if (!this.BoxMarks[index]) {
							this.BoxMarks[index] = true;
							total += this.BoxValues[index];
							int--;
						}
						index++;
					}
				}
				else if (int < 0) {
					this.BoxMarks.reverse();
					this.BoxValues.reverse();
					int = -int;
					let index = 0;
					while (int > 0) {
						if (index > this.BoxMarks.length) {
							throw Error('Could not recover more boxes.');
						}
						if (this.BoxMarks[index]) {
							this.BoxMarks[index] = false;
							total -= this.BoxValues[index];
							int--;
						}
						index++;
					}
					this.BoxMarks.reverse();
					this.BoxValues.reverse();
				}
				return total;
			}

			this.BoxMarks[int - 1] = !this.BoxMarks[int - 1];
			if(this.BoxMarks[int -1])
				return this.BoxValues[int -1];
			else
				return -this.BoxValues[int -1];
		}

		MarkedBoxes(): number {
			let total = 0;
			this.BoxMarks.forEach(bool => { if (bool) { total++ } });
			return total;
		}
	}
}

export function Invokable<TBase extends Constructor>(Base: TBase) {
	return class extends Base {
		BonusShifts: number = 2;
		InvokeCost: number = 1;
		FreeInvokes: string[] = []
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

export function IsInvokable(element: InvokableObject | FateFractal): element is InvokableObject {
	return (element as InvokableObject).InvokeCost !== undefined && (element as InvokableObject).Name !== undefined;
}
export function IsMarkable(element: MarkableObject | FateFractal): element is MarkableObject {
	return (element as MarkableObject).BoxMarks !== undefined
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
	constructor(Name: string, Description : string, InvokeBonus:number) { super(Name, Description); this.InvokeCost = 0; this.BonusShifts = InvokeBonus; }
}
export class Aspect extends Invokable(Atom)
{
	constructor(Name: string, Description? : string) { super(Name, Description); }
}
export class Boost extends Aspect
{
	Boost : boolean = true;
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
