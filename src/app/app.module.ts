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
import { SkeletonModule } from 'primeng/skeleton';
import { MatPaginatorModule } from '@angular/material/paginator';
import { TabViewModule } from 'primeng/tabview';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { NavHeaderComponent } from './components/shared/nav-header/nav-header.component';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { WelcomePageComponent } from './components/shared/welcome-page/welcome-page.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { MatFormFieldModule } from '@angular/material/form-field';
import { WorkspaceAddComponent } from './components/workspace/workspace-add/workspace-add.component';
import { MatStepperModule } from '@angular/material/stepper';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginCardComponent } from './components/shared/login-card/login-card.component';
import { HttpClientModule } from '@angular/common/http';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { environment } from './environments/environment';
import { MatDialogModule } from '@angular/material/dialog';
import { SequenceDialogComponent } from './components/shared/sequence-dialog/sequence-dialog.component';
import { WorkspaceSettingsComponent } from './components/workspace/workspace-settings/workspace-settings.component';
import { NoSanitizePipe } from './utils/no-sanitize.pipe';

import { MenubarModule } from 'primeng/menubar';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { VisitDetailsComponent } from './components/visit/visit-details/visit-details.component';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { CheckboxModule } from 'primeng/checkbox';
import { MessagesModule } from 'primeng/messages';
import { WorkspaceAlignComponent } from './components/workspace/workspace-align/workspace-align.component';

@NgModule({
  declarations: [
    AppComponent,
    WorkspaceListComponent,
    WorkspaceDetailsComponent,
    NavHeaderComponent,
    PageNotFoundComponent,
    WelcomePageComponent,
    WorkspaceAddComponent,
    LoginCardComponent,
    SequenceDialogComponent,
    WorkspaceSettingsComponent,
    NoSanitizePipe,
    VisitDetailsComponent,
    WorkspaceAlignComponent,
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
    MatSidenavModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatProgressBarModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatSliderModule,
    MatSnackBarModule,
    MatButtonToggleModule,
    MenubarModule,
    TieredMenuModule,
    TableModule,
    TabViewModule,
    DividerModule,
    InputTextModule,
    ImageModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    CardModule,
    ConfirmDialogModule,
    SelectButtonModule,
    ProgressSpinnerModule,
    InputTextareaModule,
    ProgressBarModule,
    ScrollPanelModule,
    CheckboxModule,
    MessagesModule,
    SkeletonModule,
    
    

    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,

    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()),
  ],
  providers: [MessageService, ConfirmationService],
  bootstrap: [AppComponent],
})
export class AppModule {}
