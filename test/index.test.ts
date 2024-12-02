import { getNcVectorData, getToolPathSegmentsData } from '../src/index';
import { NcCode } from '../src/core/nc/model/nc-code.model';

const GCODE_ARRAY_1 = [
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

const GCODE_ARRAY = [
    'G21 G17 G90 F100',
    'M03 S1000',
    'G00 X5 Y5                 ; point B',
    'G01 X5 Y5 Z-1             ; point B',
    'G01 X5 Y15 Z-1            ; point C',
    'G02 X9 Y19 Z-1 I4 J0      ; point D',
    'G01 X23 Y19 Z-1           ; point E',
    'G01 X32 Y5 Z-1            ; point F',
    'G01 X21 Y5 Z-1            ; point G',
    'G01 X21 Y8 Z-1            ; point H',
    'G03 X19 Y10 Z-1 I-2 J0    ; point I',
    'G01 X13 Y10 Z-1           ; point J',
    'G03 X11 Y8 Z-1 I0 J-2     ; point K',
    'G01 X11 Y5 Z-1            ; point L',
    'G01 X5 Y5 Z-1             ; point B',
    'G01 X5 Y5 Z0',
    'G28  X0 Y0',
    'M05',
    'M30'
];
const INPUT_STRING = GCODE_ARRAY.join('\n');


console.log(GCODE_ARRAY_1)
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
    it.skip('Toolpath', (done: Function) => {
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