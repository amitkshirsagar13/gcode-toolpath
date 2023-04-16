import { IArc } from 'core/3d/arc.model';
import { ILine } from 'core/3d/line.model';
import { IMotion } from 'core/3d/motion.model';
import { IPoint } from 'core/3d/point.model';

export interface NcCode {
    block: string;
    point: IPoint;
    prePoint?: IPoint | undefined;
    preMotion?: IMotion;
    motion?: IMotion;
    nc: string[];
    segment: ILine | IArc;
}
