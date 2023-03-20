import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-visit-details',
  templateUrl: './visit-details.component.html',
  styleUrls: ['./visit-details.component.scss']
})
export class VisitDetailsComponent {

  idForm = this.fb.group({
    id: ['']
  });

  constructor(private fb: FormBuilder) { }

  onSubmit() {
    console.log('submit');
  }

}
