import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root',
})
export class PredictionService {
  constructor(private readonly httpClient: HttpClient) {}

  private readonly path = 'https://amylotool-backend.herokuapp.com/predict';

  predictFull(model: string, sequence: string): Observable<any> {
    let data = { model: model, sequence: sequence };

    return this.httpClient.post(`${this.path}/model`, data);
  }

  checkServiceAvailability(model: string): Observable<any> {
    let data = { model: model, sequence: 'ping' };
    return this.httpClient.post(`${this.path}/model`, data);
  }
}
