import { SkillList } from './skills';
import { Atom, Aspect, Condition, Track, Stunt, BoxCondition, InvokableObject, MarkableObject, IsInvokable, Boost, Invokable } from './dataelements'
import { Type } from 'class-transformer';
import "reflect-metadata";
import { FateOptions } from './options';
export class FateFractal {
	FractalName: string;
	FatePoints: number | undefined;
	Refresh: number | undefined
	@Type(() => Aspect)
	HighConcept: Aspect | undefined;
	@Type(() => Aspect)
	Trouble: Aspect | undefined;
	@Type(() => Object, {
		discriminator: {
			property: "_type",
			subTypes: [
				{ value: Aspect, name: "Aspect" },
				{ value: Boost, name: "Boost" },
				{ value: FateFractal, name: "Fractal" }
			]
		}
	})
	Aspects: (Aspect | Boost | FateFractal)[] = [];
	@Type(() => Track)
	Tracks: Track[] = [];
	@Type(() => Object, {
		discriminator: {
			property: "_type",
			subTypes: [
				{ value: Stunt, name: "Stunt" },
				{ value: FateFractal, name: "Fractal" }
			]
		}
	})
	Stunts: (Stunt | FateFractal)[] = [];
	Details: Atom[] | undefined;
	@Type(() => Object, {
		discriminator: {
			property: "_type",
			subTypes: [
				{ value: BoxCondition, name: "BoxC" },
				{ value: Condition, name: "Condition" },
				{ value: FateFractal, name: "Fractal" }
			]
		}
	})
	Conditions: (BoxCondition | Condition | FateFractal)[] = [];
	@Type(() => SkillList)
	Skills: SkillList[] = [];
	CurrentLocation: string | undefined;
	imgUrl: string | undefined;
	NPC : boolean = false;

	constructor(Name: string, Options?: FateOptions, Prototype?: FateFractal) {
		this.FractalName = Name;
		if (Options)
			this.Skills.push(new SkillList(Options))
		if (Prototype) {
			const cp = deepCopy(Prototype)
			cp.FractalName = Name;
			this
			return cp;
		}
	}

	FindInvokable(input: string): InvokableObject | undefined {
		try {
			const Invokables = this.FindInvokables(true);
			return FilterElement(Invokables, input);
		}
		catch{
			const Invokables = this.FindInvokables(false);
			return FilterElement(Invokables, input);
		}

	}

	private FindInvokables(recursive : boolean): InvokableObject[] {
		let result = new Array<InvokableObject>(0);
		if (this.HighConcept)
			result.push(this.HighConcept);
		if (this.Trouble)
			result.push(this.Trouble);
		this.Aspects.forEach(a => {
			if (IsInvokable(a)) { result.push(a); }
			else if (recursive) { result = result.concat(a.FindInvokables(true)); }
		});
		this.Conditions.forEach(a => {
			if (IsInvokable(a)) { result.push(a); }
			else if (recursive) { result = result.concat(a.FindInvokables(true)); }
		});
		this.Stunts.forEach(a => {
			if (IsInvokable(a)) { result.push(a); }
			else if (recursive) { result = result.concat(a.FindInvokables(true)); }
		})
		return result;
	}

	FindMarkable(input: string): MarkableObject | undefined {
		try{
			const Markables = this.FindMarkables(true);
			return FilterElement(Markables, input);
		}
		catch{
			const Markables = this.FindMarkables(false);
			return FilterElement(Markables, input);
		}

	}

	private FindMarkables(recursive : boolean): MarkableObject[] {
		const result = new Array<MarkableObject>();

		this.Tracks.forEach(a => {
			result.push(a);
		});
		this.Conditions.forEach(a => {
			if (a instanceof BoxCondition) { result.push(a); }
			else if (a instanceof FateFractal && recursive) { result.concat(a.FindMarkables(true)); }
		});

		return result;
	}

	FindFractal(input : string) : [FateFractal, string] | undefined {
		let Fractals : [FateFractal, string][] = [];
		
		this.Aspects.forEach(a => {if(a instanceof FateFractal) Fractals.push([a, 'a'])});
		this.Stunts.forEach(a => {if(a instanceof FateFractal) Fractals.push([a, 's'])});
		this.Conditions.forEach(a => {if(a instanceof FateFractal) Fractals.push([a, 'c'])});

		Fractals = Fractals.filter(f => f[0].match(input));
		if(Fractals.length == 1) return Fractals[0];
		if(Fractals.length == 0) return undefined;
		let errstring = 'Too many Fractals matched. Matches:';
		Fractals.forEach(a => errstring += `\n   ${a[0].FractalName}`);
		throw Error(errstring);
	}



	match(input: string) : boolean
	{
		let regStr = '.*';
		for (let i = 0; i < input.length; i++) {
			regStr +=  `${input[i]}.*`;
		}
		const expression = new RegExp(regStr, 'g');
		if(this.FractalName.match(expression) == null)
		{
			return false;
		}
		return true;
	}
}

function FilterElement<T extends Atom>(elements: Array<T>, input: string): T | undefined {
	const result = elements.filter(I => I.match(input));
	switch (result.length) {
		case 1:
			return result[0];
		case 0:
			return undefined;
		default:
			{
				let errstring = 'Provided input could not be resolved to a unique element, please provide a more complete match.\nMatches:\n'
				result.forEach(e => errstring += `   ${e.Name}`)
				throw Error(errstring);
			}
	}
}


export function IsFractal(element: FateFractal | any): element is FateFractal {
	return (element as FateFractal).FractalName !== undefined;
}

export const deepCopy = <T>(target: T): T => {
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