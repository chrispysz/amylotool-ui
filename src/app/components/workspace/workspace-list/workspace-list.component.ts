import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { WorkspaceDbReference } from 'src/app/models/workspace-db-reference';
import { FirebaseService } from 'src/app/services/firebase.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Table } from 'primeng/table';

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
    readonly router: Router
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
