import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root',
})
export class PredictionService {
  constructor(private readonly httpClient: HttpClient) {}

  private readonly path = 'https://amylotool-backend-go.herokuapp.com/predict';

  predictFull(model: string, sequence: string): Observable<any> {
    let data = { modelUrl: model, sequence: sequence };

    return this.httpClient.post(`${this.path}`, data);
  }

  checkServiceAvailability(model: string): Observable<any> {
    
    let data = { modelUrl: model, sequence: 'MFKKHTISLLIIFLLASAVLAKPIEAHTVSPVNPNAQQTTK' };
    console.log(data.modelUrl)
    return this.httpClient.post(`${this.path}`, data);
  }
}
