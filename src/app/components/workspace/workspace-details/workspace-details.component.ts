import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { MatTable, MatTableDataSource } from '@angular/material/table';
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
import {
  catchError,
  concatMap,
  delay,
  from,
  Observable,
  of,
  tap,
  toArray,
} from 'rxjs';
@Component({
  selector: 'app-workspace-details',
  templateUrl: './workspace-details.component.html',
  styleUrls: ['./workspace-details.component.scss'],
})
export class WorkspaceDetailsComponent implements OnInit {
  private paginator: MatPaginator | undefined;
  private sort: MatSort | undefined;

  @ViewChild(MatTable)
  table!: MatTable<any>;

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

  allExpanded = false;

  checkingAvailability = false;

  loading = true;

  predictingSingle = false;

  predictingAll = false;

  savingWorkspace = false;

  currentlyPredictedIndex!: number;
  totalPredictions!: number;
  currentlyPredictedSequence!: string;

  currentlySelectedModel = 'AmBERT';
  connectionErrorText = '';

  dataSource!: MatTableDataSource<any>;

  showFiller = false;

  workspace!: Workspace;

  threshold!: number;

  displayedColumns: string[] = ['expand', 'name', 'status', 'actions', 'notes'];

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
          status: '',
        }));
        this.firebaseService
          .getWorkspaceRef(this.workspace.id)
          .then((dbRef) => {
            this.threshold = dbRef.threshold;
            this.refreshSequences();
            this.dataSource = new MatTableDataSource(this.workspace.sequences);
            this.loading = false;
            this.checkingAvailability = true;
            this.checkCurrentModelAvailability(this.currentlySelectedModel);
          });
      });
    });
  }

  toggleExpand() {
    const skip = this.paginator!.pageSize * this.paginator!.pageIndex;
    const pagedData = this.workspace.sequences
      .filter((u, i) => i >= skip)
      .filter((u, i) => i < this.paginator!.pageSize);
    this.allExpanded = !this.allExpanded;
    pagedData.forEach((element: any) => {
      element.expanded = this.allExpanded;
    });
    this.table.renderRows();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource!.filter = filterValue.trim().toLowerCase();
  }

  openDialog(identifier: string, sequence: string, id: string): void {
    const dialogRef = this.dialog.open(SequenceDialogComponent, {
      data: { identifier: identifier, sequence: sequence },
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!identifier && !sequence) {
        this.addSequence(result);
      } else {
        this.updateSequence(result, id);
      }
    });
  }

  onModelChange(model: string) {
    this.checkingAvailability = false;
    this.connectionErrorText = '';
    this.currentlySelectedModel = model; 
    this.refreshSequences();
    this.checkingAvailability = true;
    this.checkCurrentModelAvailability(model);
  }

  checkCurrentModelAvailability(model: string) {
    this.predictionService
      .checkServiceAvailability(model)
      .pipe(delay(2000))
      .subscribe(
        (response) => {
          if (response.results == 'Service reached') {
            this.checkingAvailability = false;
          }
        },
        (error) => {
          this.connectionErrorText = error.error.error;
          this.checkingAvailability = false;
        }
      );
  }

  processRunning() {
    return this.predictingAll || this.predictingSingle || this.savingWorkspace;
  }

  addSequence(result: any) {
    let newSequence: Sequence = {
      id: crypto.randomUUID(),
      name: result[0],
      value: result[1],
      predictLogs: [],
      edited: false,
    };
    this.workspace.sequences.push(newSequence);

    this.dataSource = new MatTableDataSource(this.workspace.sequences);
    this.saveChanges();
  }

  updateSequence(result: any, id: string) {
    let sequence = this.workspace.sequences.find((s) => s.id == id)!;
    sequence.name = result[0];
    sequence.value = result[1];
    sequence.predictLogs = [];
    sequence.edited = true;

    this.dataSource = new MatTableDataSource(this.workspace.sequences);
    this.saveChanges();
  }

  deleteSequence(id: string) {
    if (
      confirm(
        `Are you sure you want to delete this sequence? This action cannot be undone.`
      )
    ) {
      this.workspace.sequences = this.workspace.sequences.filter(
        (s) => s.id != id
      );
      this.dataSource = new MatTableDataSource(this.workspace.sequences);
      this.saveChanges();
    }
  }

  predict(sequence: Sequence) {
    this.predictingSingle = true;
    this.currentlyPredictedSequence = sequence.name;
    let seq = this.workspace.sequences.find((s) => s.id == sequence.id)!;
    this.predictionService
      .predictFull(this.currentlySelectedModel, sequence.value)
      .subscribe((response) => {
        seq.predictLogs.push({
          model: this.currentlySelectedModel,
          data: response.results,
        });
        this.dataSource = new MatTableDataSource(this.workspace.sequences);
        this.saveChanges();
      });
  }

  predictWithoutSave(sequence: Sequence): Observable<any> {
    let seq = this.workspace.sequences.find((s) => s.id == sequence.id)!;
    this.currentlyPredictedSequence = seq.name;
    return this.predictionService
      .predictFull(this.currentlySelectedModel, sequence.value)
      .pipe(
        tap((response) => {
          seq.predictLogs.push({
            model: this.currentlySelectedModel,
            data: response.results,
          });
        })
      );
  }

  predictAll() {
    this.predictingAll = true;
    let clearSequences = this.workspace.sequences.filter(
      (s) => !this.predictionExists(s)
    );
    if (clearSequences.length == 0) {
      this.predictingAll = false;
      alert('All sequences have already been predicted.');
      return;
    }

    this.currentlyPredictedIndex = 1;
    this.totalPredictions = clearSequences.length;

    from(clearSequences)
      .pipe(
        concatMap((sequence) => this.predictWithoutSave(sequence)),
        tap(() => (this.currentlyPredictedIndex += 1))
      )
      .subscribe(() => {
        if (this.currentlyPredictedIndex - 1 == this.totalPredictions) {
          this.dataSource = new MatTableDataSource(this.workspace.sequences);

          this.saveChanges();
        }
      });
  }

  predictionExists(sequence: Sequence) {
    let seq = this.workspace.sequences.find((s) => s.id == sequence.id)!;
    let log = seq.predictLogs.find(
      (l) => l.model == this.currentlySelectedModel
    );
    return log ? true : false;
  }

  saveChanges() {
    this.predictingSingle = false;
    this.predictingAll = false;
    this.currentlyPredictedSequence = '';
    this.savingWorkspace = true;
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

            this.savingWorkspace = false;
          });
        });
    });
  }

  getColoredRepresentation(sequence: Sequence) {
    if (!this.predictionExists(sequence)) {
      return sequence.value;
    }
    const coloredIndexes = Array(sequence.value.length).fill(false);
    sequence.predictLogs.forEach((log: any) => {
      if (log.model == this.currentlySelectedModel) {
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
      let modelLog = sequence.predictLogs.find(
        (l: any) => l.model == this.currentlySelectedModel
      );
      if (modelLog) {
        let predictions = modelLog.data;
        sequence.status = 'NEGATIVE';
        predictions.forEach((pred: any) => {
          if (Number(pred.prediction) > this.threshold) {
            sequence.status = 'POSITIVE';
          }
        });
      } else {
        sequence.status = '';
      }
    });
  }
}
