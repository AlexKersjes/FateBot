import * as Discord from 'discord.js';
import * as fs from 'fs';
import { SaveGame, defaultServerObject } from './savegame';
import { deserialize } from 'class-transformer';
import { clearInterval } from 'timers';
export class Games {
	private static instance: Games;
	private Collection: Discord.Collection<string, SaveGame> = new Discord.Collection<string, SaveGame>();
	private _defaults: defaultServerObject = new defaultServerObject();
	private constructor() {
		try {
			this._defaults = deserialize(defaultServerObject, fs.readFileSync(`${process.env.SAVEPATH}defaultservers.json`, 'utf-8'));
		}
		catch (error) {
			console.log(error);
		}
		try {
			console.log('Loading default games');
			this._defaults.loadAll(this.Collection);
		}
		catch (error) {
			console.log('error during loading default games');
			console.log(error);
		}
	}
	static get(id: string) {
		if(!Games.instance)
			Games.instance = new Games();
		return this.instance.Collection.get(id);
	}
	static getAll() {
		if(!Games.instance)
			Games.instance = new Games();
		return this.instance.Collection;
	}
	static get Defaults() {
		if(!Games.instance)
			Games.instance = new Games();
		return this.instance._defaults;
	}

	static set (id: string, save: SaveGame) {
		if(!Games.instance)
			Games.instance = new Games();
		return this.instance.Collection.set(id, save);
	}

	static initialize(){
		Games.instance = new Games();
	}

}

export class ClientResources {
	private static instance: ClientResources;
	private _client: Discord.Client;
	private _executing = new Discord.Collection<string, Discord.Message[]>();
	private _timers = new Discord.Collection<string, NodeJS.Timeout>();
	private constructor() {
		this._client = new Discord.Client({ 'messageCacheMaxSize': 2000 })
	}
	static get Client(): Discord.Client {
		if (!ClientResources.instance)
			ClientResources.instance = new ClientResources();
		return ClientResources.instance._client;
	}
	static get Executing() {
		if (!ClientResources.instance)
			ClientResources.instance = new ClientResources();
		return ClientResources.instance._executing;
	}

	static setSave(serverID : string, interval: NodeJS.Timeout) {
		if (!ClientResources.instance)
			ClientResources.instance = new ClientResources();
		this.instance._timers.set(serverID, interval);
	}

	static stopSave(serverID : string){
		if (!ClientResources.instance)
			ClientResources.instance = new ClientResources();
		const interval = this.instance._timers.get(serverID);
		if(interval)
			clearInterval(interval);
	}
}