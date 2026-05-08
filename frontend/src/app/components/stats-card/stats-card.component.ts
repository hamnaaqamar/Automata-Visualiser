import { NgIf } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
  selector: "app-stats-card",
  standalone: true,
  imports: [NgIf],
  template: `
    <article class="summary-card">
      <span class="summary-step">{{ step }}</span>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
      <strong>{{ value }}</strong>
      <code *ngIf="code">{{ code }}</code>
    </article>
  `,
})
export class StatsCardComponent {
  @Input({ required: true }) step = "";
  @Input({ required: true }) title = "";
  @Input({ required: true }) description = "";
  @Input() value = "";
  @Input() code = "";
}
