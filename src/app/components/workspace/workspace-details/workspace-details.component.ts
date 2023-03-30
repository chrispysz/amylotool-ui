import { Component, OnInit, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
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
import {
  ConfirmationService,
  ConfirmEventType,
  MenuItem,
  MessageService,
} from 'primeng/api';
import { Table } from 'primeng/table';
import { SequenceDialogComponent } from '../../shared/sequence-dialog/sequence-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-workspace-details',
  templateUrl: './workspace-details.component.html',
  styleUrls: ['./workspace-details.component.scss'],
})
export class WorkspaceDetailsComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  timeLeft = 0;

  allExpanded = false;

  checkingAvailability = false;

  loading = true;

  predictingSingle = false;

  predictingAll = false;

  tableLoading = false;
  aligning = false;

  currentlyPredictedIndex!: number;
  totalPredictions!: number;
  predictionPercentage: number = 100;
  currentlyPredictedSequence!: string;

  currentlySelectedModel = 'AmBERT';
  connectionErrorText = '';

  dataSource!: MatTableDataSource<any>;

  showFiller = false;

  workspace!: Workspace;

  threshold!: number;

  detailView = false;
  fetchLoading = false;

  exportVisible = false;
  exportJSON = '';

  selectedSequences: Sequence[] = [];

  sideMenuItems: MenuItem[] = [
    {
      label: 'Download JSON',
      icon: 'pi pi-download',
      command: () => {
        this.confirmationService.confirm({
          message: `Are you sure that you want to download all the predictions for this workspace?`,
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
            const blob = new Blob([JSON.stringify(this.workspace)], {
              type: 'text/json',
            });
            FileSaver.saveAs(blob, 'data.json');
          },
          reject: () => {},
        });
      },
    },
    {
      label: 'Advanced',
      icon: 'pi pi-cog',
      command: () => {
        this.router.navigate(['/workspaces/settings'], {
          queryParams: { id: this.workspace.id },
        });
      },
    },
    {
      label: 'Exit',
      icon: 'pi pi-times',
      command: () => {
        this.router.navigate(['']);
      },
    },
  ];

  modelItems: MenuItem[] = [
    {
      label: 'AmBERT',
      command: () => {
        this.currentlySelectedModel = 'AmBERT';
        this.refreshSequences();
      },
    },
    {
      label: 'ProteinBERT',
      command: () => {
        this.currentlySelectedModel = 'ProteinBERT';
        this.refreshSequences();
      },
    },
    {
      label: 'LSTM',
      command: () => {
        this.currentlySelectedModel = 'LSTM';
        this.refreshSequences();
      },
    },
  ];

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly predictionService: PredictionService,
    readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly messageService: MessageService,
    private readonly dialog: MatDialog,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.firebaseService
        .loadWorkspace(params['id'])
        .then((workspace) => {
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
              this.dataSource = new MatTableDataSource(
                this.workspace.sequences
              );
              this.loading = false;
              this.checkingAvailability = true;
              this.checkCurrentModelAvailability(this.currentlySelectedModel);
            });
        })
        .catch((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Workspace could not be loaded. Check if the provided ID is correct`,
          });
          console.error(error);
        });
    });
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

  confirm1() {
    this.confirmationService.confirm({
      message: `Are you sure that you want to start the prediction for ${this.selectedSequences.length} sequences?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.predictingAll = true;
        let clearSequences = this.selectedSequences.filter(
          (s) => !this.predictionExists(s)
        );
        if (clearSequences.length == 0) {
          this.predictingAll = false;
          this.messageService.add({
            severity: 'info',
            summary: 'Prediction status',
            detail: 'Nothing to predict',
          });
        } else {
          this.messageService.add({
            severity: 'info',
            summary: 'Prediction status',
            detail: 'Running...',
          });
          this.predictionPercentage = 0;
          this.predictSelectedSequences(clearSequences);
        }
      },
      reject: () => {},
    });
  }

  applyFilterGlobal($event: Event, stringVal: string) {
    this.dt.filterGlobal(($event.target as HTMLInputElement).value, stringVal);
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
    return this.predictingAll || this.predictingSingle || this.tableLoading;
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

  backFromAlign() {
    console.log('back from align');
    this.aligning = false;
  }

  deleteSelectedSequences() {
    if (
      confirm(
        `Are you sure you want to delete ${this.selectedSequences.length} sequences from this workspace? This action cannot be undone.`
      )
    ) {
      let selected = this.selectedSequences.map((s) => s.id);
      this.workspace.sequences = this.workspace.sequences.filter(
        (s) => !selected.includes(s.id)
      );
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

  predictSelectedSequences(clearSequences: Sequence[]) {
    this.currentlyPredictedIndex = 1;
    this.totalPredictions = clearSequences.length;

    let startTime = Date.now();
    let endTime = Date.now();
    let timeDiff = endTime - startTime;
    let timeLeftArray: number[] = [];

    from(clearSequences)
      .pipe(
        concatMap((sequence) => this.predictWithoutSave(sequence)),
        tap(() => (this.currentlyPredictedIndex += 1)),
        catchError((err) => {
          console.error(err);
          return of(null);
        })
      )
      .subscribe(() => {
        this.predictionPercentage = Math.round(
          ((this.currentlyPredictedIndex - 1) / this.totalPredictions) * 100
        );
        endTime = Date.now();
        timeDiff = endTime - startTime;
        timeLeftArray.push(
          Math.round(
            ((timeDiff / this.currentlyPredictedIndex) *
              (this.totalPredictions + 1 - this.currentlyPredictedIndex)) /
              1000
          )
        );
        this.timeLeft = Math.round(
          timeLeftArray.reduce((a, b) => a + b, 0) / timeLeftArray.length
        );
        startTime = Date.now();
        if (this.currentlyPredictedIndex - 1 == this.totalPredictions) {
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
    this.tableLoading = true;
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
            this.tableLoading = false;
            this.messageService.add({
              severity: 'success',
              summary: 'OK',
              detail: `Workspace changes have been saved`,
            });
          });
        });
    });
  }

  duplicateSequence(sequence: Sequence) {
    let newSequence: Sequence = {
      id: crypto.randomUUID(),
      name: sequence.name + ' (copy)',
      value: sequence.value,
      predictLogs: sequence.predictLogs,
      edited: sequence.edited,
    };
    this.workspace.sequences.push(newSequence);
    this.saveChanges();
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
        coloredRepresentation += `<span style="color:green; font-weight: bold">${sequence.value[index]}</span>`;
      } else {
        coloredRepresentation += `${sequence.value[index]}`;
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
