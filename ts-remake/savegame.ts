import Discord = require('discord.js');
class SaveGame {
	GameName: string;
	Password: string = '';
	CurrentGuild: string | undefined;
	Folders: Folder[];
	Options: FateOptions = new FateOptions();

	constructor(GameName: string, message: Discord.Message) {
		this.GameName = GameName;
		this.CurrentGuild = message.guild?.id;
		this.Options.GameMasters = [message.author.id];
		this.Folders = [new Folder('PCs'), new Folder('NPCs'), new Folder('Shortlist')]
	}
}

class Folder {
	FolderName: string;
	Contents: FateFractal[] = [];
	constructor(Name: string) {
		this.FolderName = Name;
	}
	public add(object: FateFractal) {
		this.Contents.push(object)
	}
	public remove(object: FateFractal) {
		this.Contents.splice(this.Contents.indexOf(object), 1)
	}
	public removebyindex(index: number) {
		this.Contents.splice(index, 1);
	}
}

class FateFractal {
	FractalName: string;
	HighConcept: Aspect | undefined;
	Trouble: Aspect | undefined;
	Aspects: (Aspect | FateFractal)[] = [];
	Tracks: Track[] = [];
	Stunts: (Stunt | FateFractal)[] = [];
	Conditions: (BoxCondition | Condition | FateFractal)[] = [];
	Skills: SkillList = new SkillList;

	constructor(Name: string, Prototype?: FateFractal) {
		this.FractalName = Name;
		if (Prototype) {

		}
	}
}


class Element {
	Name: string;
	Description: string | undefined = undefined;


	constructor(Name: string, Description?: string) {
		this.Name = Name;
		this.Description = Description;
	}
}




enum ConditionSeverity {
	Fleeting,
	Sticky,
	Lasting
}


type Constructor<T = {}> = new (...args: any[]) => T;

function Conditionable<TBase extends Constructor>(Base: TBase)
{
	return class extends Base {
		constructor(...args: any[]) {
			super(...args);
		}
		Severity: ConditionSeverity = ConditionSeverity.Fleeting;
	}
}

function Markable<TBase extends Constructor>(Base: TBase) {
	return class extends Base {
		constructor(...args: any[]) {
			super(...args);
		}
		Boxes: boolean[] = [false];
		SetMaxBoxes(n: number) { this.Boxes = new Array<boolean>(n).fill(false); }

		Mark(int: number, Options?: FateOptions) {

			if (Options?.DresdenStress) {
				if (int > 0) {
					let index = 0;
					while (int > 0) {
						if (index > this.Boxes.length) {
							throw Error(`Could not fully absorb hit. ${int} boxes left.`);
						}
						if (!this.Boxes[index]) {
							this.Boxes[index] = true;
							int--;
						}
						index++;
					}
				}
				else if (int < 0) {
					this.Boxes.reverse();
					int = -int;
					let index = 0;
					while (int > 0) {
						if (index > this.Boxes.length) {
							throw Error('Could not recover more boxes.');
						}
						if (this.Boxes[index]) {
							this.Boxes[index] = false;
							int--;
						}
						index++;
					}
					this.Boxes.reverse();
				}
				return;
			}

			this.Boxes[int + 1] = !this.Boxes[int + 1];
		}

		MarkedBoxes(): number {
			let total = 0;
			this.Boxes.forEach(bool => { if (bool) { total++ } });
			return total;
		}
	}
}

function Invokable<TBase extends Constructor>(Base: TBase) {
	return class extends Base {
		Shifts: number = 2;
		FreeInvokes: string[] = []
		public TryFreeInvoke(UserId: string): boolean {
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

class Track extends Markable(Element) { constructor(Name: string, Boxes: number, Description?: string) { super(Name, Description); this.SetMaxBoxes(Boxes) } }
class Stunt extends Invokable(Element) {}
class Aspect extends Invokable(Element) {}
class Condition extends Conditionable(Invokable(Element)) { constructor(Name: string, Severity: ConditionSeverity, Description?:string){super(Name,Description); this.Severity = Severity;} }
class BoxCondition extends Markable(Condition) { constructor(Name: string, Severity: ConditionSeverity, Boxes: number, Description?:string){super(Name, Severity, Description); this.SetMaxBoxes(Boxes);} }
