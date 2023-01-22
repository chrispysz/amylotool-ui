import { Injectable } from '@angular/core';
import { collection, getDocs, Firestore } from '@angular/fire/firestore';
import { WorkspaceDbReference } from '../models/workspace-db-reference';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private workspacesCollection: any;

  constructor(firestore: Firestore) {
    this.workspacesCollection = collection(firestore, 'workspaces');
  }

  async getAll(): Promise<WorkspaceDbReference[]> {
    
    return new Promise((resolve, reject) => {
      let workspaces: WorkspaceDbReference[] = [];
      getDocs(this.workspacesCollection)
        .then((snapshot) => {
          snapshot.forEach((doc) => {
            let workspace = doc.data() as WorkspaceDbReference;
            workspace.id = doc.id;
            workspaces.push(workspace);
          });

          resolve(workspaces);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
