import { ILine } from './line.model';

export interface IArc extends ILine {
    I?: number | undefined;
    J?: number | undefined;
    R?: number | undefined;
    clockwise(): boolean;
}
