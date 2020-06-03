import Discord = require('discord.js');
import { FateFractal } from './fatefractal';
import { FateOptions } from './options';
import { ChannelDictionary } from './channelstructure';
export class SaveGame {
	GameName: string;
	Password: string = '';
	CurrentGuild: string | undefined;
	Folders: Folder[];
	Options: FateOptions = new FateOptions();
	Channels: ChannelDictionary = new ChannelDictionary;

	constructor(GameName: string, message: Discord.Message) {
		this.GameName = GameName;
		this.CurrentGuild = message.guild?.id;
		this.Options.GameMasters = [message.author.id];
		this.Folders = [new Folder('PCs'), new Folder('NPCs'), new Folder('Shortlist')]
	}
}

export class Folder {
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