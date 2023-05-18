import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Model } from 'src/app/models/model';
import { Sequence } from 'src/app/models/sequence';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-workspace-align',
  templateUrl: './workspace-align.component.html',
  styleUrls: ['./workspace-align.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceAlignComponent implements OnInit {
  @Input() sequences: Sequence[] = [];
  @Input() threshold = 0.5;
  @Output() backClick = new EventEmitter<void>();

  models: any[] = [];
  selectedModels: Model[] = [];
  representations: any = {};
  loading = true;

  constructor(
    private readonly firebaseService: FirebaseService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.firebaseService.getAllModels().then((models) => {
      this.models = models.map((model) => {
        return {
          name: model.name,
          checked: false,
        };
      });
      this.models.push({
        name: 'Consensus',
        checked: false,
      });
      this.loading = false;
      this.cd.markForCheck();
    });
  }

  modelChanged(model: Model, isChecked: boolean) {
    if (isChecked) {
      this.selectedModels.push(model);
    } else {
      const index = this.selectedModels.indexOf(model);
      this.selectedModels.splice(index, 1);
    }

    this.sequences.forEach((sequence) => {
      this.models.forEach((model) => {
        if (this.selectedModels.includes(model)) {
          this.representations[`${sequence.id}_${model.name}`] =
            this.getColoredRepresentation(sequence, model);
        } else {
          this.representations[`${sequence.id}_${model.name}`] = '';
        }
      });
    });
    this.cd.markForCheck();
  }

  predictionExists(sequence: Sequence, model: Model) {
    let seq = this.sequences.find((s) => s.id == sequence.id)!;
    let log = seq.predictLogs.find((l) => l.model == model.name);
    return log ? true : false;
  }

  getColoredRepresentation(sequence: Sequence, model: Model) {
    let representation = '';

    if (!this.predictionExists(sequence, model) && model.name !== 'Consensus') {
      representation = `<span style="font-weight: bold">${sequence.name}</span>\n<span style="opacity: .4">${sequence.value}</span>`;
    } else {
      representation = this.getRepresentationWithPrediction(sequence, model);
    }
    return representation;
  }

  getRepresentationWithPrediction(sequence: Sequence, model: Model) {
    let representation = '';
    if (sequence.value.length < 40) {
      representation =
        `<span style="font-weight: bold">${sequence.name}</span>&nbsp<i class="pi pi-exclamation-triangle" style="color: red"></i>\n` +
        `${sequence.value}`;
    } else {
      const coloredIndexes = Array(sequence.value.length).fill(false);
      if (model.name === 'Consensus') {
        this.fillColoredIndexes(sequence, model, coloredIndexes);
      } else {
        this.fillOwnIndexes(sequence, model, coloredIndexes);
      }

      let coloredRepresentation = '';
      coloredIndexes.forEach((element, index) => {
        if (element) {
          coloredRepresentation += `<span style="color:green; font-weight: bold">${sequence.value[index]}</span>`;
        } else {
          coloredRepresentation += `${sequence.value[index]}`;
        }
      });

      representation =
        `<span style="font-weight: bold">${sequence.name}</span>\n` +
        coloredRepresentation;
    }
    return representation;
  }

  fillOwnIndexes(sequence: Sequence, model: Model, coloredIndexes: boolean[]) {
    let log = sequence.predictLogs.find((log) => log.model == model.name);
    if (log) {
      log.data.forEach((pred) => {
        if (Number(pred.prediction) > this.threshold) {
          let start = pred.startIndex;
          let end = pred.endIndex;
          for (let index = start; index <= end; index++) {
            coloredIndexes[index] = true;
          }
        }
      });
    }
  }

  fillColoredIndexes(
    sequence: Sequence,
    model: Model,
    coloredIndexes: boolean[]
  ) {
    const commonIndexes = Array(sequence.value.length).fill(true);

    this.selectedModels.forEach((selectedModel) => {
      if (selectedModel.name !== model.name) {
        let selectedLog = sequence.predictLogs.find(
          (log) => log.model == selectedModel.name
        );
        if (selectedLog) {
          let selectedIndexes = Array(sequence.value.length).fill(false);
          selectedLog.data.forEach((pred) => {
            if (Number(pred.prediction) > this.threshold) {
              let start = pred.startIndex;
              let end = pred.endIndex;
              for (let index = start; index <= end; index++) {
                selectedIndexes[index] = true;
              }
            }
          });

          for (let i = 0; i < commonIndexes.length; i++) {
            if (commonIndexes[i] && !selectedIndexes[i]) {
              commonIndexes[i] = false;
            }
          }
        }
      }
    });

    for (let i = 0; i < coloredIndexes.length; i++) {
      coloredIndexes[i] = commonIndexes[i];
    }
  }

  backToTable() {
    this.backClick.emit();
  }
}
