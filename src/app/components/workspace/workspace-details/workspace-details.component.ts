import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
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
import { concatMap, delay, from, Observable, tap, toArray } from 'rxjs';
@Component({
  selector: 'app-workspace-details',
  templateUrl: './workspace-details.component.html',
  styleUrls: ['./workspace-details.component.scss'],
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

  predictingSingle = false;

  predictingAll = false;

  currentlyPredictedIndex!: number;
  totalPredictions!: number;
  currentlyPredictedSequence!: Sequence;

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

  addSequence(result: any) {
    let newSequence: Sequence = {
      id: crypto.randomUUID(),
      name: result[0],
      value: result[1],
      predictLogs: [],
      edited: false,
    };
    this.workspace.sequences.push(newSequence);
    this.saveChanges();
  }

  updateSequence(result: any, id: string) {
    let sequence = this.workspace.sequences.find((s) => s.id == id)!;
    sequence.name = result[0];
    sequence.value = result[1];
    sequence.predictLogs = [];
    sequence.edited = true;
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
      this.saveChanges();
    }
  }

  predict(sequence: Sequence) {
    this.predictingSingle = true;
    this.currentlyPredictedSequence = sequence;
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

  predictWithoutSave(sequence: Sequence): Observable<any> {
    let seq = this.workspace.sequences.find((s) => s.id == sequence.id)!;
    this.currentlyPredictedSequence = seq;
    return this.predictionService.predictFull('AmBERT', sequence.value).pipe(
      tap((response) => {
        seq.predictLogs.push({
          model: 'AmBERT',
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

    this.currentlyPredictedIndex = 0;
    this.totalPredictions = clearSequences.length;

    from(clearSequences)
      .pipe(
        concatMap((sequence) => this.predictWithoutSave(sequence)),
        tap(() => (this.currentlyPredictedIndex += 1))
      )
      .subscribe(() => {
        if (this.currentlyPredictedIndex == this.totalPredictions) {
          this.saveChanges();
        }
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
            this.predictingSingle = false;
            this.predictingAll = false;
          });
        });
    });
  }

  getColoredRepresentation(sequence: Sequence) {
    if (!sequence.predictLogs.length) {
      return sequence.value;
    }
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
    this.dataSource = new MatTableDataSource(this.workspace.sequences);
  }
}
