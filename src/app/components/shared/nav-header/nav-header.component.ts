import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-nav-header',
  templateUrl: './nav-header.component.html',
  styleUrls: ['./nav-header.component.scss'],
})
export class NavHeaderComponent implements OnInit {
  items: MenuItem[] = [];

  constructor(private readonly auth: FirebaseService) {}

  ngOnInit(): void {
    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: 'home',
      },
      {
        label: 'Workspaces',
        icon: 'pi pi-folder',
        routerLink: 'workspaces',
      },
    ];
  }
}
