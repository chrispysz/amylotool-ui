import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { WorkspaceDbReference } from 'src/app/models/workspace-db-reference';
import { FirebaseService } from 'src/app/services/firebase.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { Clipboard } from '@angular/cdk/clipboard';
import { Workspace } from 'src/app/models/workspace';
import { serverTimestamp } from 'firebase/firestore';

@Component({
  selector: 'app-workspace-list',
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss'],
})
export class WorkspaceListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  items: MenuItem[] = [];

  loading = true;

  workspaces: WorkspaceDbReference[] = [];

  showFiller = false;

  constructor(
    private readonly firebaseService: FirebaseService,
    readonly router: Router,
    private clipboard: Clipboard,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
  ) {}
  displayedColumns: string[] = ['name', 'lastModified'];

  ngOnInit() {
    this.items = [
      {
        label: 'Add workspace',
        icon: 'pi pi-plus',
        routerLink: 'add',
      },
    ];
    this.firebaseService.getAll().then((workspaces) => {
      this.workspaces = workspaces;
      this.loading = false;
    });
  }

  copyToClipboard(workspace: WorkspaceDbReference) {
    this.clipboard.copy(workspace.id);
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Workspace ID copied to clipboard',
    });
  }

  duplicateWorkspace(workspace: WorkspaceDbReference) {
    this.confirmationService.confirm({
      message: `Are you sure that you want to duplicate ${workspace.name}? This will create an exact copy of this workspace.`,
      accept: () => {
        this.loading = true;
        this.firebaseService.loadWorkspace(workspace.id).then((workspace) => {
          let userId = this.firebaseService.getUserId();
          let workspaceId = Date.now().toString();

          let newWorkspace: Workspace = {
            id: workspaceId,
            name: workspace.name + ' (copy)',
            sequences: workspace.sequences,
          };
          let workspaceDbReference: WorkspaceDbReference = {
            id: workspaceId,
            userId: userId,
            name: workspace.name + ' (copy)',
            threshold: 0.5,
            lastModified: serverTimestamp(),
          };

          this.firebaseService
            .uploadWorkspace(
              new Blob([JSON.stringify(newWorkspace)], {
                type: 'application/json',
              }),
              workspaceId
            )
            .then(() => {
              this.firebaseService
                .addWorkspaceRef(workspaceDbReference)
                .then(() => {
                  this.workspaces.push(workspaceDbReference);
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Workspace ${workspace.name} duplicated`,
                  });
                  this.loading = false;
                })
                .catch(() => {
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Workspace ${workspace.name} could not be duplicated`,
                  });
                  this.loading = false;
                });
            });
        });
      },
    });
  }

  applyFilterGlobal($event: Event, stringVal: string) {
    this.dt.filterGlobal(($event.target as HTMLInputElement).value, stringVal);
  }

  getDateFromTimestamp(timestamp: any): Date | string {
    if (!timestamp || typeof timestamp !== 'object' || !timestamp.seconds) {
      return '';
    }
    let date = new Date(timestamp.seconds * 1000);
    let defaultFormat = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    } as const;
    return date.toLocaleString([], defaultFormat);
  }
}
