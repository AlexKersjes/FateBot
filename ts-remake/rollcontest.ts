import { InvokableObject } from "./dataelements";
import { Channel } from "./channelstructure";
import * as Discord from "discord.js";
import { Exclude } from "class-transformer";
import { Games, ClientResources } from "./singletons";

export class RollContest {
	Targets : [string, number][] = [];
	CurrentRoll: number = 0;
	CurrentOpposed: number = 0;
	private channelID : string;
	@Exclude()
	private _channel : Channel | undefined;
	@Exclude()
	private _discordChannel : Discord.Channel | undefined;
	DefaultTarget: number | undefined;

	
	constructor(id : string){
		this.channelID = id;
	};
	
	get Channel() : Channel {
		if(this._channel == undefined)
		{
			Games.getAll().find(save => {
				this._channel = save.ChannelDictionary.Channels.find(ch => ch.id == this.channelID);
				if(this._channel != undefined)
					return true;
				return false;
			})
		}
		if(this._channel == undefined)
			throw Error('Loading error. Relevant channel could not be found.')
		return this._channel;
	}

	get DiscordChannel() : Discord.Channel {
		if(this._discordChannel == undefined)
		{
			this._discordChannel = ClientResources.Client.channels.get(this.channelID);
		}
		if(this._discordChannel == undefined)
			throw Error('Loading error. Discord channel could not be found.')
		return this._discordChannel;
	}

	static fourDFudge(): [number, string] {
		let array = NDFudge(4);
		return sumDiceArray(array);
	}


	static NDFudgeToFour(numberOfDice: number, advantage: boolean): [number, string] {
		const array: [number, string][] = NDFudge(numberOfDice)
		let toFade: [number, string][] = []
		array.forEach(a => toFade.push(a));
		toFade.sort((a, b) => a[0] - b[0]);
		if (!advantage) {
			toFade.reverse();
		}

		if (array.length < 4)
			return sumDiceArray(array);

		for (let i = 0; i < toFade.length - 4; i++) {
			switch (toFade[i][0]) {
				case (-1):
					toFade[i][1] = process.env.MINUSFADED ?? '';
					break;
				case (0):
					toFade[i][1] = process.env.VOIDFADED ?? '';
					break;
				case (1):
					toFade[i][1] = process.env.PLUSFADED ?? '';
					break;
			}
			toFade[i][0] = 0;

		}
		if(advantage)
			array.reverse();
		return sumDiceArray(array);
	}

}

class Roll {
	
}

function sumDiceArray(array: [number, string][]): [number, string] {
	let string = '';
	let total = 0;

	array.map(x => {
		total += x[0];
		string += x[1] + ' ';

	});
	return [total, string];
}

function NDFudge(number: number): [number, string][] {
	const array: [number, string][] = [];
	for (let i = 0; i < number; i++) {
		const roll = Math.floor(3 * Math.random());

		switch (roll) {
			case 0:
				array.push([-1, process.env.MINUS ?? '']);
				break;
			case 1:
				array.push([0, process.env.VOID ?? '']);
				break;
			case 2:
				array.push([1, process.env.PLUS ?? '']);
				break;
		}
	}
	return array;
}

