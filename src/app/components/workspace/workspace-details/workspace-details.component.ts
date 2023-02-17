import {
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { DataHolderService } from 'src/app/services/data-holder.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
@Component({
  selector: 'app-workspace-details',
  templateUrl: './workspace-details.component.html',
  styleUrls: ['./workspace-details.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class WorkspaceDetailsComponent implements OnInit {
  private paginator: MatPaginator | undefined;
  private sort: MatSort | undefined;

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }

  setDataSourceAttributes() {
    if (!this.dataSource || !this.paginator || !this.sort) {
      return;
    }
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  loading = true;

  dataSource!: MatTableDataSource<any>;

  showFiller = false;

  workspaceId!: string;

  displayedColumns: string[] = ['expand', 'name', 'status', 'actions'];

  constructor(
    private readonly firebaseService: FirebaseService,
    readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dataHolderService: DataHolderService
  ) {}

  ngOnInit(): void {
    // this.route.queryParams.subscribe((params) => {
    //   this.workspaceId = params['id'];
    //   this.firebaseService.loadWorkspace(this.workspaceId).then((workspace) => {
    //     this.dataSource = new MatTableDataSource(workspace.sequences);
    //     this.dataHolderService.setWorkspace(workspace);
    //     this.loading = false;
    //   });
    // });
    this.route.queryParams.subscribe((params) => {
      this.workspaceId = params['id'];
      this.firebaseService.loadWorkspace(this.workspaceId).then((workspace) => {
        this.dataSource = new MatTableDataSource(
          workspace.sequences.map((element) => ({
            ...element,
            isExpanded: false,
          }))
        );
        this.loading = false;
      });
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource!.filter = filterValue.trim().toLowerCase();
  }
}
