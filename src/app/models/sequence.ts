import { PredictLog } from './predict-log';
export interface Sequence {
  id: string;
  name: string;
  value: string;
  predictLogs: PredictLog[];
}
