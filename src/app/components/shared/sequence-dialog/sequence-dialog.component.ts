import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SequenceDialogData } from 'src/app/models/sequence-dialog-data';

@Component({
  selector: 'app-sequence-dialog',
  templateUrl: './sequence-dialog.component.html',
  styleUrls: ['./sequence-dialog.component.scss'],
})
export class SequenceDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SequenceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SequenceDialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
