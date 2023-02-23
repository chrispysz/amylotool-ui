import { PredictLog } from './predictLog';
export interface Sequence {
  id: string;
  name: string;
  value: string;
  predictLogs: PredictLog[];
}
