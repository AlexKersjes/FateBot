import { Skill, SkillLibrary } from './skills';
import { Atom, Aspect, Condition, Track, Stunt, BoxCondition, InvokableObject, MarkableObject, IsInvokable, Boost } from './dataelements'
import { Type, plainToClass, Exclude, classToClass } from 'class-transformer';
import { FateOptions } from './options';
import { GuildMember, Message } from 'discord.js';
import { sheetembed } from './embeds';
export class FateFractal {
	FractalName: string;
	FatePoints: number;
	Refresh: number;
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
	@Type(() => SkillLibrary)
	Skills: SkillLibrary = new SkillLibrary();
	CurrentLocation: string | undefined;
	imgUrl: string | undefined;
	NPC: boolean;
	Hidden: boolean | undefined;

	@Exclude()
	private Member: GuildMember | undefined;
	@Exclude()
	private ActiveSheets : Message[] = [];
	
	subscribeSheet(message:Message, GuildMember: GuildMember) {
		this.Member = GuildMember
		if(this.ActiveSheets.includes(message))
			return;
		this.ActiveSheets.push(message);
	}
	unsubscribeSheet(message:Message) {
		const index = this.ActiveSheets.indexOf(message);
		if (index == -1)
			return;
		this.ActiveSheets.splice(index, 1);
	}
	updateActiveSheets() {
		if(this.Member == undefined)
			return;
		const embed = sheetembed(this, this.Member)	
		this.ActiveSheets.forEach(m => m.edit(embed));
	}

	constructor(Name: string, Options?: FateOptions, NPC: boolean = false, Prototype?: FateFractal) {
		this.FractalName = Name;
		this.NPC = NPC;
		if (Options && !NPC)
			this.Skills.CreateList(undefined, Options.PrefillSkills, Options);
		if (NPC) {
			this.FatePoints = 0;
			this.Refresh = 0;
		}
		else {
			this.FatePoints = 3;
			this.Refresh = 3;
		}

		if (Prototype) {
			const cp = plainToClass(FateFractal, classToClass(Prototype))
			cp.FractalName = Name;
			this
			return cp;
		}

	}

	FindSkill (input: string) : Skill | undefined {
		const found = this.Skills.FindSkill(input);
		if(found == undefined)
			return undefined;
		return found[0];
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

	private FindInvokables(recursive: boolean): InvokableObject[] {
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
		try {
			const Markables = this.FindMarkables(true);
			return FilterElement(Markables, input);
		}
		catch{
			const Markables = this.FindMarkables(false);
			return FilterElement(Markables, input);
		}

	}

	private FindMarkables(recursive: boolean): MarkableObject[] {
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

	FindFractal(input: string): [FateFractal, string] | undefined {
		let Fractals: [FateFractal, string][] = [];

		this.Aspects.forEach(a => { if (a instanceof FateFractal) Fractals.push([a, 'a']) });
		this.Stunts.forEach(a => { if (a instanceof FateFractal) Fractals.push([a, 's']) });
		this.Conditions.forEach(a => { if (a instanceof FateFractal) Fractals.push([a, 'c']) });

		Fractals = Fractals.filter(f => f[0].match(input));
		if (Fractals.length == 1) return Fractals[0];
		if (Fractals.length == 0) return undefined;
		let errstring = 'Too many Fractals matched. Matches:';
		Fractals.forEach(a => errstring += `\n   ${a[0].FractalName}`);
		throw Error(errstring);
	}

	FindAllFractals() : FateFractal[] {
		let result = new Array<FateFractal>(0);
		this.Aspects.forEach(a => {
			if (IsFractal(a)) { result.push(a); result.concat(a.FindAllFractals()); }
		});
		this.Conditions.forEach(a => {
			if (IsFractal(a)) { result.push(a); result.concat(a.FindAllFractals()); }
		});
		this.Stunts.forEach(a => {
			if (IsFractal(a)) { result.push(a); result.concat(a.FindAllFractals()); }
		})
		return result;
	}


	convertConditionsToAspects() {
		this.Conditions.forEach(c => {
			if(c instanceof FateFractal)
				this.Aspects.push(c);
			else{
				this.Aspects.push(c.toAspect());
			}
		});
		this.Conditions = [];
		this.updateActiveSheets();
	}

	RepairConnections() {
		this.Skills.RepairConnections();
		this.FindAllFractals().forEach(f => f.Skills.RepairConnections())
	}

	match(input: string): boolean {
		let regStr = '.*';
		for (let i = 0; i < input.length; i++) {
			regStr += `${input[i]}.*`;
		}
		const expression = new RegExp(regStr, 'g');
		if (this.FractalName.match(expression) == null) {
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