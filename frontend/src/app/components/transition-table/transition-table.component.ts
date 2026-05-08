import { NgFor, NgIf } from "@angular/common";
import { Component, Input } from "@angular/core";
import { Automaton } from "../../models/automata.models";

@Component({
  selector: "app-transition-table",
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <div class="mapping" *ngIf="mappingEntries.length > 0">
      <div class="mapping-item" *ngFor="let entry of mappingEntries">
        <strong>{{ entry.key }}</strong>
        <br />
        {{ mappingLabel }}: {{ "{" }} {{ entry.value.join(", ") }} {{ "}" }}
      </div>
    </div>

    <div class="table-wrap" *ngIf="automaton">
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>Symbol</th>
            <th>To</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let transition of automaton.transitions">
            <td>{{ transition.from }}</td>
            <td>{{ transition.symbol === null ? "ε" : transition.symbol }}</td>
            <td>{{ transition.to }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class TransitionTableComponent {
  @Input() automaton: Automaton | null = null;
  @Input() mappingLabel = "Group";

  get mappingEntries(): Array<{ key: string; value: string[] }> {
    const mapping = this.automaton?.subsets || this.automaton?.groupedStates || {};
    return Object.entries(mapping).map(([key, value]) => ({ key, value }));
  }
}
