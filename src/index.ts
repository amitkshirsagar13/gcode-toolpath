import { NcTranslator } from "./core/cad/nc-to-vectors/nc-vector-translator";

export const extractToolpathSegments = (input: string): Promise<any[]|any> => {
    return new Promise(async (resolve, reject) => {
        const ncTranslator = new NcTranslator({});
        const toolpathSegmentList : any[] = await ncTranslator.getToolpathSegments(input);
        resolve(toolpathSegmentList.length > 1 ? toolpathSegmentList : toolpathSegmentList[0]) ; 
    });
}

export default { 
    extractToolpathSegments 
}