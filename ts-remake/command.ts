import Discord = require('discord.js');
import { SaveGame } from './savegame';
export interface ICommand {
	name : string;
	description : string;
	helptext : string | undefined;
	admin : boolean;
	args : boolean;
	aliases : string[] | undefined;
	cooldown : number | undefined;
	execute(message : Discord.Message, args : string[], client : Discord.Client, save? : SaveGame) : void
}

export namespace ICommands{
	type Constructor<T> = {
		new (...args: any[]): T;
		readonly prototype: T;
	}

	const implementations: Constructor<ICommand>[] = [];
	export function GetImplementations() : Constructor<ICommand>[]{
		return implementations;
	}

	export function register<T extends Constructor<ICommand>>(ctor : T){
		implementations.push(ctor);
		return ctor;
	}
}