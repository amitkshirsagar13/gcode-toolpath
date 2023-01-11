import Interpreter from "../../nc/interpreter";


export class NcTranslator extends Interpreter {
    constructor(options: {}) {
        super({
            handlers: (segment: any)=> {
                console.log('NcTranslator: handler', segment);
            },
            defaultHandler: (cmd:any, params:any)=>{}
        });
        options = options || {};
    }

    async getToolpathSegments(input: string): Promise<any[]> {
        const eventHandler =this.loadFromString(input, (err: Error, results: any) => {
            if (err) {
                console.error(err);
                return;
            }
        });
        const toolpathLoadEvent = new Promise((resolve, reject) => {
            eventHandler.on('data', (data) => {
                // 'data' event listener
                // console.log(data);
            })
            .on('end', (results) => {
                // 'end' event listener
                resolve(results);
            });
        });
    
        const toolpathSegmentList:any[] = await Promise.all([toolpathLoadEvent]);

        const vectorSeedData = await Promise.all(
            toolpathSegmentList[0].map(async (segment:any)=> {
                const vectorSeed:any = { block: segment.block };
                vectorSeed.nc = []
                segment.words.forEach((word:string[]) => {
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

        let vectorSeedProcessed = [];
        let _nc = [];

        for(let vectorSeed of vectorSeedData) {
            if(vectorSeed.nc.length === 0) {
                vectorSeed.nc = _nc;
            } else {
                _nc = vectorSeed.nc;
            }

            vectorSeedProcessed.push(vectorSeed);
        }

        return vectorSeedProcessed;
    }
}

export default {NcTranslator}