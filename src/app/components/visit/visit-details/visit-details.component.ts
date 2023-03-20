import { Component, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { Sequence } from 'src/app/models/sequence';
import { Workspace } from 'src/app/models/workspace';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-visit-details',
  templateUrl: './visit-details.component.html',
  styleUrls: ['./visit-details.component.scss'],
})
export class VisitDetailsComponent {
  @ViewChild('dt') dt!: Table;

  detailView = false;
  fetchLoading = false;
  tableLoading = false;

  exportVisible = false;
  exportJSON = '';

  workspace!: Workspace;
  currentlySelectedModel = 'AmBERT';
  threshold = 0.5;

  sideMenuItems: MenuItem[] = [
    {
      label: 'Export as JSON',
      icon: 'pi pi-upload',
      command: () => {
        this.exportVisible = true;
        let savedWorkspace = {
          ...this.workspace,
        };
        savedWorkspace.sequences.forEach((element: any) => {
          delete element.note;
          delete element.status;
        });
        this.exportJSON = JSON.stringify(savedWorkspace);
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
      label: 'LSTM',
      command: () => {
        this.currentlySelectedModel = 'LSTM';
        this.refreshSequences();
      },
    },
  ];

  idForm = this.fb.group({
    id: ['', [Validators.required, Validators.minLength(5)]],
  });

  constructor(
    private fb: FormBuilder,
    private readonly wService: FirebaseService,
    private readonly router: Router
  ) {}

  applyFilterGlobal($event: Event, stringVal: string) {
    this.dt.filterGlobal(($event.target as HTMLInputElement).value, stringVal);
  }

  onSubmit() {
    this.fetchLoading = true;
    this.wService.loadWorkspace(this.idForm.value.id!).then((workspace) => {
      this.workspace = workspace;

      this.workspace.sequences.map((element) => ({
        ...element,
        status: '',
        note: '',
      }));
      this.wService.getWorkspaceRef(this.workspace.id).then((dbRef) => {
        this.threshold = dbRef.threshold;
        this.refreshSequences();
        this.fetchLoading = false;
        this.detailView = true;
      });
    });
  }

  predictionExists(sequence: Sequence) {
    let seq = this.workspace.sequences.find((s) => s.id == sequence.id)!;
    let log = seq.predictLogs.find(
      (l) => l.model == this.currentlySelectedModel
    );
    return log ? true : false;
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
        coloredRepresentation += `${sequence.value[index]}`;
      }
    });
    return coloredRepresentation;
  }

  refreshSequences() {
    this.workspace.sequences.forEach((sequence: any) => {
      sequence.note = '';
      if (sequence.value.length < 40) {
        sequence.note += 'Sequence too short for this model\n';
      }
      if (sequence.edited) {
        sequence.note += 'Sequence edited by user';
      }
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
