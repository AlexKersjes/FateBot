import { FateFractal}  from '../fatefractal';
import { Aspect, Condition, Track } from '../dataelements';
import { FateOptions } from '../options';


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

test('Matchtest', () => {
	expect(TestAspect.match('test')).toEqual(true);
	expect(TestAspect.match('a spec')).toEqual(true);
	expect(TestAspect.match('asp')).toEqual(true);
	expect(TestAspect.match('baron')).toEqual(false);
	expect(TestAspect.match('key')).toEqual(false);
	expect(TestAspect.match('sand')).toEqual(false);
})