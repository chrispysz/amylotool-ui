import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { FirebaseService } from 'src/app/services/firebase.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-nav-header',
  templateUrl: './nav-header.component.html',
  styleUrls: ['./nav-header.component.scss'],
})
export class NavHeaderComponent implements OnInit {
  items: MenuItem[] = [];

  stateOptions = [
    { icon: 'pi pi-sun', value: 'md-light-indigo' },
    { icon: 'pi pi-moon', value: 'md-dark-indigo' },
  ];

  startValue =
    localStorage.getItem('theme') === 'md-dark-indigo'
      ? 'md-dark-indigo'
      : 'md-light-indigo';

  constructor(
    private readonly auth: FirebaseService,
    private readonly themeService: ThemeService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: 'home',
      },
      {
        label: 'Your Workspaces',
        icon: 'pi pi-folder',
        routerLink: 'workspaces',
      },
      {
        label: 'View as guest',
        icon: 'pi pi-eye',
        routerLink: 'visit/details',
      },
    ];

    
      this.themeService.switchTheme(this.startValue);
  }

  logout() {
    this.auth.logOut();
  }

  loggedIn() {
    return  this.auth.getUserId() ? true : false;
  }

  changeTheme(event: any) {
    localStorage.setItem('theme', event.value);
    this.themeService.switchTheme(event.value);
  }
}
