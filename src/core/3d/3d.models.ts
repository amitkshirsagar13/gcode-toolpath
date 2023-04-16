import { ORIGIN } from 'core/cad/nc-utils/3dUtils';
import { NcCode } from 'core/nc/model/nc-code.model';
import { IArc } from './arc.model';
import { ILine } from './line.model';
import { IPoint } from './point.model';

export class Point implements IPoint {
    X: number = 0;
    Y: number = 0;
    Z: number = 0;
    I?: number | undefined;
    J?: number | undefined;
    R?: number | undefined;
    nc?: string | undefined;
    block?: string | undefined;

    constructor(block: string, nc: string, X: number, Y: number, Z: number) {
        this.block = block;
        this.nc = nc;
        this.X = X;
        this.Y = Y;
        this.Z = Z;
    }
}

export class Line implements ILine {
    start: IPoint;
    end: IPoint;
    nc: string | undefined;
    mode: string | undefined;

    public constructor(ncCode: NcCode) {
        this.end = ncCode.point;
        this.start = ncCode.prePoint || ORIGIN;
        this.nc = this.end.nc ? this.end.nc : this.start?.nc;
        this.transform();
    }
    setPoints(start: IPoint | undefined, end: IPoint) {
        this.end = end;
        this.start = start || ORIGIN;
        this.nc = end.nc ? end.nc : start?.nc;
    }
    setEndPoint(end: IPoint) {
        this.setPoints(ORIGIN, end);
    }
    transform(): void {
        if (this.mode === 'G91') {
            this.end.X = this.end.X + this.start.X;
            this.end.Y = this.end.Y + this.start.Y;
            this.end.Z = this.end.Z + this.start.Z;
        }
    }
    isSelected(): boolean {
        throw new Error('Method not implemented.');
    }
    color(): string {
        throw new Error('Method not implemented.');
    }
    width(): number {
        throw new Error('Method not implemented.');
    }
}

export class Arc extends Line implements IArc {
    I: number | undefined = undefined;
    J: number | undefined = undefined;
    R: number | undefined = undefined;
    setI(value: number) {
        this.I = value;
    }
    setJ(value: number) {
        this.J = value;
    }
    setR(value: number) {
        this.R = value;
    }
    clockwise(): boolean {
        return this.nc === 'G2';
    }
}
