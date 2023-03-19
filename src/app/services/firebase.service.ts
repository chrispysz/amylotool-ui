import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  collection,
  getDocs,
  Firestore,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from '@angular/fire/storage';
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
    private readonly firestore: Firestore,
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
        this._snackBar.open('Login failed', 'Ok', {
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

  private userInSessionStorage(): boolean {
    return JSON.parse(sessionStorage.getItem('user')!) ? true : false;
  }

  private userLoggedIn(): boolean {
    return this.auth.currentUser ? true : false;
  }

  async checkForName(name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      getDocs(this.workspacesCollection)
        .then((snapshot) => {
          snapshot.forEach((doc) => {
            let workspace = doc.data() as WorkspaceDbReference;
            if (workspace.name === name) {
              resolve(true);
            }
          });

          resolve(false);
        })
        .catch((err) => {
          reject(err);
        });
    });
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
    const storageRef = ref(
      this.storage,
      `workspaces/${this.getUserId()}/${id}`
    );
    const url = await getDownloadURL(storageRef);
    try {
      const response = await this.http
        .get(url, { responseType: 'text' })
        .toPromise();
      return JSON.parse(response!);
    } catch (error) {
      throw error;
    }
  }

  uploadWorkspace(file: Blob, id: string) {
    return new Promise((resolve, reject) => {
      const storageRef = ref(
        this.storage,
        `workspaces/${this.getUserId()}/${id}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(true);
          });
        }
      );
    });
  }

  deleteWorkspace(id: string) {
    return new Promise((resolve, reject) => {
      const storageRef = ref(
        this.storage,
        `workspaces/${this.getUserId()}/${id}`
      );
      deleteObject(storageRef)
        .then(() => {
          resolve(true);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  async getWorkspaceRef(id: string): Promise<WorkspaceDbReference> {
    let docRef = doc(this.firestore, 'workspaces', id);
    let docSnap = await getDoc(docRef);
    let workspace = docSnap.data() as WorkspaceDbReference;
    workspace.id = docSnap.id;
    return workspace;
  }

  updateWorkspaceRef(workspace: WorkspaceDbReference) {
    return new Promise((resolve, reject) => {
      let docRef = doc(this.firestore, 'workspaces', workspace.id);
      let updatedWorkspace = {
        name: workspace.name,
        userId: workspace.userId,
        threshold: workspace.threshold,
        lastModified: serverTimestamp(),
      };
      updateDoc(docRef, updatedWorkspace)
        .then(() => {
          resolve(true);
        })
        .catch((err) => {
          this._snackBar.open('Workspace update failed', 'OK', {
            duration: 3.5 * 1000,
          });
          reject(err);
        });
    });
  }

  addWorkspaceRef(workspace: WorkspaceDbReference) {
    return new Promise((resolve, reject) => {
      setDoc(doc(this.firestore, 'workspaces', workspace.id), workspace)
        .then(() => {
          resolve(true);
        })
        .catch((err) => {
          this._snackBar.open('Workspace upload failed', 'OK', {
            duration: 3.5 * 1000,
          });
          reject(err);
        });
    });
  }

  deleteWorkspaceRef(id: string) {
    return new Promise((resolve, reject) => {
      let docRef = doc(this.firestore, 'workspaces', id);
      deleteDoc(docRef).catch((err) => {
        this._snackBar.open('Workspace delete failed', 'Ok', {
          duration: 3.5 * 1000,
        });
        reject(err);
      });
      resolve(true);
    });
  }
}
