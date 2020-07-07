import Discord = require('discord.js');
import * as fs from 'fs';
import { deepCopy } from './fatefractal';
import { Type, classToClass } from 'class-transformer';
import { FateOptions } from './options';
import { ChannelDictionary } from './channelstructure';
import { serialize , deserialize } from 'class-transformer';
import { FateFractal } from './fatefractal';
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
			this.Options.GMToggle(message?.author.id);
		this.Folders = [new Folder('PCs'), new Folder('NPCs'), new Folder('Shortlist')]
	}

	async save() : Promise<void> {
		let copySave : SaveGame = deepCopy(this);
		let copyString = serialize(copySave);
		fs.writeFileSync(`${process.env.SAVEPATH}${this.GameName}game.json`, copyString, 'utf-8');
	}

	static async load(gameName:string) : Promise<SaveGame> {
		let rawdata = fs.readFileSync( `${process.env.SAVEPATH}${gameName}game.json`, 'utf-8');
		let s2 = deserialize(SaveGame, rawdata);
		return s2;
	}

	async passConfirm(message : Discord.Message) : Promise<boolean>
	{
		if(this.Password == "")
			return true;
		const filter = (m: Discord.Message) => !m.author.bot;
		const channel = message.author.createDM();
		const collector = (await channel).createMessageCollector(filter);
		let stringPromise : Promise<string> = new Promise (function (resolve : (value: string) => any, reject) { 
			collector.once('collect', m => resolve((m as Discord.Message).content));
			setTimeout(() => reject(new Error('Password request timed out.')), 20000 ); 
		}).catch(err => { throw err as Error });
		(await channel).send('Please provide the game password:');
		try {
			const receivedString = await stringPromise;
			if(receivedString == this.Password)
				return true;
			else
				return false;
		}
		catch (err) {
			(await channel).send(err.message);
			return false;
		}
		finally {
			collector.stop();
			message.author.deleteDM();
		}
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
	add(guildId : string, gameName: string)
	{
		this.delete(guildId);
		this.lastLogged.push([guildId, gameName])
	}
	delete(guildId: string)
	{
		const g = this.lastLogged.find(i => guildId  === i[0]);
		if(g != undefined)
			this.lastLogged.splice(this.lastLogged.indexOf(g), 1);
	}
	loadAll(games : Discord.Collection<string, SaveGame>) : void
	{
		this.lastLogged.forEach(async i => {

				SaveGame.load(i[1]).then(s => {
					games.set(i[0], s); 
					console.log(`Loaded ${s.GameName} @ ${i[0]}`);
				})
				.catch(e => i[0] = 'invalid');
		});
	}
	async save() : Promise<void>
	{
		const ServersCopy = deepCopy(this);
		ServersCopy.lastLogged = ServersCopy.lastLogged.filter(i => i[0] != 'invalid');
		try{
			fs.writeFileSync(`${process.env.SAVEPATH}defaultservers.json`, serialize(ServersCopy), 'utf-8');
		}
		catch(err)
		{
			console.log(err);
		}
	}

	constructor() {}
}


export class Player
{
	id : string;
	CurrentCharacter : FateFractal | undefined;
	CurrentLocation : string | undefined;

	constructor(id : Discord.User)
	{
		this.id = id.id;
	}
}