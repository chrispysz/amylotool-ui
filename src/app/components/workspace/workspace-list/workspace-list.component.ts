import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { WorkspaceDbReference } from 'src/app/models/workspace-db-reference';
import { FirebaseService } from 'src/app/services/firebase.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';

@Component({
  selector: 'app-workspace-list',
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss'],
})
export class WorkspaceListComponent implements AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  loading = true;

  dataSource!: MatTableDataSource<WorkspaceDbReference>;

  showFiller = false;

  constructor(
    private readonly firebaseService: FirebaseService,
    readonly router: Router
  ) {}
  displayedColumns: string[] = ['name', 'lastModified'];

  ngAfterViewInit() {
    this.firebaseService.getAll().then((workspaces) => {
      this.dataSource = new MatTableDataSource(workspaces);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.loading = false;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
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
