import { Injectable } from '@angular/core';
import { Workspace } from '../models/workspace';

@Injectable({
  providedIn: 'root',
})
export class DataHolderService {
  workspace: Workspace | undefined;

  constructor() {}

  getWorkspace(): Workspace | undefined {
    return this.workspace;
  }

  setWorkspace(workspace: Workspace) {
    this.workspace = workspace;
  }

  getDummyWorkspace(): Workspace {
    return {
      id: 'dummy-1-w',
      name: 'Dummy Workspace',
      sequences: [
        {
          id: 'dummy-1-s',
          name: 'Dummy Sequence',
          value: 'Dummy Sequence Value',
          predictLogs: []
        },
        {
          id: 'dummy-2-s',
          name: 'Dummy Sequence 2',
          value: 'Dummy Sequence Value 2',
          predictLogs: []
        }
      ],
    };
  }
}
