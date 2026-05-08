import { NgFor, NgIf } from "@angular/common";
import { Component, Input, OnChanges } from "@angular/core";
import { Automaton, AutomatonLayout } from "../../models/automata.models";
import { CanvasLayoutService } from "../../services/canvas-layout.service";

@Component({
  selector: "app-automaton-canvas",
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <div class="graph" *ngIf="layout; else empty">
      <svg
        class="automaton-svg"
        [attr.viewBox]="'0 0 ' + layout.width + ' ' + layout.height"
        role="img"
        [attr.aria-label]="(automaton?.type || 'Automaton') + ' diagram'"
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M2,2 L10,6 L2,10 z" fill="#475569"></path>
          </marker>
        </defs>

        <g>
          <path
            *ngFor="let transition of layout.transitions"
            class="edge"
            [attr.d]="transition.path"
            marker-end="url(#arrow)"
          ></path>
          <text
            *ngFor="let transition of layout.transitions"
            class="edge-label"
            [attr.x]="transition.labelX"
            [attr.y]="transition.labelY"
          >
            {{ transition.label }}
          </text>
          <path class="start-arrow" [attr.d]="layout.startArrowPath" marker-end="url(#arrow)"></path>
          <text class="edge-label" [attr.x]="layout.startLabelX" [attr.y]="layout.startLabelY">start</text>
        </g>

        <g>
          <ng-container *ngFor="let state of layout.states">
            <circle
              [attr.cx]="state.x"
              [attr.cy]="state.y"
              r="30"
              [class]="'state' + (state.accepting ? ' accept' : '')"
            ></circle>
            <circle
              *ngIf="state.accepting"
              class="state accept inner"
              [attr.cx]="state.x"
              [attr.cy]="state.y"
              r="24"
            ></circle>
            <text class="state-label" [attr.x]="state.x" [attr.y]="state.y + 5">{{ state.id }}</text>
          </ng-container>
        </g>
      </svg>
    </div>

    <ng-template #empty>
      <div class="graph empty">Generate an automaton to display the diagram.</div>
    </ng-template>
  `,
})
export class AutomatonCanvasComponent implements OnChanges {
  @Input() automaton: Automaton | null = null;

  layout: AutomatonLayout | null = null;

  constructor(private readonly canvasLayoutService: CanvasLayoutService) {}

  ngOnChanges(): void {
    this.layout = this.canvasLayoutService.createLayout(this.automaton);
  }
}
