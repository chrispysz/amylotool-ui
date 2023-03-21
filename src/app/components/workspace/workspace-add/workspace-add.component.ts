import { Component, OnInit } from '@angular/core';
import { serverTimestamp } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { FastaSequence } from 'src/app/models/fasta-sequence';
import { Workspace } from 'src/app/models/workspace';
import { WorkspaceDbReference } from 'src/app/models/workspace-db-reference';
import { FileManagementService } from 'src/app/services/file-management.service';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-workspace-add',
  templateUrl: './workspace-add.component.html',
  styleUrls: ['./workspace-add.component.scss'],
})
export class WorkspaceAddComponent implements OnInit {
  firstFormGroup!: FormGroup;
  secondFormGroup!: FormGroup;
  fastaFile: File | undefined;
  fastaSequences: FastaSequence[] | undefined;
  loading = true;
  stepperLoading = false;
  sizeValid = true;
  nameValid = true;

  constructor(
    private _formBuilder: FormBuilder,
    private readonly fileService: FileManagementService,
    private readonly firebaseService: FirebaseService,
    private readonly router: Router,
    private readonly _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.firstFormGroup = this._formBuilder.group({
      file: ['', Validators.required],
    });
    this.secondFormGroup = this._formBuilder.group({
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(100),
          Validators.minLength(3),
        ],
      ],
    });

    this.loading = false;
  }

  async onFileChange(event: any, stepper: MatStepper) {
    this.fastaFile = event.target.files[0];
    this.fastaSequences = this.fileService.parseFasta(
      await this.fastaFile!.text()
    );
    this.sizeValid = this.fileService.sizeValid(this.fastaSequences);
    if (this.sizeValid) {
      stepper.next();
    }
  }

  onNextClick(stepper: MatStepper) {
    if (this.secondFormGroup.value.name.length > 0) {
      this.firebaseService
        .checkForName(this.secondFormGroup.value.name)
        .then((exists) => {
          if (exists) {
            this.nameValid = false;
          } else {
            this.nameValid = true;
            stepper.next();
          }
        });
    }
  }

  onSubmit() {
    this.stepperLoading = true;
    let userId = this.firebaseService.getUserId();
    let workspaceId = crypto.randomUUID();

    let workspace: Workspace = {
      id: workspaceId,
      name: this.secondFormGroup.value.name,
      sequences: this.fastaSequences
        ? this.fastaSequences.map((sequence) => {
            return {
              id: crypto.randomUUID(),
              name: sequence.header,
              value: sequence.sequence,
              status: 'PENDING',
              predictLogs: [],
              edited: false,
            };
          })
        : [],
    };
    let workspaceDbReference: WorkspaceDbReference = {
      id: workspaceId,
      userId: userId,
      name: this.secondFormGroup.value.name,
      threshold: 0.5,
      lastModified: serverTimestamp(),
    };

    this.firebaseService
      .uploadWorkspace(
        new Blob([JSON.stringify(workspace)], {
          type: 'application/json',
        }),
        workspaceId
      )
      .then(() => {
        this.firebaseService
          .addWorkspaceRef(workspaceDbReference)
          .then(() => {
            this.router.navigate(['/workspaces']);
            this._snackBar.open('Workspace created', 'OK', {
              duration: 3.5 * 1000,
            });
          })
          .catch(() => {
            this.stepperLoading = false;
          });
      });
  }
}
