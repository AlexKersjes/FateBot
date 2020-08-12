import Discord = require('discord.js');
import * as fs from 'fs';
import { Type, Exclude, classToClass } from 'class-transformer';
import { FateOptions, FateVersion } from './options';
import { ChannelDictionary } from './channelstructure';
import { serialize , deserialize } from 'class-transformer';
import { FateFractal } from './fatefractal';
import { ClientResources } from './singletons';
export class SaveGame {
	@Exclude()
	private _dirty : boolean = false;

	GameName: string;
	Password: string = '';
	CurrentGuild: string | undefined;
	
	@Type(() => Player)
	Players : Player[] = new Array<Player>();
	@Type(() => Folder)
	Folders: Folder[];
	@Type(() =>FateOptions)
	Options: FateOptions;
	@Type(() => ChannelDictionary)
	ChannelDictionary: ChannelDictionary = new ChannelDictionary();
	@Type(() => FateFractal)
	GlobalSituation: FateFractal = new FateFractal('Global situation', this.Options, true);
	
	@Exclude()
	CurrentFolder: undefined | string;
	SaveTimer: number | undefined;

	constructor(GameName: string, CurrentGuild : string, version : FateVersion) {
		this.GameName = GameName;
		this.CurrentGuild = CurrentGuild;
		this.Options = new FateOptions(version);
		this.Folders = [new Folder('PCs'), new Folder('NPCs'), new Folder('Shortlist')]
	}

	async save() : Promise<void> {
		if(!this._dirty)
			return;
		this._dirty = false;
		let copySave : SaveGame = classToClass(this);
		let copyString = serialize(copySave);
		fs.writeFileSync(`${process.env.SAVEPATH}${this.GameName}game.json`, copyString, 'utf-8');
	}

	static async load(gameName:string) : Promise<SaveGame> {
		let rawdata = fs.readFileSync( `${process.env.SAVEPATH}${gameName}game.json`, 'utf-8');
		let s2 = deserialize(SaveGame, rawdata);
		s2.onLoad();
		return s2;
	}

	onLoad() {
		if(this.SaveTimer && this.CurrentGuild)
			ClientResources.setSave(this.CurrentGuild, this, this.SaveTimer);
		this.getAllToplevelFractals().forEach(f => f.RepairConnections());
	}

	getAllToplevelFractals() : FateFractal[] {
		let fractals: FateFractal[] = [];
		this.Folders.forEach(f => fractals.concat(f.Contents));
		this.Players.forEach(p => {if(p.CurrentCharacter) fractals.push(p.CurrentCharacter)});
		this.ChannelDictionary.Channels.forEach(c => fractals.push(c.situation));
		return fractals;
	}

	getAllFractals() : FateFractal[] {
		let fractals: FateFractal[] = [];
		this.Folders.forEach(f => fractals.concat(f.Contents));
		this.Players.forEach(p => {if(p.CurrentCharacter) fractals.push(p.CurrentCharacter)});
		this.ChannelDictionary.Channels.forEach(c => fractals.push(c.situation));
		fractals.forEach(f => fractals.concat(f.FindAllFractals()))
		return fractals;
	}

	async passConfirm(message : Discord.Message) : Promise<boolean>
	{
		return new Promise(async(resolve, reject) => {
			if(this.Password == "")
			return resolve(true);
		const filter = (m: Discord.Message) => !m.author.bot;
		const channel = message.author.createDM();
		const collector = (await channel).createMessageCollector(filter);
		let stringPromise : Promise<string> = new Promise (function (resolve : (value: string) => any, reject) { 
			collector.once('collect', m => resolve((m as Discord.Message).content));
			setTimeout(() => reject(new Error('Password request timed out.')), 20000 ); 
		});
		(await channel).send('Please provide the game password:');
		try {
			const receivedString = await stringPromise.catch(err => reject(err));
			if(receivedString == this.Password)
				return resolve(true);
			else
				return resolve(false);
		}
		catch (err) {
			return reject(err);
		}
		finally {
			collector.stop();
			message.author.deleteDM();
		}
		});
		
	}

	getPlayerAuto(message: Discord.Message) : Player
	{
		const mentions = message.mentions.users.array();
		const mention : Discord.User | undefined = (mentions[0]?.bot ? mentions[1] :  mentions[0]) ?? undefined;
		if(mention && !mention.bot){
			if (this.Options.GMCheck(message.author.id))
				return this.getOrCreatePlayerById(mention.id);
			else
				throw Error('You do not have GM permission.');
		}


		return this.getOrCreatePlayerById(message.author.id);
	}

	getChannelAuto(message: Discord.Message)
	{
		return this.ChannelDictionary.FindDiscordChannel(message.channel);
	}

	getContestAuto(message: Discord.Message)
	{
		return this.getChannelAuto(message).Contest
	}

	getOrCreatePlayerById(UserId: string | undefined) {
		if(UserId == undefined)
			throw Error('A player Id is required.')
		let p = this.Players.find(i => UserId == i.id);
		if (!p) {
			p = new Player(UserId);
			this.Players.push(p);
		}
		return p;
	}

	dirty() {
		this._dirty = true;
	}
}

export class Folder {

	FolderName: string;
	@Type (() => FateFractal)
	Contents: FateFractal[] = [];
	constructor(Name: string) {
		this.FolderName = Name;
	}
	public add(object: FateFractal | undefined) {
		if(object == undefined)
			return;
		if(this.Contents.find(o => o.FractalName == object.FractalName))
			throw Error(`A fractal named ${object.FractalName} already exists in ${this.FolderName}.`)
		this.Contents.push(object)
	}
	public remove(object: FateFractal) {
		this.Contents.splice(this.Contents.indexOf(object), 1)
	}
	public removebyindex(index: number) {
		this.Contents.splice(index, 1);
	}

	findCharacter(FractalName: string) : FateFractal | undefined{
		const matched : FateFractal[] = [];
		this.Contents.forEach(f => {
			if(f.match(FractalName)) 
				matched.push(f)
		})
		if(matched.length == 0)
			return undefined;
		if(matched.length == 1)
			return matched[0];
		let errstring = 'Too many objects matched. Matches:';
		matched.forEach(a => errstring += `\n   ${a.FractalName}`);
		throw Error(errstring);
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
		const ServersCopy = classToClass(this);
		ServersCopy.lastLogged = ServersCopy.lastLogged.filter(i => i[0] != 'invalid');
		try{
			fs.writeFileSync(`${process.env.SAVEPATH}defaultservers.json`, serialize(ServersCopy), 'utf-8');
		}
		catch(err)
		{
			console.log(err);
		}
	}

}


export class Player
{
	id : string;
	@Type(() => FateFractal)
	CurrentCharacter : FateFractal | undefined;
	CurrentLocation : string | undefined;

	constructor(id : string)
	{
		this.id = id;
	}

	toString(){
		return `<@!${this.id}>`;
	}
}