import { NgFor, NgIf } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AutomatonCanvasComponent } from "./components/automaton-canvas/automaton-canvas.component";
import { StatsCardComponent } from "./components/stats-card/stats-card.component";
import { StringTesterComponent } from "./components/string-tester/string-tester.component";
import { TransitionTableComponent } from "./components/transition-table/transition-table.component";
import { ConversionResult } from "./models/automata.models";
import { AutomataApiService } from "./services/automata-api.service";

type ActiveTab = "nfa" | "dfa" | "minimized" | "steps";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    AutomatonCanvasComponent,
    FormsModule,
    NgFor,
    NgIf,
    StatsCardComponent,
    StringTesterComponent,
    TransitionTableComponent,
  ],
  template: `
    <header class="hero">
      <nav class="nav">
        <span class="brand">Automata Visualizer</span>
        <span class="badge">Regex → NFA → DFA → Minimized DFA</span>
      </nav>
      <section class="hero-grid">
        <div>
          <p class="eyebrow">Finite automata workbench</p>
          <h1>Build the automaton for a regular expression.</h1>
          <p class="hero-copy">
            Convert a regex, inspect each construction stage, and test strings against the same
            expression without losing track of what is currently being checked.
          </p>
        </div>

        <form class="panel input-panel" (ngSubmit)="convert()">
          <label for="regex">Regular expression</label>
          <div class="input-row">
            <input id="regex" name="regex" [ngModel]="regex" (ngModelChange)="onRegexInput($event)" autocomplete="off" />
            <button type="submit" [disabled]="loading">{{ loading ? "Building..." : "Visualize" }}</button>
          </div>
          <p class="hint">
            Supported operators: union <code>+</code> or <code>|</code>, Kleene star
            <code>*</code>, optional <code>?</code>, grouping <code>()</code>, and epsilon
            <code>ε</code>. Concatenation is implicit.
          </p>
          <div class="examples" aria-label="Example regular expressions">
            <button type="button" *ngFor="let example of examples" (click)="useExample(example)">
              {{ example }}
            </button>
          </div>
        </form>
      </section>
    </header>

    <main>
      <section class="status visible" [class.error]="error" role="status" *ngIf="statusMessage">
        {{ statusMessage }}
      </section>
      <section class="status stale" role="status" *ngIf="isDirty && conversion && !error">
        The diagrams below still show <code>{{ conversion.regex }}</code>. Press Visualize to refresh them.
      </section>

      <section class="stage-summary" aria-label="Transformation summary">
        <app-stats-card
          step="1"
          title="Parse"
          description="Tokenize the expression and add explicit concatenation."
          [code]="conversion?.postfix?.join(' ') || 'Waiting for input...'"
        ></app-stats-card>
        <app-stats-card
          step="2"
          title="Thompson NFA"
          description="Build small fragments and combine them with epsilon transitions."
          [value]="countSummary(conversion?.nfa)"
        ></app-stats-card>
        <app-stats-card
          step="3"
          title="Subset DFA"
          description="Convert sets of NFA states into deterministic DFA states."
          [value]="countSummary(conversion?.dfa)"
        ></app-stats-card>
        <app-stats-card
          step="4"
          title="Final FA"
          description="Merge equivalent DFA states into the compact automaton."
          [value]="countSummary(conversion?.minimizedDfa)"
        ></app-stats-card>
      </section>

      <app-string-tester [regex]="regex" (testStarted)="showFinalAutomaton($event)"></app-string-tester>

      <section class="tabs" aria-label="Automata diagrams">
        <button class="tab" [class.active]="activeTab === 'minimized'" (click)="activeTab = 'minimized'">
          Final FA
        </button>
        <button class="tab" [class.active]="activeTab === 'nfa'" (click)="activeTab = 'nfa'">NFA</button>
        <button class="tab" [class.active]="activeTab === 'dfa'" (click)="activeTab = 'dfa'">DFA</button>
        <button class="tab" [class.active]="activeTab === 'steps'" (click)="activeTab = 'steps'">
          Construction Steps
        </button>
      </section>

      <section class="panel diagram-section active" *ngIf="activeTab === 'nfa'">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Stage 1</p>
            <h2>Thompson NFA</h2>
          </div>
          <p>Accepting states use double circles. Epsilon transitions are labeled ε.</p>
        </div>
        <app-transition-table [automaton]="conversion?.nfa || null"></app-transition-table>
        <app-automaton-canvas [automaton]="conversion?.nfa || null"></app-automaton-canvas>
      </section>

      <section class="panel diagram-section active" *ngIf="activeTab === 'dfa'">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Stage 2</p>
            <h2>Subset construction DFA</h2>
          </div>
          <p>Each DFA state represents an epsilon-closed set of NFA states.</p>
        </div>
        <app-transition-table [automaton]="conversion?.dfa || null" mappingLabel="NFA set"></app-transition-table>
        <app-automaton-canvas [automaton]="conversion?.dfa || null"></app-automaton-canvas>
      </section>

      <section class="panel diagram-section active" *ngIf="activeTab === 'minimized'">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Final automaton</p>
            <h2>Minimized FA</h2>
          </div>
          <p>This is the compact automaton used for string testing. NFA and DFA tabs show the construction stages.</p>
        </div>
        <app-transition-table [automaton]="conversion?.minimizedDfa || null" mappingLabel="DFA group"></app-transition-table>
        <app-automaton-canvas [automaton]="conversion?.minimizedDfa || null"></app-automaton-canvas>
      </section>

      <section class="panel diagram-section active" *ngIf="activeTab === 'steps'">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Learning guide</p>
            <h2>Thompson construction operations</h2>
          </div>
          <p>These steps mirror the postfix expression used to construct the NFA.</p>
        </div>
        <ol class="steps">
          <li *ngFor="let step of conversion?.nfa?.steps">
            <strong>{{ step.title }}</strong>
            {{ step.description }}
          </li>
        </ol>
      </section>
    </main>

    <footer>Built as an educational tool for visualizing formal language transformations.</footer>
  `,
})
export class AppComponent {
  regex = "(a|b)*ab";
  examples = ["(a+b)*aa(a+b)*", "(a+b)*ab", "a(b+c)*", "a?b*"];
  conversion: ConversionResult | null = null;
  isDirty = false;
  activeTab: ActiveTab = "minimized";
  loading = false;
  error = false;
  statusMessage = "";

  constructor(private readonly automataApi: AutomataApiService) {
    this.convert();
  }

  convert(): void {
    this.loading = true;
    this.error = false;
    this.statusMessage = "Building automata...";

    this.automataApi.convert(this.regex).subscribe({
      next: (conversion) => {
        this.conversion = conversion;
        this.regex = conversion.regex;
        this.isDirty = false;
        this.activeTab = "minimized";
        this.loading = false;
        this.statusMessage = "Conversion complete. Inspect each stage or test a string.";
      },
      error: (error) => {
        this.loading = false;
        this.error = true;
        this.statusMessage = error?.error?.error || "Unable to convert this expression.";
      },
    });
  }

  useExample(example: string): void {
    this.regex = example;
    this.convert();
  }

  onRegexInput(value: string): void {
    this.regex = value;
    this.isDirty = this.conversion?.regex !== this.regex;
  }

  showFinalAutomaton(testedRegex: string): void {
    this.activeTab = "minimized";
    if (this.conversion?.regex !== testedRegex && !this.loading) {
      this.convert();
    }
  }

  countSummary(automaton: { states: string[]; transitions: unknown[] } | null | undefined): string {
    if (!automaton) {
      return "0 states";
    }
    return `${automaton.states.length} states, ${automaton.transitions.length} transitions`;
  }
}
