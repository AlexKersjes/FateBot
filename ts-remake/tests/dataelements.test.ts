import 'reflect-metadata';
import { FateFractal}  from '../fatefractal';
import { Aspect, Condition, Track } from '../dataelements';
import { FateOptions, FateVersion } from '../options';


const TestSheet = new FateFractal("Testy");
const TestAspect = new Aspect("A test aspect", "A test description");
const TestConcept =  new Aspect ("A test concept");
const StressTrack = new Track('Stress', 3);
StressTrack.StaircaseValues();
TestSheet.Aspects.push(TestAspect);
TestSheet.Tracks.push(StressTrack);
const TestUserId = "123456789";
const SuperTestSheet = new FateFractal("SuperTesty");
SuperTestSheet.Aspects.push(TestSheet);
SuperTestSheet.HighConcept = TestConcept;

test("Find an aspect and give it a free invoke", () => {

	const FoundAspect = TestSheet.FindInvokable("A test aspect")
	if (FoundAspect!= undefined)
		FoundAspect.AddFreeInvoke(TestUserId);
	expect(TestAspect.TryFreeInvoke(TestUserId)).toBe(true);
})

test("Recursively finding an aspect", () => {
	expect(SuperTestSheet.FindInvokable("A test aspect")).not.toBeUndefined()
})

test("Mark a stress box", () => {
	const Options = new FateOptions(FateVersion.Accelerated)
	Options.UseConditions = true;
	Options.DresdenStress = false;
	const markedvalue = TestSheet.FindMarkable("Stress")?.Mark(3, Options);
	expect(StressTrack.BoxMarks).toStrictEqual([false, false, true]);
	expect(markedvalue).toStrictEqual([3, true]);
})

