export class FateOptions {
	private GameMasters: string[] = [];
	Notifications: TurnNotifications = 0;
	UseConditions: boolean = false;
	DresdenStress: boolean = false;
	RequireGMforSituationAccess: boolean = true;
	FateVersion: FateVersion;
	PrefillSkills: boolean = true;
	SkillColumns: boolean = false;
	SkillMax: number | undefined = 5;
	CustomPrefix: string | undefined = undefined;
	private _defaultSkills: string[] = [];
	PlayerPermittedFolders: string[] = ['PCs']

	constructor(version: FateVersion) {
		this.FateVersion = version;
		if (version == FateVersion.Core) {
			this.SkillColumns = true;
			this.SkillMax = -1;
		}
		else if (version == FateVersion.Accelerated) {
			this.UseConditions = true;
		}
		else if (version == FateVersion.Condensed) {
			this.DresdenStress = true;
		}
	}

	prefillToggle() {
		this.PrefillSkills = !this.PrefillSkills;
		return `Skill list prefilling ${this.PrefillSkills ? 'enabled' : 'disabled'}.`;
	}

	notificationType(arg: string): string {
		switch (arg.toLowerCase()) {
			case 'dm':
				this.Notifications = TurnNotifications.DMNotification;
				break;
			case 'channel':
				this.Notifications = TurnNotifications.ChannelNotification;
				break;
			default:
				this.Notifications = TurnNotifications.None;
		}
		return `Initiative notification type set to '${TurnNotifications[this.Notifications]}'.`;
	}
	GMCheck(UserId: string): boolean {
		return this.GameMasters.some(id => id === UserId);
	}
	GMToggle(UserId: string) {
		if (this.GMCheck(UserId))
			this.GameMasters.splice(this.GameMasters.indexOf(UserId), 1);
		else
			this.GameMasters.push(UserId);
	}

	get DefaultSkills() {
		if (this._defaultSkills.length != 0)
			return this._defaultSkills;
		else {
			let list: string[] = [];
			switch (this.FateVersion) {
				case FateVersion.Accelerated:
					return ['Careful', 'Clever', 'Flashy', 'Forceful', 'Quick', 'Sneaky'];
				case FateVersion.Condensed:
					list = ['Academics'];
				case FateVersion.Core:
					list.concat('Athletics', 'Burglary', 'Contacts', 'Crafts', 'Deceive', 'Drive', 'Empathy', 'Fight', 'Investigate', 'Lore', 'Notice', 'Physique', 'Provoke', 'Rapport', 'Resources', 'Shoot', 'Stealth', 'Will');
					return list;

			}
		}
	}
}

export enum TurnNotifications {
	None = 0,
	DMNotification = 1,
	ChannelNotification = 2
}

export enum FateVersion {
	Core = 0,
	Accelerated = 1,
	Condensed = 2
}
