import { SkillList } from './skills';
import { Atom, Aspect, Condition, Track, Stunt, BoxCondition, InvokableObject, MarkableObject, IsInvokable, Boost } from './dataelements'
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
		const Invokables = this.FindInvokables();
		return FilterElement(Invokables, input);
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

	FindMarkable(input: string): MarkableObject | undefined {
		const Markables = this.FindMarkables();
		return FilterElement(Markables, input);
	}

	private FindMarkables(): MarkableObject[] {
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

	match(input: string) : boolean
	{
		let regStr = '.*';
		for (let i = 0; i < input.length; i++) {
			regStr +=  `${input[i]}.*`;
		}
		const expression = new RegExp(regStr, 'gi');
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