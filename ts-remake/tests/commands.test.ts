jest.mock('../responsetools');

import 'reflect-metadata';
import * as tools from '../responsetools';
import { SaveGame, Player } from '../savegame';
import { FateVersion } from '../options';
import { FateFractal } from '../fatefractal';
import { Aspect } from '../dataelements';
import { charselectCommand } from '../Commands/charselect'
import * as Discord from 'discord.js';

const game = new SaveGame('testy', '1234', FateVersion.Accelerated);
const fractal1 = new FateFractal('testy1', game.Options);
const fractal2 = new FateFractal('testy2', game.Options);
const fractal3 = new FateFractal('testy3', game.Options);
const fractal4 = new FateFractal('testy4', game.Options);
const fractal5 = new FateFractal('testy5', game.Options);
const fractal6 = new FateFractal('testy6', game.Options);

const p  = new Player('7893');
const p2 = new Player('6523');
p2.CurrentCharacter = fractal6;
const c = p.CurrentCharacter = new FateFractal('Main Fractal');
c.Aspects = [fractal1, new Aspect('Your mama\'s testin.'), fractal2];
c.Conditions = [fractal3];
c.Stunts = [fractal4, fractal5];
game.Players = [p, p2];

const charselect = new charselectCommand();

test('iceboxing', async () => {
	await charselect.execute((({mentions : {users: { array(){return []}}},author : {id: '6523'}} as unknown) as Discord.Message), ['i'],(({} as unknown) as Discord.Client), game);
	expect (game.Folders[0].Contents).toStrictEqual([fractal6]);
	expect (p2.CurrentCharacter).toBe(undefined);
	await charselect.execute((({mentions : {users: { array(){return []}}},author : {id: '7893'}} as unknown) as Discord.Message), ['i', '-a', '1'],(({} as unknown) as Discord.Client), game);
	expect (game.Folders[0].Contents).toStrictEqual([fractal6, fractal1]);
	await charselect.execute((({mentions : {users: { array(){return []}}},author : {id: '7893'}} as unknown) as Discord.Message), ['switch', '3'],(({} as unknown) as Discord.Client), game);
	expect (p.CurrentCharacter).toStrictEqual(fractal3);
	expect (fractal3.Conditions).toStrictEqual([c]);
	tools.responseQueue.AddQueue('yes');
	await charselect.execute((({channel:{send(string: string){return string;}},mentions : {users: { array(){return []}}},author : {id: '7893'}} as unknown) as Discord.Message), ['1'],(({} as unknown) as Discord.Client), game);
	expect (p.CurrentCharacter).toStrictEqual(fractal1);
	expect (game.Folders[0].Contents).toStrictEqual([fractal6, fractal3]);
})