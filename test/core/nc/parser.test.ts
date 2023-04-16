import fs from 'fs';

import {     
    parseLine,
    parseStream,
    parseString,
    parseStringSync,
    parseFile,
    parseFileSync } from '../../../src/core/nc/parser'

    
describe('gcode-parser', () => {
    beforeEach(() => {
        jest.setTimeout(100000);
    });
    describe('Pass a null value as the first argument', () => {
        it('should call parseString\'s callback.', (done) => {
            parseString(null, (err: any, results: any) => {
                expect(err).toBeNull();
                expect(results.length).toBe(0);
                done();
            });
        });
        it('should call parseFile\'s callback.', (done) => {
            parseFile(null, (err: any, results: any) => {
                // expect(!!err).toBeTruthy();
                done();
            });
        });
        it('should call parseStream\'s callback.', (done) => {
            parseStream(null, (err: any, results: any) => {
                expect(!!err).toBeTruthy();
                done();
            });
        });
    });

    describe('Pass an empty text as the first argument', () => {
        it('should get empty results.', (done) => {
            const sampleText = '';
            parseString(sampleText, (err: any, results: any) => {
                expect(results.length).toBe(0);
                done();
            });
        });
    });

    describe('Contains only lines', () => {
        it('should not parse G-code commands.', (done) => {
            const file = 'test/fixtures/circle.gcode';

            parseFile(file, { noParseLine: true }, (err: any, results: any) => {
                expect(results.length).toBe(7);
                done();
            })
            .on('data', (data) => {
                expect(typeof data).toBe('object');
                expect(typeof data.line).toBe('string');
                expect(data.words).toBeUndefined();
            })
            .on('end', (results) => {
                expect(Array.isArray(results)).toBeTruthy();
                expect(results.length).toBe(7);
            });
        });
    });

    describe('Invalid G-code words', () => {
        it('should ignore invalid g-code words', (done) => {
            const data = parseLine('messed up');
            expect(typeof data).toBe('object');
            expect(data.line).toBe('messed up');
            expect(data.words).toEqual([]);
            done();
        });
    });

    describe('Commands', () => {
        it('should be able to parse $ command (e.g. Grbl).', (done) => {
            const data = parseLine('$H $C');
            expect(typeof data).toBe('object');
            expect(typeof data.line).toBe('string');
            expect(data.words).toEqual([]);
            expect(data.cmds).toEqual(['$H', '$C']);
            done();
        });
        it('should be able to parse JSON command (e.g. TinyG, g2core).', (done) => {
            { // {sr:{spe:t,spd,sps:t}}
                const data = parseLine('{sr:{spe:t,spd:t,sps:t}}');
                expect(typeof data).toBe('object');
                expect(typeof data.line).toBe('string');
                expect(data.words).toEqual([]);
                expect(data.cmds).toEqual(['{sr:{spe:t,spd:t,sps:t}}']);
            }
            { // Request Motor Timeout: {mt:n}
                const data = parseLine('{mt:n}');
                expect(typeof data).toBe('object');
                expect(typeof data.line).toBe('string');
                expect(data.words).toEqual([]);
                expect(data.cmds).toEqual(['{mt:n}']);
            }

            done();
        });
        it('should be able to parse % command (e.g. bCNC, CNCjs).', (done) => {
            { // %wait
                const data = parseLine('%wait');
                expect(typeof data).toBe('object');
                expect(typeof data.line).toBe('string');
                expect(data.words).toEqual([]);
                expect(data.cmds).toEqual(['%wait']);
            }

            { // %wait ; Wait for the planner queue to empty
                const data = parseLine('%wait ; Wait for the planner queue to empty');
                expect(typeof data).toBe('object');
                expect(typeof data.line).toBe('string');
                expect(data.words).toEqual([]);
                expect(data.cmds).toEqual(['%wait ; Wait for the planner queue to empty']);
            }

            { // %msg Restart spindle
                const data = parseLine('%msg Restart spindle');
                expect(typeof data).toBe('object');
                expect(typeof data.line).toBe('string');
                expect(data.words).toEqual([]);
                expect(data.cmds).toEqual(['%msg Restart spindle']);
            }

            { // %zsafe=10
                const data = parseLine('%zsafe=10');
                expect(typeof data).toBe('object');
                expect(typeof data.line).toBe('string');
                expect(data.words).toEqual([]);
                expect(data.cmds).toEqual(['%zsafe=10']);
            }

            { // %x0=posx,y0=posy,z0=posz
                const data = parseLine('%x0=posx,y0=posy,z0=posz');
                expect(typeof data).toBe('object');
                expect(typeof data.line).toBe('string');
                expect(data.words).toEqual([]);
                expect(data.cmds).toEqual(['%x0=posx,y0=posy,z0=posz']);
            }

            done();
        });
    });

    describe('Comments', () => {
        it('should strip everything after a semi-colon to the end of the loine including preceding spaces.', (done) => {
            const sampleText = [
                '  %  ',
                '  #',
                '; Operation:    0',
                '; Name:',         
                '; Type:         Pocket',
                '; Paths:        3',
                '; Direction:    Conventional',
                '; Cut Depth:    3.175',
                '; Pass Depth:   1.9999999999999998',
                '; Plunge rate:  127',
                '; Cut rate:     1016',
                '  ' // empty line
            ].join('\n');

            parseString(sampleText, (err: any, results: any) => {
                results = results.filter((result: any[]) => result.length > 0);
                expect(results.length).toBe(0);
                done();
            });
        });
    });

    describe('Parentheses', () => {
        it('should remove anything inside parentheses.', (done) => {
            const sampleText = [
                '(Generated with: DXF2GCODE, Version: Py3.4.4 PyQt5.4.1, Date: $Date: Sun Apr 17 16:32:22 2016 +0200 $)',
                '(Created from file: G:/Dropbox/Konstruktionen/20161022 - MicroCopter 180/complete.dxf)',
                '(Time: Sun Oct 23 12:30:46 2016)',
                'G21 (Units in millimeters)  G90 (Absolute programming)',
                '$H',
                'F1000',
                '(*** LAYER: 0 ***)',
                'T5 M06',
                'S200',
                '(* SHAPE Nr: 0 *)',
                'G0 X 180.327 Y 137.080',
                'M03'
            ].join('\n');
            const expectedResults = [
                '',
                '',
                '',
                'G21G90',
                '',
                'F1000',
                '',
                'T5M6',
                'S200',
                '',
                'G0X180.327Y137.08',
                'M3'
            ];

            parseString(sampleText, (err: any, results: any) => {
                results = results.map((result: any) => {
                    const words = result.words.map((word: any) => {
                        return word.join('');
                    });
                    return words.join('');
                });
                expect(results).toEqual(expectedResults);
                done();
            });
        });
    });

    describe('File not found exception', () => {
        it('should fail the callback if a file is not present.', (done) => {
            parseFile('test/fixtures/NO_FILE_ERROR', (err: any, results: any) => {
                expect(err).not.toBeNull();
                expect(err.code).toBe('ENOENT');
                done();
            });
        });
    });

    describe('Event listeners', () => {
        it('should call event listeners when loading G-code from file.', (done) => {
            const file = 'test/fixtures/circle.gcode';

            parseFile(file, (err: any, results: any) => {
                expect(results.length).toBe(7);
                done();
            })
            .on('data', (data) => {
                expect(typeof data).toBe('object');
            })
            .on('end', (results) => {
                expect(Array.isArray(results)).toBeTruthy();
                expect(results.length).toBe(7);
            });
        });
        it('should call event listeners when loading G-code from stream.', (done) => {
            const stream = fs.createReadStream('test/fixtures/circle.gcode', { encoding: 'utf8' });

            parseStream(stream, (err: any, results: any) => {
                expect(results.length).toBe(7);
                done();
            })
            .on('data', (data) => {
                expect(typeof data).toBe('object');
            })
            .on('end', (results) => {
                expect(Array.isArray(results)).toBeTruthy();
                expect(results.length).toBe(7);
            });
        });
        it('should call event listeners when loading G-code from string.', (done) => {
            const string = fs.readFileSync('test/fixtures/circle.gcode', 'utf8');

            parseString(string, (err: any, results: any) => {
                expect(results.length).toBe(7);
                done();
            })
            .on('data', (data) => {
                expect(typeof data).toBe('object');
            })
            .on('end', (results) => {
                expect(Array.isArray(results)).toBeTruthy();
                expect(results.length).toBe(7);
            });
        });
    });

    describe('parseLine()', () => {
        it('should return expected results.', (done) => {
            expect(parseLine('G0 X0 Y0')).toEqual({
                line: 'G0 X0 Y0',
                words: [ [ 'G', 0 ], [ 'X', 0 ], [ 'Y', 0 ] ]
            });
            expect(parseLine('G0 X0 Y0', { flatten: true })).toEqual({
                line: 'G0 X0 Y0',
                words: [ 'G0', 'X0', 'Y0' ]
            });
            done();
        });
    });

    describe('parseStream()', () => {
        const expectedResults = [
            {
                line: 'G0 X-5 Y0 Z0 F200',
                words: [['G', 0], ['X', -5], ['Y', 0], ['Z', 0], ['F', 200]]
            },
            {
                line: 'G2 X0 Y5 I5 J0 F200',
                words: [['G', 2], ['X', 0], ['Y', 5], ['I', 5], ['J', 0], ['F', 200]]
            },
            {
                line: 'G02 X5 Y0 I0 J-5',
                words: [['G', 2], ['X', 5], ['Y', 0], ['I', 0], ['J', -5]]
            },
            {
                line: 'G02 X0 Y-5 I-5 J0',
                words: [['G', 2], ['X', 0], ['Y',-5], ['I', -5], ['J', 0]]
            },
            {
                line: 'G02 X-5 Y0 I0 J5',
                words: [['G', 2], ['X', -5], ['Y', 0], ['I', 0], ['J', 5]]
            },
            {
                line: 'G01 Z1 F500',
                words: [['G', 1], ['Z', 1], ['F', 500]]
            },
            {
                line: 'G00 X0 Y0 Z5',
                words: [['G', 0], ['X', 0], ['Y', 0], ['Z', 5]]
            }
        ];

        it('should get expected results in the callback.', (done) => {
            const stream = fs.createReadStream('test/fixtures/circle.gcode', { encoding: 'utf8' });
            parseStream(stream, (err: any, results: any) => {
                expect(results).toEqual(expectedResults);
                done();
            });
        });
    });

    describe('parseString()', () => {
        const expectedResults = [
            {
                line: 'G0 X-5 Y0 Z0 F200',
                words: [['G', 0], ['X', -5], ['Y', 0], ['Z', 0], ['F', 200]]
            },
            {
                line: 'G2 X0 Y5 I5 J0 F200',
                words: [['G', 2], ['X', 0], ['Y', 5], ['I', 5], ['J', 0], ['F', 200]]
            },
            {
                line: 'G02 X5 Y0 I0 J-5',
                words: [['G', 2], ['X', 5], ['Y', 0], ['I', 0], ['J', -5]]
            },
            {
                line: 'G02 X0 Y-5 I-5 J0',
                words: [['G', 2], ['X', 0], ['Y',-5], ['I', -5], ['J', 0]]
            },
            {
                line: 'G02 X-5 Y0 I0 J5',
                words: [['G', 2], ['X', -5], ['Y', 0], ['I', 0], ['J', 5]]
            },
            {
                line: 'G01 Z1 F500',
                words: [['G', 1], ['Z', 1], ['F', 500]]
            },
            {
                line: 'G00 X0 Y0 Z5',
                words: [['G', 0], ['X', 0], ['Y', 0], ['Z', 5]]
            }
        ];

        it('should get expected results in the callback.', (done) => {
            const str = fs.readFileSync('test/fixtures/circle.gcode', 'utf8');
            parseString(str, (err: any, results: any) => {
                expect(results).toEqual(expectedResults);
                done();
            });
        });
    });

    describe('parseStringSync()', () => {
        const expectedResults = [
            {
                line: 'G0 X-5 Y0 Z0 F200',
                words: [['G', 0], ['X', -5], ['Y', 0], ['Z', 0], ['F', 200]]
            },
            {
                line: 'G2 X0 Y5 I5 J0 F200',
                words: [['G', 2], ['X', 0], ['Y', 5], ['I', 5], ['J', 0], ['F', 200]]
            },
            {
                line: 'G02 X5 Y0 I0 J-5',
                words: [['G', 2], ['X', 5], ['Y', 0], ['I', 0], ['J', -5]]
            },
            {
                line: 'G02 X0 Y-5 I-5 J0',
                words: [['G', 2], ['X', 0], ['Y',-5], ['I', -5], ['J', 0]]
            },
            {
                line: 'G02 X-5 Y0 I0 J5',
                words: [['G', 2], ['X', -5], ['Y', 0], ['I', 0], ['J', 5]]
            },
            {
                line: 'G01 Z1 F500',
                words: [['G', 1], ['Z', 1], ['F', 500]]
            },
            {
                line: 'G00 X0 Y0 Z5',
                words: [['G', 0], ['X', 0], ['Y', 0], ['Z', 5]]
            }
        ];

        it('should return expected results.', (done) => {
            const str = fs.readFileSync('test/fixtures/circle.gcode', 'utf8');
            const results = parseStringSync(str);
            expect(results).toEqual(expectedResults);
            done();
        });
    });

    describe('parseFile()', () => {
        const expectedResults = [
            {
                line: 'G0 X-5 Y0 Z0 F200',
                words: [['G', 0], ['X', -5], ['Y', 0], ['Z', 0], ['F', 200]]
            },
            {
                line: 'G2 X0 Y5 I5 J0 F200',
                words: [['G', 2], ['X', 0], ['Y', 5], ['I', 5], ['J', 0], ['F', 200]]
            },
            {
                line: 'G02 X5 Y0 I0 J-5',
                words: [['G', 2], ['X', 5], ['Y', 0], ['I', 0], ['J', -5]]
            },
            {
                line: 'G02 X0 Y-5 I-5 J0',
                words: [['G', 2], ['X', 0], ['Y',-5], ['I', -5], ['J', 0]]
            },
            {
                line: 'G02 X-5 Y0 I0 J5',
                words: [['G', 2], ['X', -5], ['Y', 0], ['I', 0], ['J', 5]]
            },
            {
                line: 'G01 Z1 F500',
                words: [['G', 1], ['Z', 1], ['F', 500]]
            },
            {
                line: 'G00 X0 Y0 Z5',
                words: [['G', 0], ['X', 0], ['Y', 0], ['Z', 5]]
            }
        ];

        it('should get expected results in the callback.', (done) => {
            parseFile('test/fixtures/circle.gcode', (err: any, results: any) => {
                expect(results).toEqual(expectedResults);
                done();
            });
        });
    });

    describe('parseFileSync()', () => {
        const expectedResults = [
            {
                line: 'G0 X-5 Y0 Z0 F200',
                words: [['G', 0], ['X', -5], ['Y', 0], ['Z', 0], ['F', 200]]
            },
            {
                line: 'G2 X0 Y5 I5 J0 F200',
                words: [['G', 2], ['X', 0], ['Y', 5], ['I', 5], ['J', 0], ['F', 200]]
            },
            {
                line: 'G02 X5 Y0 I0 J-5',
                words: [['G', 2], ['X', 5], ['Y', 0], ['I', 0], ['J', -5]]
            },
            {
                line: 'G02 X0 Y-5 I-5 J0',
                words: [['G', 2], ['X', 0], ['Y',-5], ['I', -5], ['J', 0]]
            },
            {
                line: 'G02 X-5 Y0 I0 J5',
                words: [['G', 2], ['X', -5], ['Y', 0], ['I', 0], ['J', 5]]
            },
            {
                line: 'G01 Z1 F500',
                words: [['G', 1], ['Z', 1], ['F', 500]]
            },
            {
                line: 'G00 X0 Y0 Z5',
                words: [['G', 0], ['X', 0], ['Y', 0], ['Z', 5]]
            }
        ];

        it('should return expected results.', (done) => {
            const results = parseFileSync('test/fixtures/circle.gcode');
            expect(results).toEqual(expectedResults);
            done();
        });
    });

    describe('More examples', () => {
        it('should contain the line number.', (done) => {
            parseFile('test/fixtures/circle-inch.gcode', (err: any, list: any[]) => {
                expect(err).toBeNull();
                list.forEach((data: any) => {
                    const { ln } = data;
                    expect(ln).toBeDefined();
                });
                done();
            });
        });

        it('should get the expected results for special fields.', (done) => {
            const expectedResults = [
                {
                    block: 'N1',
                    ln: 1,
                    line: 'N1 G20 (inches)',
                    words: [['G', 20]]
                },
                {
                    block: 'N2',
                    ln: 2,
                    line: 'N2 G90 (absolute)',
                    words: [['G', 90]]
                },
                {
                    block: 'N3',
                    ln: 3,
                    cs: 57,
                    line: 'N3 T0*57',
                    words: [['T', 0]]
                },
                {
                    block: 'N4',
                    ln: 4,
                    cs: 67,
                    line: 'N4 G92 E0*67',
                    words: [['G', 92], ['E', 0]]
                },
                {
                    block: 'N5',
                    ln: 5,
                    cs: 22,
                    line: 'N5 G28*22',
                    words: [['G', 28]]
                },
                {
                    block: 'N6',
                    ln: 6,
                    cs: 82,
                    line: 'N6 G1 F1500.0*82',
                    words: [['G', 1], ['F', 1500]]
                },
                {
                    block: 'N7',
                    ln: 7,
                    cs: 85,
                    line: 'N7 G1 X2.0 Y2.0 F3000.0*85',
                    words: [['G', 1], ['X', 2], ['Y', 2], ['F', 3000]]
                },
                {
                    block: 'N8',
                    err: true, // checksum failed
                    ln: 8,
                    cs: 30, // invalid checksum
                    line: 'N8 G1 X3.0 Y3.0*30 ; checksum failed',
                    words: [['G', 1], ['X', 3], ['Y', 3]]
                }
            ];
            parseFile('test/fixtures/special-fields.gcode', (err: any, results: any) => {
                expect(results).toEqual(expectedResults);
                done();
            });
        });

        it('should allow spaces between commands.', (done) => {
            const expectedResults = [
                {
                    line: 'G0X-5Y0Z0F200',
                    words: [['G', 0], ['X', -5], ['Y', 0], ['Z', 0], ['F', 200]]
                },
                {
                    line: 'G0 X-5 Y0 Z0 F200',
                    words: [['G', 0], ['X', -5], ['Y', 0], ['Z', 0], ['F', 200]]
                },
                {
                    line: 'G0 X -5 Y 0 Z 0 F 200',
                    words: [['G', 0], ['X', -5], ['Y', 0], ['Z', 0], ['F', 200]]
                }
            ];

            parseFile('test/fixtures/spaces.gcode', (err: any, results: any) => {
                expect(results).toEqual(expectedResults);
                done();
            })
        });
    });
});
