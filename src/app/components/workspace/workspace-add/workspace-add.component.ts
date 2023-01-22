import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { FastaSequence } from 'src/app/models/fasta-sequence';
import { FileManagementService } from 'src/app/services/file-management.service';

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

  constructor(
    private _formBuilder: FormBuilder,
    private readonly fileService: FileManagementService
  ) {}

  ngOnInit() {
    this.firstFormGroup = this._formBuilder.group({
      file: ['', Validators.required],
    });
    this.secondFormGroup = this._formBuilder.group({
      name: ['', Validators.required],
    });

    this.loading = false;
  }

  onFileChange(event: any) {
    this.fastaFile = event.target.files[0];
  }

  async onNextClick(files: FileList, stepper: MatStepper) {
    const fileContent = await files[0].text();
    this.fastaSequences = this.fileService.parseFasta(fileContent);
    stepper.next();
  }

  onSubmit() {
    console.log(this.secondFormGroup.value.name);
    console.log(this.fastaSequences);
  }
}
