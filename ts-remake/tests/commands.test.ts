import * as g from '../savegame';
import { FateVersion } from '../options';
import { FateFractal } from '../fatefractal';

const game = new g.SaveGame('testy', '1234', FateVersion.Accelerated);
const fractal = new FateFractal('testy2', game.Options);
