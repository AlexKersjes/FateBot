import 'reflect-metadata';
import { SkillLibrary } from "../skills";
import { serialize, deserialize } from 'class-transformer';

const lib = new SkillLibrary();

const list = lib.CreateList('Stats');

const sneak = list.AddSkill('Sneaky', 2);
const wis = list.AddSkill('Wisdom', 1);

const list2 = lib.CreateList('Skills')

const herb = list2.AddSkill('Herblore', 1);
const pickp = list2.AddSkill('Pick Pocketing', 5);


test('Skillpoints, finding skills in list', () => {
	list.SkillPoints = 1;
	expect(() => list.AddSkill('Strength', 2)).toThrowError();
	expect(list.AddSkill('Strength', 1)).toEqual(list.FindSkill('Strenth'));
	expect(() => list.AddSkill('Dexterity', 1)).toThrowError();
	expect(list.SkillPoints).toEqual(0);
	expect(() => list.AddSkillPoints(-1)).toThrowError();
	list.AddSkillPoints(1);
	expect(list.AddSkill('Dexterity', 1)).toEqual(list.FindSkill('dex'));
});

test('Attaching skills', () => {
	lib.Attach('herb', 'wis');
	expect(list2.FindSkill('herb')?.AdjustedValue).toBe(herb.Value + wis.Value);
	expect(() => lib.Attach('wis', 'sneak')).toThrowError();
	expect(() => lib.Attach('wis', 'herb')).toThrowError();
})

test('(De)serialisation, connection repair.', () => {
	const temp = serialize(lib);
	const deser = deserialize(SkillLibrary, temp);
	const deserherb = deser.FindSkill('herb');
	if(deserherb == undefined)
		throw Error('Finding skills is borked.')
	expect(() => deserherb[0].AdjustedValue).toThrowError();
	deser.RepairConnections();
	expect(deserherb[0].AdjustedValue).toBe(herb.Value + wis.Value);
})

test('Skill deletion', () => {
	const l = list.Skills.length;
	list.DeleteSkill(wis);
	expect(list.Skills.length).toBe(l - 1);
	expect(herb.AdjustedValue).toBe(herb.Value);
})