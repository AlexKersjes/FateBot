import { InvokableObject } from "./dataelements";

export class RollContest {
	InvokedAspects : InvokableObject[] = [];
	AllowedRolls : string[] = [];
	CurrentRoll : number = 0;
	CurrentOpposed : number =0;
}