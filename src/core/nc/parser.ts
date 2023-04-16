/* eslint no-bitwise: 0 */
/* eslint no-continue: 0 */
import events from 'events';
import fs from 'fs';
import timers from 'timers';
import stream, { Transform } from 'stream';

const noop = () => {};
const endLinePattern = new RegExp(/.*(?:\r\n|\r|\n)/g);

const streamify = (text: string | null): fs.ReadStream | stream.Readable => {
    const s = new stream.Readable();
    s.push(text);
    s.push(null);
    return s;
};

const hasLineEnd = (line: string) => {
    return !!line.match(endLinePattern);
};

// @param {array} inArray The array to iterate over.
// @param {object} opts The options object.
// @param {function} iteratee The iteratee invoked per element.
// @param {function} done The done invoked after the loop has finished.
const iterateArray = (inArray: any[] = [], opts: Function | any = {}, iteratee: Function | any = noop, done: Function = noop) => {
    if (typeof opts === 'function') {
        done = iteratee;
        iteratee = opts;
        opts = {};
    }

    opts.batchSize = opts.batchSize || 1;

    const loop = (i = 0) => {
        for (let count = 0; i < inArray.length && count < opts.batchSize; ++i, ++count) {
            iteratee(inArray[i], i, inArray);
        }
        if (i < inArray.length) {
            timers.setImmediate(() => loop(i));
            return;
        }
        done();
    };
    loop();
};

const computeChecksum = (s: string): number => {
    s = s || '';
    if (s.lastIndexOf('*') >= 0) {
        s = s.substr(0, s.lastIndexOf('*'));
    }

    let cs = 0;
    for (let i = 0; i < s.length; ++i) {
        const c = s[i].charCodeAt(0);
        cs ^= c;
    }
    return cs;
};

// Remove anything inside the '()'
// Remove anything after a ';' to the end of the line, including blank spaces
const removeComments = (line: string) => {
    const re1 = new RegExp(/\s*\([^\)]*\)/g);
    const re2 = new RegExp(/\s*;.*/g);
    const re3 = new RegExp(/\s+/g);
    return line.replace(re1, '').replace(re2, '').replace(re3, '');
};

const wordExtractPattern = /(%.*)|({.*)|((?:\$\$)|(?:\$[a-zA-Z0-9#]*))|([a-zA-Z][0-9\+\-\.]+)|(\*[0-9]+)/gim;
// @param {string} line The G-code line
const parseLine = (line: string | null | undefined, options: any = undefined) => {
    options = options || {};
    options.flatten = !!options.flatten;
    options.noParseLine = !!options.noParseLine;

    const result: any = {
        line: line
    };

    if (options.noParseLine) {
        return result;
    }

    result.words = [];
    if (line) {
        let ln; // Line number
        let cs; // Checksum
        const words = removeComments(line).match(wordExtractPattern) || [];

        for (let i = 0; i < words.length; ++i) {
            const word = words[i];
            const letter = word[0].toUpperCase();
            const argument: string = word.slice(1);

            // Parse % commands for bCNC and CNCjs
            // - %wait Wait until the planner queue is empty
            if (letter === '%') {
                result.cmds = (result.cmds || []).concat(line.trim());
                continue;
            }

            // Parse JSON commands for TinyG and g2core
            if (letter === '{') {
                result.cmds = (result.cmds || []).concat(line.trim());
                continue;
            }

            // Parse $ commands for Grbl
            // - $C Check gcode mode
            // - $H Run homing cycle
            if (letter === '$') {
                result.cmds = (result.cmds || []).concat(`${letter}${argument}`);
                continue;
            }

            // N: Line number
            if (letter === 'N' && typeof ln === 'undefined') {
                // Line (block) number in program
                ln = Number(argument);
                result.block = `N${ln}`;
                continue;
            }

            // *: Checksum
            if (letter === '*' && typeof cs === 'undefined') {
                cs = Number(argument);
                continue;
            }

            let value: number | string = Number(argument);
            if (Number.isNaN(value)) {
                value = argument;
            }

            if (options.flatten) {
                result.words.push(letter + value);
            } else {
                result.words.push([letter, value]);
            }
        }

        typeof ln !== 'undefined' && (result.ln = ln);

        typeof cs !== 'undefined' && (result.cs = cs);
        if (result.cs && computeChecksum(line) !== result.cs) {
            result.err = true;
        }
    }

    return result;
};

// @param {object} stream The G-code line stream
// @param {options} options The options object
// @param {function} callback The callback function
const parseStream = (stream: fs.ReadStream | stream.Readable | null, options: any, callback: Function = noop) => {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    const emitter = new events.EventEmitter();

    try {
        const results: any[] = [];
        if (stream) {
            stream
                .pipe(new LineStream(options))
                .on('data', (data) => {
                    emitter.emit('data', data);
                    results.push(data);
                })
                .on('end', () => {
                    emitter.emit('end', results);
                    callback && callback(null, results);
                })
                .on('error', (error) => {
                    callback(error, null);
                });
        } else {
            callback(new Error('Undefined Stream'));
        }
    } catch (err) {
        callback(err);
    }

    return emitter;
};

// @param {string} file The G-code path name
// @param {options} options The options object
// @param {function} callback The callback function
const parseFile = (file: string | null, options: any | Function, callback: Function = noop) => {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    file = file || '';
    let stream: fs.ReadStream = fs.createReadStream(file, { encoding: 'utf8' });
    stream.on('error', (error) => callback(error));
    return parseStream(stream, options, callback);
};

const parseFileSync = (file: string, options: any | Function = {}) => {
    return parseStringSync(fs.readFileSync(file, 'utf8'), options);
};

// @param {string} str The G-code text string
// @param {options} options The options object
// @param {function} callback The callback function
const parseString = (str: string | null, options: any | Function, callback: any | Function = noop) => {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    return parseStream(streamify(str), options, callback);
};

const parseStringSync = (str: string, options: any | Function = {}) => {
    const { flatten = false, noParseLine = false } = { ...options };
    const results = [];
    const lines = str.split('\n');

    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i].trim();
        if (line.length === 0) {
            continue;
        }
        const result = parseLine(line, {
            flatten,
            noParseLine
        });
        results.push(result);
    }

    return results;
};

// // @param {string} G-code text string
// // @param {options} options
class LineStream extends Transform {
    state = {
        lineCount: 0,
        lastChunkEndedWithCR: false
    };

    options = {
        batchSize: 1000,
        noParseLine: false,
        flatten: false
    };

    lineBuffer = '';

    re = new RegExp(/.*(?:\r\n|\r|\n)|.+$/g);

    // @param {object} [options] The options object
    // @param {number} [options.batchSize] The batch size.
    // @param {boolean} [options.flatten] True to flatten the array, false otherwise.
    // @param {boolean} [options.noParseLine] True to not parse line, false otherwise.
    constructor(options = {}) {
        super({ objectMode: true });

        this.options = {
            ...this.options,
            ...options
        };
    }

    _transform(chunk: any, encoding: string | any, next: Function) {
        // decode binary chunks as UTF-8
        encoding = encoding || 'utf8';

        if (Buffer.isBuffer(chunk)) {
            if (encoding === 'buffer') {
                encoding = 'utf8';
            }
            chunk = chunk.toString(encoding);
        }

        this.lineBuffer += chunk;

        if (!hasLineEnd(chunk)) {
            next();
            return;
        }

        const lines = this.lineBuffer.match(this.re);
        if (!lines || lines.length === 0) {
            next();
            return;
        }

        // Do not split CRLF which spans chunks
        if (this.state.lastChunkEndedWithCR && lines[0] === '\n') {
            lines.shift();
        }

        this.state.lastChunkEndedWithCR = this.lineBuffer[this.lineBuffer.length - 1] === '\r';

        if (this.lineBuffer[this.lineBuffer.length - 1] === '\r' || this.lineBuffer[this.lineBuffer.length - 1] === '\n') {
            this.lineBuffer = '';
        } else {
            const line = lines.pop() || '';
            this.lineBuffer = line;
        }
        iterateArray(
            lines,
            { batchSize: this.options.batchSize },
            (line: string, key: string) => {
                line = line.trim();
                if (line.length > 0) {
                    const result = parseLine(line, {
                        flatten: this.options.flatten,
                        noParseLine: this.options.noParseLine
                    });
                    this.push(result);
                }
            },
            next
        );
    }

    _flush(done: Function) {
        if (this.lineBuffer) {
            const line = this.lineBuffer.trim();
            if (line.length > 0) {
                const result = parseLine(line, {
                    flatten: this.options.flatten,
                    noParseLine: this.options.noParseLine
                });
                this.push(result);
            }

            this.lineBuffer = '';
            this.state.lastChunkEndedWithCR = false;
        }

        done();
    }
}

export { parseLine, LineStream, parseStream, parseFile, parseFileSync, parseString, parseStringSync };
