import { IPoint } from './point.model';

export interface ILine {
    start: IPoint;
    end: IPoint;
    nc?: string | undefined;
    mode?: string | undefined;
    transform(): void;
    isSelected(): boolean;
    color(): string;
    width(): number;
}
