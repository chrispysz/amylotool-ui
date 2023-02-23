import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspaceDbReference } from 'src/app/models/workspace-db-reference';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-workspace-settings',
  templateUrl: './workspace-settings.component.html',
  styleUrls: ['./workspace-settings.component.scss'],
})
export class WorkspaceSettingsComponent implements OnInit {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly _snackBar: MatSnackBar
  ) {}

  workspaceId: string = '';
  workspace!: WorkspaceDbReference;
  loading = true;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.workspaceId = params['id'];
      this.firebaseService
        .getWorkspaceRef(this.workspaceId)
        .then((workspace) => {
          this.workspace = workspace;
          this.loading = false;
        });
    });
  }

  deleteWorkspace() {
    if (
      confirm(
        `Are you sure you want to delete this workspace? This action cannot be undone.`
      )
    ) {
      this.firebaseService.deleteWorkspace(this.workspaceId).then(() => {
        this.firebaseService.deleteWorkspaceRef(this.workspaceId).then(() => {
          this.router.navigate(['workspaces']);
          this._snackBar.open('Workspace deleted', 'OK', {
            duration: 3.5 * 1000,
          });
        });
      });
    }
  }

  saveWorkspace() {
    this.firebaseService.updateWorkspaceRef(this.workspace).then(() => {
      this._snackBar.open('Workspace updated', 'OK', {
        duration: 3.5 * 1000,
      });
    });
  }
}
