import { getNcVectorData, getToolPathSegmentsData } from '../src/index';
import { NcCode } from '../src/core/nc/model/nc-code.model';

const GCODE_ARRAY = [
    'N1 G17 G20 G90 G94 G54',
    'N2 G0 Z0.25',
    'N3 X-0.5 Y0.',
    'N4 Z0.1',
    'N5 G01 Z0. F5.',
    'N6 G02 X0. Y0.5 I0.5 J0. F2.5',
    'N7 X0.5 Y0. I0. J-0.5',
    'N8 X0. Y-0.5 I-0.5 J0.',
    'N9 X-0.5 Y0. I0. J0.5',
    'N10 G01 Z0.1 F5.',
    'N11 G00 X0. Y0. Z0.25'
];
const INPUT_STRING = GCODE_ARRAY.join('\n');


describe('NC-Toolpath-Generator', () => {
    it('Interpreters', (done: Function) => {
        console.log(INPUT_STRING);
        const ncVectorDataPromise = getNcVectorData(INPUT_STRING);
        ncVectorDataPromise.then((ncVectorDataList) => {
            console.log(JSON.stringify(ncVectorDataList));
            expect(ncVectorDataList.length).toBe(GCODE_ARRAY.length);
            done();
        });
    });
    it.only('Toolpath', (done: Function) => {
        console.log(INPUT_STRING);
        const ncVectorDataPromise: Promise<NcCode[]> = getNcVectorData(INPUT_STRING);
        ncVectorDataPromise.then(async (ncVectorDataList: NcCode[]) => {
            const toolpath = await getToolPathSegmentsData(ncVectorDataList);
            console.log(toolpath);
            console.log(JSON.stringify(toolpath));
            done();
        });
    });
})