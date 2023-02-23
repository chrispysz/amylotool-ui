import { FieldValue } from '@angular/fire/firestore';
export interface WorkspaceDbReference {
  id: string;
  name: string;
  userId: string;
  threshold: number;
  lastModified: FieldValue;
}
