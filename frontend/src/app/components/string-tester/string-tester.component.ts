import { NgFor, NgIf } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SimulationResult } from "../../models/automata.models";
import { AutomataApiService } from "../../services/automata-api.service";

@Component({
  selector: "app-string-tester",
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  template: `
    <section class="panel tester">
      <div>
        <p class="eyebrow">String testing</p>
        <h2>Run an input string on the minimized DFA</h2>
      </div>
      <form class="input-row" (ngSubmit)="testString()">
        <input
          name="testInput"
          [(ngModel)]="input"
          placeholder="Try ab, aab, bbab, aba..."
          autocomplete="off"
          [disabled]="!regex || loading"
        />
        <button type="submit" [disabled]="!regex || loading">Test string</button>
      </form>

      <div class="test-result" *ngIf="result">
        <span class="result-pill" [class.accepted]="result.accepted" [class.rejected]="!result.accepted">
          String {{ result.accepted ? "ACCEPTED" : "REJECTED" }}
        </span>
        <ul class="trace">
          <li *ngFor="let step of result.trace; let index = index">
            {{ index + 1 }}.
            {{ step.symbol === null ? "start" : 'read "' + step.symbol + '"' }}
            → {{ step.state }}
            <span *ngIf="step.error"> - {{ step.error }}</span>
          </li>
        </ul>
      </div>
    </section>
  `,
})
export class StringTesterComponent {
  @Input() regex = "";

  input = "";
  loading = false;
  result: SimulationResult | null = null;

  constructor(private readonly automataApi: AutomataApiService) {}

  testString(): void {
    if (!this.regex) {
      return;
    }

    this.loading = true;
    this.automataApi.test(this.regex, this.input).subscribe({
      next: (result) => {
        this.result = result;
        this.loading = false;
      },
      error: () => {
        this.result = {
          accepted: false,
          trace: [{ state: "error", symbol: null, error: "Unable to test the string." }],
        };
        this.loading = false;
      },
    });
  }
}
