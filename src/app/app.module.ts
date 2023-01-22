import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WorkspaceListComponent } from './components/workspace/workspace-list/workspace-list.component';
import { WorkspaceDetailsComponent } from './components/workspace/workspace-details/workspace-details.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavHeaderComponent } from './components/shared/nav-header/nav-header.component';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { WelcomePageComponent } from './components/shared/welcome-page/welcome-page.component';
import { initializeApp, getApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

@NgModule({
  declarations: [
    AppComponent,
    WorkspaceListComponent,
    WorkspaceDetailsComponent,
    NavHeaderComponent,
    PageNotFoundComponent,
    WelcomePageComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatSortModule,
    MatPaginatorModule,
    MatTableModule,
    MatSidenavModule,

    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'amylotool',
        appId: '1:1073210650885:web:0184b2652a183d3cd5076c',
        storageBucket: 'amylotool.appspot.com',
        apiKey: 'AIzaSyDc-jlXXxteA-PDdujqJ7Dt-Nni9e_z3s0',
        authDomain: 'amylotool.firebaseapp.com',
        messagingSenderId: '1073210650885',
        measurementId: 'G-4L34E3V82X',
      })
    ),
    provideFirestore(() => getFirestore()),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
