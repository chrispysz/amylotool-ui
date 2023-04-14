import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Model } from 'src/app/models/model';
import { Sequence } from 'src/app/models/sequence';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-workspace-align',
  templateUrl: './workspace-align.component.html',
  styleUrls: ['./workspace-align.component.scss'],
})
export class WorkspaceAlignComponent implements OnInit {
  @Input() sequences: Sequence[] = [];
  @Input() threshold = 0.5;
  @Output() backClick = new EventEmitter<void>();

  models: Model[] = [];

  constructor(private readonly firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.firebaseService.getAllModels().then((models) => {
      this.models = models;
    });
  }

  predictionExists(sequence: Sequence, model: Model) {
    let seq = this.sequences.find((s) => s.id == sequence.id)!;
    let log = seq.predictLogs.find((l) => l.model == model.name);
    return log ? true : false;
  }

  getColoredRepresentation(sequence: Sequence, model: Model) {
    if (!this.predictionExists(sequence, model)) {
      return (
        `<span style="font-weight: bold">${sequence.name}</span>\n` +
        `<span style="opacity: .4">${sequence.value}</span>`
      );
    }
    if (sequence.value.length < 40) {
      return (
        `<span style="font-weight: bold">${sequence.name}</span>&nbsp<i class="pi pi-exclamation-triangle" style="color: red"></i>\n` +
        `${sequence.value}`
      );
    }
    const coloredIndexes = Array(sequence.value.length).fill(false);
    sequence.predictLogs.forEach((log: any) => {
      if (log.model == model.name) {
        
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
    return (
      `<span style="font-weight: bold">${sequence.name}</span>\n` +
      coloredRepresentation
    );
  }

  backToTable() {
    this.backClick.emit();
  }
}
