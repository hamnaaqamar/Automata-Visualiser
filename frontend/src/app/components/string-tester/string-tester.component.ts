import { NgFor, NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
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
        <h2>Test the current regex</h2>
        <p class="tester-copy">Current regex: <code>{{ regex || "none" }}</code></p>
      </div>
      <form class="input-row" (ngSubmit)="testString()">
        <input
          name="testInput"
          [(ngModel)]="input"
          placeholder="Try aa, baa, aab, abab..."
          autocomplete="off"
          [disabled]="!regex || loading"
        />
        <button type="submit" [disabled]="!regex || loading">{{ loading ? "Testing..." : "Test string" }}</button>
      </form>

      <div class="test-result" *ngIf="loading || result">
        <span class="result-pill pending" *ngIf="loading">Testing...</span>
        <span
          class="result-pill"
          *ngIf="!loading && result"
          [class.accepted]="result.accepted"
          [class.rejected]="!result.accepted"
        >
          String {{ result.accepted ? "ACCEPTED" : "REJECTED" }}
        </span>
        <ul class="trace" *ngIf="!loading && result">
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
export class StringTesterComponent implements OnChanges {
  @Input() regex = "";
  @Output() testStarted = new EventEmitter<string>();

  input = "";
  loading = false;
  result: SimulationResult | null = null;

  constructor(
    private readonly automataApi: AutomataApiService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["regex"] && !changes["regex"].firstChange) {
      this.result = null;
    }
  }

  testString(): void {
    if (!this.regex) {
      return;
    }

    this.loading = true;
    this.testStarted.emit(this.regex);
    this.automataApi.test(this.regex, this.input).subscribe({
      next: (result) => {
        this.result = result;
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.result = {
          accepted: false,
          trace: [{ state: "error", symbol: null, error: "Unable to test the string." }],
        };
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      },
    });
  }
}
