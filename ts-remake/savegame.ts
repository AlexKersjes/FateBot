import Discord = require('discord.js');
import * as fs from 'fs';
import { FateFractal } from './fatefractal';
import { Type, classToClass } from 'class-transformer';
import { FateOptions } from './options';
import { ChannelDictionary } from './channelstructure';
import { serialize , deserialize } from 'class-transformer';
export class SaveGame {
	GameName: string;
	Password: string = '';
	CurrentGuild: string | undefined;
	
	@Type(() => Player)
	Players : Player[] = new Array<Player>();
	@Type(() => Folder)
	Folders: Folder[];
	@Type(() =>FateOptions)
	Options: FateOptions = new FateOptions();
	@Type(() => ChannelDictionary)
	Channels: ChannelDictionary = new ChannelDictionary();

	constructor(GameName: string, message? : Discord.Message) {
		this.GameName = GameName;
		this.CurrentGuild = message?.guild?.id;
		if(message?.author.id)
			this.Options.GameMasters.push(message?.author.id);
		this.Folders = [new Folder('PCs'), new Folder('NPCs'), new Folder('Shortlist')]
	}

	static async save(save:SaveGame) {
		let copySave = classToClass(save);
		let copyString = JSON.stringify(serialize(copySave));
		fs.writeFileSync(`${process.env.SAVEPATH}${save.GameName}game.json`, copyString, 'utf-8');
	}
	static async load(gameName:string) : Promise<SaveGame> {
		let rawdata = fs.readFileSync( `${process.env.SAVEPATH}${gameName}game.json`, 'utf-8');
		let s2 = JSON.parse(rawdata);
		deserialize(SaveGame, s2);
		return (s2 as SaveGame);
	}
}

export class Folder {
	FolderName: string;
	@Type (() => FateFractal)
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

export class defaultServerObject {
	private lastLogged : [string, string][] = [];
	add(guild : Discord.Guild, gameName: string)
	{
		this.delete(guild);
		this.lastLogged.push([guild.id, gameName])
	}
	delete(guild: Discord.Guild)
	{
		const g = this.lastLogged.find(i => guild.id === i[0]);
		if(g != undefined)
			this.lastLogged.splice(this.lastLogged.indexOf(g), 1);
	}
	loadAll(games : Discord.Collection<string, SaveGame>) : void
	{
		this.lastLogged.forEach(i => {
			SaveGame.load(i[1]).then(s => {
				games.set(i[0], s); 
				console.log(`Loaded ${s.GameName} @ ${i[0]}`);
			});
		})
	}
}


export class Player
{
	id : string;
	CurrentCharacter : FateFractal | undefined;
	CurrentLocation : string | undefined;
	FatePoints : number = 0;

	constructor(id : Discord.User)
	{
		this.id = id.id;
	}
}