import { Line } from 'core/3d/3d.models';
import { IMotion } from 'core/3d/motion.model';
import { IPoint } from 'core/3d/point.model';
import { NcCode } from 'core/nc/model/nc-code.model';
import { Interpreter } from 'core/nc/interpreter';
import { ORIGIN } from 'core/cad/nc-utils/3dUtils';

export class NcTranslator extends Interpreter {
    constructor(options: {}) {
        super({
            handlers: (segment: any) => {
                console.log('NcTranslator: handler', segment);
            },
            defaultHandler: (cmd: any, params: any) => {}
        });
        options = options || {};
    }

    async getNcTranslated(input: string): Promise<NcCode[]> {
        const eventHandler = this.loadFromString(input, (err: Error, results: any) => {
            if (err) {
                console.error(err);
                return;
            }
        });
        const toolpathLoadEvent = new Promise<NcCode[]>((resolve, reject) => {
            eventHandler
                .on('data', (data) => {
                    // 'data' event listener
                    // console.log(data);
                })
                .on('end', (results) => {
                    // 'end' event listener
                    resolve(results);
                });
        });

        const toolpathSegmentList: NcCode[][] = await Promise.all([toolpathLoadEvent]);

        const vectorSeedData = await Promise.all(
            toolpathSegmentList[0].map(async (segment: any) => {
                const vectorSeed: any = { block: segment.block };
                vectorSeed.nc = [];
                segment.words.forEach((word: string[]) => {
                    const pc: any = {};
                    const setup: any = {};
                    switch (word[0]) {
                        case 'G':
                            vectorSeed.nc = [...vectorSeed.nc, `${word[0]}${word[1]}`];
                            break;
                        case 'X':
                        case 'Y':
                        case 'Z':
                        case 'I':
                        case 'J':
                            pc[word[0]] = word[1];
                            vectorSeed.point = { ...vectorSeed.point, ...pc };
                            break;
                        case 'M':
                        case 'T':
                            setup[word[0]] = word[1];
                            vectorSeed.setup = { ...vectorSeed.setup, ...setup };
                            break;
                        default:
                    }
                });

                return vectorSeed;
            })
        );

        let vectorSeedProcessed: NcCode[] = [];
        let _nc = [];

        for (let vectorSeed of vectorSeedData) {
            if (vectorSeed.nc.length === 0) {
                vectorSeed.nc = _nc;
            } else {
                _nc = vectorSeed.nc;
            }

            vectorSeedProcessed.push(vectorSeed);
        }

        return vectorSeedProcessed;
    }

    MOTION_MODES: string[] = ['G90', 'G91'];
    LINEAR_MOTIONS: string[] = ['G00', 'G01', 'G0', 'G1'];
    ARC_MOTIONS: string[] = ['G02', 'G03', 'G2', 'G3'];
    MOTIONS: string[] = [...this.LINEAR_MOTIONS, ...this.ARC_MOTIONS];
    getToolpathSegments(ncCodeList: NcCode[], origin: IPoint = ORIGIN) {
        let previousPoint: IPoint = origin;
        let previousMotion: IMotion = {};
        for (const ncCode of ncCodeList) {
            ncCode.preMotion = { ...previousMotion };
            this.extractMotion(ncCode);
            if (this.LINEAR_MOTIONS.includes(ncCode.motion?.motionCode ? ncCode.motion.motionCode : '')) {
                ncCode.prePoint = previousPoint;
                ncCode.segment = new Line(ncCode);
                previousPoint = ncCode.point;
            }
            previousMotion = { ...ncCode.motion };
        }
        return ncCodeList;
    }

    extractMotion(ncCode: NcCode): void {
        let motionCode: string | undefined = undefined;
        let mode: string | undefined = undefined;
        if (ncCode.nc.length > 0) {
            for (let code of ncCode.nc) {
                if (this.MOTIONS.includes(code)) {
                    motionCode = code;
                    break;
                }
            }
            for (let mc of ncCode.nc) {
                if (this.MOTION_MODES.includes(mc)) {
                    mode = mc;
                    break;
                }
            }
        }
        if (motionCode && !ncCode.preMotion?.motionCode) {
            ncCode.preMotion = { ...ncCode.preMotion, motionCode };
        }
        if (mode && !ncCode.preMotion?.motionMode) {
            ncCode.preMotion = { ...ncCode.preMotion, motionMode: mode };
        }
        ncCode.motion = {};
        ncCode.motion.motionCode = motionCode ? motionCode : ncCode.preMotion?.motionCode;
        ncCode.motion.motionMode = mode ? mode : ncCode.preMotion?.motionMode;
    }
}

export default { NcTranslator };
