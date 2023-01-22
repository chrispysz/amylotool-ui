import { FieldValue } from '@angular/fire/firestore';
export interface WorkspaceDbReference {
  id: string;
  name: string;
  userId: string;
  lastModified: FieldValue;
}
