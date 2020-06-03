
export class FateOptions
{
	GameMasters: string[] = [];
	Notifications : TurnNotifications = 0;
	UseConditions : boolean = false;
	DresdenStress : boolean = false;
	FateVersion : FateVersion = 1;
	SkillColumns : boolean = false;
	SkillMax : number | undefined = 5;

	notificationType (arg : string) : string 
	{
		switch (arg)
		{
			case 'dm' :
				this.Notifications = TurnNotifications.DMNotification;
				break;
			case 'channel' :
				this.Notifications = TurnNotifications.ChannelNotification;
			break; 
			default :
				this.Notifications = TurnNotifications.None;
		}
		return `Initiative notification type set to '${TurnNotifications[this.Notifications]}'.`;
	}
	GMCheck(UserId:string | undefined) : boolean
	{
		if(!UserId)
		{return false;}
		return this.GameMasters.some(id => id === UserId);
	}
}

export enum TurnNotifications
{
	None = 0,
	DMNotification = 1,
	ChannelNotification = 2
}

export enum FateVersion
{
	Core = 0,
	Accelerated = 1
}
