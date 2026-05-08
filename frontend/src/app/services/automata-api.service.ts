import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { ConversionResult, SimulationResult } from "../models/automata.models";

@Injectable({ providedIn: "root" })
export class AutomataApiService {
  constructor(private readonly http: HttpClient) {}

  convert(regex: string): Observable<ConversionResult> {
    return this.http.post<ConversionResult>(`${environment.apiBaseUrl}/convert`, { regex });
  }

  test(regex: string, input: string): Observable<SimulationResult> {
    return this.http.post<SimulationResult>(`${environment.apiBaseUrl}/test`, { regex, input });
  }
}
