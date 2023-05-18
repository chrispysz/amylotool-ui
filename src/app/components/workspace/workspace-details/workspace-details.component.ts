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
  Subscription,
  tap,
  timeout,
} from 'rxjs';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { SequenceDialogComponent } from '../../shared/sequence-dialog/sequence-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import * as FileSaver from 'file-saver';
import { Model } from 'src/app/models/model';

@Component({
  selector: 'app-workspace-details',
  templateUrl: './workspace-details.component.html',
  styleUrls: ['./workspace-details.component.scss'],
})
export class WorkspaceDetailsComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  predictSubscription!: Subscription;

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
  currentlyPredictedSequence: Sequence | null = null;

  atpp = '';

  aminoAcidsRegex = /^[ACDEFGHIKLMNPQRSTVWY]+$/;

  currentlySelectedModel: Model = {
    id: '',
    name: 'None',
    url: '',
  };

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

  modelItems: MenuItem[] = [];
  models: Model[] = [];

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
              this.loading = false;
            });
        })
        .catch((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Workspace could not be loaded.`,
          });
          console.error(error);
        });
    });
    this.firebaseService.getAllModels().then((models) => {
      this.models = models;
      this.currentlySelectedModel = models[0];
      this.checkingAvailability = true;
      this.checkCurrentModelAvailability(this.currentlySelectedModel);
      this.remapModelItems();
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
    let clearSequences = this.selectedSequences.filter(
      (s) => !this.predictionExists(s) && this.sequenceValid(s)
    );
    this.confirmationService.confirm({
      message: `Are you sure that you want to start the prediction for ${clearSequences.length} sequences?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (clearSequences.length == 0) {
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
          if (clearSequences.length == 1) {
            this.predictingSingle = true;
            this.predict(clearSequences[0]);
          } else {
            this.predictingAll = true;
            this.predictionPercentage = 0;
            this.predictSelectedSequences(clearSequences);
          }
        }
      },
      reject: () => {},
    });
  }

  applyFilterGlobal($event: Event, stringVal: string) {
    this.dt.filterGlobal(($event.target as HTMLInputElement).value, stringVal);
  }

  onModelChange(model: Model) {
    this.checkingAvailability = false;
    this.connectionErrorText = '';
    this.currentlySelectedModel = model;
    this.remapModelItems();
    this.refreshSequences();
    this.checkingAvailability = true;
    this.remapModelItems();
    this.checkCurrentModelAvailability(model);
  }

  remapModelItems() {
    this.modelItems = this.models.map((model) => {
      return {
        icon:
          model.name === this.currentlySelectedModel.name ? 'pi pi-check' : '',
        label: model.name,
        disabled: this.processRunning() || this.checkingAvailability,
        command: () => {
          this.onModelChange(model);
        },
      };
    });
  }

  checkCurrentModelAvailability(model: Model) {
    this.predictionService
      .checkServiceAvailability(model.url)
      .pipe(delay(200), timeout(5000))
      .subscribe(
        (response) => {
          this.connectionErrorText = '';
          this.messageService.add({
            severity: 'info',
            summary: 'Connection status',
            detail: `Connection with ${model.name} established.`,
          });
          this.checkingAvailability = false;
          this.remapModelItems();
        },
        (error) => {
          this.connectionErrorText = error.error
            ? error.error.error
            : 'Request timed out';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Connection with ${model.name} could not be established`,
            });
          this.checkingAvailability = false;
          this.remapModelItems();
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
    this.currentlyPredictedSequence = sequence;
    this.remapModelItems();
    let seq = this.workspace.sequences.find((s) => s.id == sequence.id)!;
    this.predictionService
      .predictFull(this.currentlySelectedModel.url, sequence.value)
      .subscribe(
        (response) => {
          seq.predictLogs.push({
            model: this.currentlySelectedModel.name,
            data: response.results,
          });
          this.predictingSingle = false;
          this.saveChanges();
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Prediction status',
            detail: `Error while predicting sequence ${sequence.name}`,
          });
          this.predictingSingle = false;
        }
      );
  }

  predictWithoutSave(sequence: Sequence): Observable<any> {
    let seq = this.workspace.sequences.find((s) => s.id == sequence.id)!;
    this.currentlyPredictedSequence = seq;
    return this.predictionService
      .predictFull(this.currentlySelectedModel.url, sequence.value)
      .pipe(
        tap((response) => {
          seq.predictLogs.push({
            model: this.currentlySelectedModel.name,
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
    let timeDiffs: number[] = [];

    this.predictSubscription = from(clearSequences)
      .pipe(
        concatMap((sequence) => this.predictWithoutSave(sequence)),
        tap(() => (this.currentlyPredictedIndex += 1)),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Prediction status',
            detail: `Error while predicting sequence ${
              this.currentlyPredictedSequence!.name
            }`,
          });
          timeDiffs = [];
          return of(null);
        })
      )
      .subscribe(() => {
        this.predictionPercentage = Math.round(
          ((this.currentlyPredictedIndex - 1) / this.totalPredictions) * 100
        );
        endTime = Date.now();
        timeDiff = endTime - startTime;
        let td = 0;
        if (this.currentlyPredictedSequence!.value.length - 40.0 <= 0) {
          td = timeDiff / 1000.0;
        } else {
          td =
            timeDiff /
            (this.currentlyPredictedSequence!.value.length - 40.0) /
            1000.0;
        }
        timeDiffs.push(td);

        this.atpp = (
          timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
        ).toFixed(3);

        startTime = Date.now();
        if (this.currentlyPredictedIndex - 1 == this.totalPredictions) {
          this.messageService.add({
            severity: 'info',
            summary: 'Prediction status',
            detail: 'Saving...',
          });
          timeDiffs = [];
          this.saveChanges();
        }
      });
  }

  cancelPrediction() {
    if (this.predictSubscription) {
      this.predictSubscription.unsubscribe();
      this.saveChanges();
    }
  }

  predictionExists(sequence: Sequence) {
    let seq = this.workspace.sequences.find((s) => s.id == sequence.id)!;
    let log = seq.predictLogs.find(
      (l) => l.model == this.currentlySelectedModel.name
    );
    return log ? true : false;
  }

  saveChanges() {
    this.predictingSingle = false;
    this.predictingAll = false;
    this.currentlyPredictedSequence = null;
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
      if (log.model == this.currentlySelectedModel.name) {
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
        (l: any) => l.model == this.currentlySelectedModel.name
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

  sequenceValid(sequence: Sequence) {
    if (sequence.value.length < 40) {
      return false;
    }
    if (!this.aminoAcidsRegex.test(sequence.value)) {
      return false;
    }
    return true;
  }
}
