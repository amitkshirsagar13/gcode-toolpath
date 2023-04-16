import { IPoint } from './core/3d/point.model';
import { ORIGIN } from './core/cad/nc-utils/3dUtils';
import { NcCode } from './core/nc/model/nc-code.model';
import { NcTranslator } from './core/cad/nc-to-vectors/nc-vector-translator';

export const getNcVectorData = (input: string): Promise<NcCode[]> => {
    return new Promise(async (resolve, reject) => {
        const ncTranslator = new NcTranslator({});
        const toolpathSegmentList: NcCode[] = await ncTranslator.getNcTranslated(input);
        resolve(toolpathSegmentList);
    });
};

export const getToolPathSegmentsData = (ncCodeList: NcCode[], origin: IPoint = ORIGIN) => {
    return new Promise(async (resolve, reject) => {
        const ncTranslator = new NcTranslator({});
        const toolpathSegmentList: NcCode[] = await ncTranslator.getToolpathSegments(ncCodeList);
        resolve(toolpathSegmentList);
    });
};

export default {
    getNcVectorData
};
