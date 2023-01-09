import { Point } from "./point";

export interface Arc {
    start: Point;
    end: Point;
    i: number;
    j: number;
    r: number;
}