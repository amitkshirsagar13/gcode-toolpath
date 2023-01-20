import { ILine } from "./line.model";
import { IPoint } from "./point.model";

export interface IArc extends ILine {
    I?: number|undefined;
    J?: number|undefined;
    R?: number|undefined;
    clockwise(): boolean;
}