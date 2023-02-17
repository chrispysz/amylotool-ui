import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { delay } from 'rxjs';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-login-card',
  templateUrl: './login-card.component.html',
  styleUrls: ['./login-card.component.scss'],
})
export class LoginCardComponent {
  username = new FormControl('', [
    Validators.required,
    Validators.minLength(5),
    Validators.maxLength(40),
  ]);
  password = new FormControl('', [
    Validators.required,
    Validators.minLength(5),
    Validators.maxLength(40),
  ]);
  loading = false;

  constructor(private readonly firebaseService: FirebaseService) {}

  login() {
    this.loading = true;
    this.sleep(1000).then(() => {
      this.firebaseService
        .logIn(this.username.value!, this.password.value!)
        .then(() => {
          this.loading = false;
        });
    });
  }

  sleep(time: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
}
