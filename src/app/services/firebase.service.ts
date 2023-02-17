import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { collection, getDocs, Firestore } from '@angular/fire/firestore';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import { getDownloadURL, getStorage, ref } from '@angular/fire/storage';
import { WorkspaceDbReference } from '../models/workspace-db-reference';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Workspace } from '../models/workspace';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private workspacesCollection: any;

  constructor(
    firestore: Firestore,
    private readonly http: HttpClient,
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly _snackBar: MatSnackBar
  ) {
    this.workspacesCollection = collection(firestore, 'workspaces');
  }
  storage = getStorage();

  logIn(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then(() => {
        sessionStorage.setItem('user', JSON.stringify(this.auth.currentUser));
        this.router.navigate(['/workspaces']);
      })
      .catch(() => {
        this._snackBar.open('Login failed', 'Close', {
          duration: 3.5 * 1000,
        });
      });
  }

  getUserId(): string {
    if (this.userInSessionStorage()) {
      return JSON.parse(sessionStorage.getItem('user')!).uid;
    } else if (this.userLoggedIn()) {
      return this.auth.currentUser!.uid;
    } else {
      return '';
    }
  }

  userInSessionStorage(): boolean {
    return JSON.parse(sessionStorage.getItem('user')!) ? true : false;
  }

  userLoggedIn(): boolean {
    return this.auth.currentUser ? true : false;
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

  async loadWorkspace(id: string): Promise<Workspace> {
    const storageRef = ref(this.storage, `workspaces/${this.getUserId()}/${id}`);
    const url = await getDownloadURL(storageRef);
    try {
      const response = await this.http.get(url, { responseType: 'text' }).toPromise();
      return JSON.parse(response!);
    } catch (error) {
      throw error;
    }
  }
}
