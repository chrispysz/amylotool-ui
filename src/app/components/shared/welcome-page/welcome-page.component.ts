import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-welcome-page',
  templateUrl: './welcome-page.component.html',
  styleUrls: ['./welcome-page.component.scss'],
})
export class WelcomePageComponent implements OnInit {
  loggedIn = false;

  constructor(private readonly firebase: FirebaseService) {}

  ngOnInit(): void {
    this.loggedIn = this.firebase.getUserId() ? true : false;
  }
}
