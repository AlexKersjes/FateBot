import { FateFractal}  from './fatefractal';
import { Aspect, Condition, } from './dataelements';

const TestSheet = new FateFractal("Testy");
const TestAspect = new Aspect("A test aspect", "A test description");
TestSheet.Aspects.push(TestAspect)
const TestUserId = "123456789";

test("Add a free invoke", () => {

	const FoundAspect = TestSheet.FindInvokable("A test aspect")
	if (FoundAspect!= undefined)
		FoundAspect.AddFreeInvoke(TestUserId);
	expect(TestAspect.FreeInvokes).toStrictEqual([TestUserId]);
})