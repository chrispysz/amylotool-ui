import { Component, OnInit } from '@angular/core';
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

  stateOptions = [{icon: 'pi pi-sun', value: 'md-light-indigo'}, {icon: 'pi pi-moon', value: 'md-dark-indigo'}];
  value1 = 'md-light-indigo';

  constructor(private readonly auth: FirebaseService,
    private readonly themeService: ThemeService) {}

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
  }

  changeTheme(event: any) {
    this.themeService.switchTheme(event.value);
  }
}
