import "reflect-metadata";
import { classToClass, serialize, deserialize } from 'class-transformer';
import { SaveGame } from '../savegame';
import 'fs';
import { FateFractal } from "../fatefractal";
import { Aspect, Track, Stunt, Condition, ConditionSeverity, BoxCondition } from "../dataelements";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { FateVersion } from "../options";

process.env.SAVEPATH = './';
const s = new SaveGame('TestGame', '1234', FateVersion.Accelerated);
let FractalBase = new FateFractal('Testy');
s.Folders[0].Contents.push(FractalBase);
let TestAspect = new Aspect('TestosAspectost');
let TestFractal = new FateFractal('Fractalliation');
FractalBase.Aspects.push(TestFractal);
FractalBase.Conditions.push(TestFractal);
FractalBase.Stunts.push(TestFractal);
FractalBase.HighConcept = TestAspect;
FractalBase.Trouble = TestAspect;
FractalBase.Aspects.push(TestAspect);
FractalBase.Tracks.push(new Track('Stress', 3));
FractalBase.Stunts.push(new Stunt('Parkour', 'Running like Mad'));
FractalBase.Conditions.push(new Condition('Mouthful of tests', ConditionSeverity.Fleeting));
FractalBase.Conditions.push(new BoxCondition('Boxy', ConditionSeverity.Fleeting, 2));



test('Actual save/load functionality', async () => {
	s.dirty();
	await s.save();
	let s2 = await SaveGame.load(s.GameName);
	expect(s2).toEqual(s);
	unlinkSync(`${process.env.SAVEPATH}${s.GameName}game.json`);
})

test('Serialisation test to ensure consistent loading.', () => {
	let copyofs = classToClass(s);
	let stringofs = serialize(copyofs);
	writeFileSync('./testy.json', stringofs, 'utf-8');
	let rawdata = readFileSync('./testy.json', 'utf-8');
	let s2 = deserialize(SaveGame, rawdata);
	expect(s).toStrictEqual(s2);
	unlinkSync('./testy.json');
})