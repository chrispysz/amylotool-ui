import { Component, OnInit, ViewChild } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { SequenceDialogComponent } from '../../shared/sequence-dialog/sequence-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PredictionService } from 'src/app/services/prediction.service';
import { Workspace } from 'src/app/models/workspace';
import { serverTimestamp } from '@angular/fire/firestore';
import { Sequence } from 'src/app/models/sequence';
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

  predicting = false;

  dataSource!: MatTableDataSource<any>;

  showFiller = false;

  workspace!: Workspace;

  threshold!: number;

  displayedColumns: string[] = ['expand', 'name', 'status', 'actions'];

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly predictionService: PredictionService,
    readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.firebaseService.loadWorkspace(params['id']).then((workspace) => {
        this.workspace = workspace;
        this.workspace.sequences.map((element) => ({
          ...element,
          expanded: false,
          status: 'PENDING',
        }));
        this.firebaseService
          .getWorkspaceRef(this.workspace.id)
          .then((dbRef) => {
            this.threshold = dbRef.threshold;
            this.refreshSequences();
            this.dataSource = new MatTableDataSource(this.workspace.sequences);
            this.loading = false;
          });
      });
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource!.filter = filterValue.trim().toLowerCase();
  }

  openDialog(identifier: string, sequence: string): void {
    const dialogRef = this.dialog.open(SequenceDialogComponent, {
      data: { identifier: identifier, sequence: sequence },
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!identifier && !sequence) {
        this.addSequence(result);
      } else {
        this.updateSequence(result);
      }
    });
  }

  addSequence(result: any) {
    let newSequence: Sequence = {
      id: crypto.randomUUID(),
      name: result[0],
      value: result[1],
      predictLogs: [],
    };
    this.workspace.sequences.push(newSequence);
    this.saveChanges();
  }

  updateSequence(result: any) {
    console.log(result.identifier);
    console.log(result.sequence);
  }

  predict(sequence: Sequence) {
    this.predicting = true;
    let seq = this.workspace.sequences.find((s) => s.id == sequence.id)!;
    this.predictionService
      .predictFull('AmBERT', sequence.value)
      .subscribe((response) => {
        seq.predictLogs.push({
          model: 'AmBERT',
          data: response.results,
        });
        this.saveChanges();
      });
  }

  predictionExists(sequence: Sequence) {
    let seq = this.workspace.sequences.find((s) => s.id == sequence.id)!;
    let log = seq.predictLogs.find((l) => l.model == 'AmBERT');
    return log ? true : false;
  }

  saveChanges() {
    this.firebaseService.getWorkspaceRef(this.workspace.id).then((dbRef) => {
      let savedWorkspace = {
        ...this.workspace,
      };
      savedWorkspace.sequences.forEach((element: any) => {
        delete element.expanded;
        delete element.status;
      });
      this.firebaseService
        .uploadWorkspace(
          new Blob([JSON.stringify(savedWorkspace)], {
            type: 'application/json',
          }),
          savedWorkspace.id
        )
        .then(() => {
          dbRef.lastModified = serverTimestamp();
          this.firebaseService.updateWorkspaceRef(dbRef).then(() => {
            this.refreshSequences();
            this.predicting = false;
          });
        });
    });
  }

  getColoredRepresentation(sequence: Sequence) {
    const coloredIndexes = Array(sequence.value.length).fill(false);
    sequence.predictLogs.forEach((log: any) => {
      if (log.model == 'AmBERT') {
        log.data.forEach((pred: any) => {
          if (Number(pred.prediction) > this.threshold) {
            let start = pred.startIndex;
            let end = pred.endIndex;
            coloredIndexes.forEach((element, index) => {
              if (index >= start && index <= end) {
                coloredIndexes[index] = true;
              }
            });
          }
        });
      }
    });
    let coloredRepresentation = '';
    coloredIndexes.forEach((element, index) => {
      if (element) {
        coloredRepresentation += `<span style="color:green">${sequence.value[index]}</span>`;
      } else {
        coloredRepresentation += `<span style="color:red">${sequence.value[index]}</span>`;
      }
    });
    return coloredRepresentation;
  }

  refreshSequences() {
    this.workspace.sequences.forEach((sequence: any) => {
      let modelLog = sequence.predictLogs.find((l: any) => l.model == 'AmBERT');
      if (modelLog) {
        let predictions = modelLog.data;
        sequence.status = 'NEGATIVE';
        predictions.forEach((pred: any) => {
          if (Number(pred.prediction) > this.threshold) {
            sequence.status = 'POSITIVE';
          }
        });
      }
    });
  }
}
