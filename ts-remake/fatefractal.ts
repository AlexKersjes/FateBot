import { SkillList } from './skills';
import { Aspect, Condition, Track, Stunt, BoxCondition, InvokableObject, MarkableObject, IsInvokable, Boost } from './dataelements'
import { Type } from 'class-transformer';
import "reflect-metadata";
export class FateFractal {
	FractalName: string;
	@Type(() => Aspect)
	HighConcept: Aspect | undefined;
	@Type(() => Aspect)
	Trouble: Aspect | undefined;
	@Type(() => Object, { discriminator: {
		property: "_type",
		subTypes : [
			{ value: Aspect, name: "Aspect" },
			{ value: Boost, name: "Boost" },
			{ value: FateFractal, name: "Fractal" }
		]
	} })
	Aspects: (Aspect | Boost | FateFractal)[] = [];
	@Type(() => Track)
	Tracks: Track[] = [];
	@Type(() => Object, { discriminator: {
		property: "_type",
		subTypes : [
			{ value: Stunt, name: "Stunt" },
			{ value: FateFractal, name: "Fractal" }
		]
	} })
	Stunts: (Stunt | FateFractal)[] = [];
	@Type(() => Object, { discriminator: {
		property: "_type",
		subTypes : [
			{ value: BoxCondition, name: "BoxC" },
			{ value: Condition, name: "Condition" },
			{ value: FateFractal, name: "Fractal" }
		]
	} })
	Conditions: (BoxCondition | Condition | FateFractal)[] = [];
	@Type(() => SkillList)
	Skills: SkillList = new SkillList;
	CurrentLocation : string | undefined;

	constructor(Name: string, Prototype?: FateFractal) {
		this.FractalName = Name;
		if (Prototype) {
			const cp = deepCopy(Prototype)
			cp.FractalName = Name;
			this
			return cp;
		}
	}
	
	FindInvokable(input : string) : InvokableObject | undefined
	{
		input = input.toLowerCase();
		const Invokables = this.FindInvokables();
		return Invokables.find(I => I.Name.toLowerCase() == input);
	}

	private FindInvokables(): InvokableObject[] {
		let result = new Array<InvokableObject>(0);
		if (this.HighConcept)
			result.push(this.HighConcept);
		if (this.Trouble)
			result.push(this.Trouble);
		this.Aspects.forEach(a => {
			if (IsInvokable(a)) { result.push(a); }
			else { result = result.concat(a.FindInvokables()); }
		});
		this.Conditions.forEach(a => {
			if (IsInvokable(a)) { result.push(a); }
			else { result = result.concat(a.FindInvokables()); }
		});
		this.Stunts.forEach(a => {
			if (IsInvokable(a)) { result.push(a); }
			else { result = result.concat(a.FindInvokables()); }
		})
		return result;
	}

	FindMarkable (input : string) : MarkableObject | undefined
	{
		input = input.toLowerCase();
		const Markables = this.FindMarkables();
		return Markables.find(I => I.Name.toLowerCase() === input);
	}

	private FindMarkables() : MarkableObject[]
	{
		const result = new Array<MarkableObject>();

		this.Tracks.forEach(a => {
			result.push(a);
		});
		this.Conditions.forEach(a => {
			if (a instanceof BoxCondition) { result.push(a); }
			else if (a instanceof FateFractal) { result.concat(a.FindMarkables()); }
		});

		return result;
	}
}

function IsFractal(element: FateFractal | any): element is FateFractal {
	return (element as FateFractal).FractalName !== undefined;
}

const deepCopy = <T>(target: T): T => {
	if (target === null) {
		return target;
	}
	if (target instanceof Date) {
		return new Date(target.getTime()) as any;
	}
	if (target instanceof Array) {
		const cp = [] as any[];
		(target as any[]).forEach((v) => { cp.push(v); });
		return cp.map((n: any) => deepCopy<any>(n)) as any;
	}
	if (typeof target === 'object' && target !== {}) {
		const cp = { ...(target as { [key: string]: any }) } as { [key: string]: any };
		Object.keys(cp).forEach(k => {
			cp[k] = deepCopy<any>(cp[k]);
		});
		return cp as T;
	}
	return target;
};