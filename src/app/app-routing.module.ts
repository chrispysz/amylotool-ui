import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomePageComponent } from './components/shared/welcome-page/welcome-page.component';
import { WorkspaceAddComponent } from './components/workspace/workspace-add/workspace-add.component';
import { WorkspaceDetailsComponent } from './components/workspace/workspace-details/workspace-details.component';
import { WorkspaceListComponent } from './components/workspace/workspace-list/workspace-list.component';
import { AuthGuard } from './utils/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  {
    path: 'welcome',
    component: WelcomePageComponent,
    title: 'Welcome - AmyloTool',
  },
  {
    path: 'workspaces',
    component: WorkspaceListComponent,
    title: 'Workspaces - AmyloTool',
    canActivate: [AuthGuard],
  },
  {
    path: 'workspaces/details',
    component: WorkspaceDetailsComponent,
    title: 'Workspaces details - AmyloTool',
    canActivate: [AuthGuard],
  },
  {
    path: 'workspaces/add',
    component: WorkspaceAddComponent,
    title: 'Add workspace - AmyloTool',
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: 'welcome', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
