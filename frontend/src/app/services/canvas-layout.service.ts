import { Injectable } from "@angular/core";
import { Automaton, AutomatonLayout, PositionedTransition, Transition } from "../models/automata.models";

@Injectable({ providedIn: "root" })
export class CanvasLayoutService {
  createLayout(automaton: Automaton | null): AutomatonLayout | null {
    if (!automaton || automaton.states.length === 0) {
      return null;
    }

    const width = 1000;
    const height = Math.max(460, automaton.states.length * 58);
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = Math.min(360, width / 2 - 140);
    const radiusY = Math.min(Math.max(140, automaton.states.length * 26), height / 2 - 90);
    const orderedStates = [
      automaton.start,
      ...automaton.states.filter((state) => state !== automaton.start),
    ];
    const positions = new Map<string, { x: number; y: number }>();

    orderedStates.forEach((state, index) => {
      const angle = automaton.states.length === 1 ? 0 : (Math.PI * 2 * index) / automaton.states.length - Math.PI / 2;
      positions.set(state, {
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
      });
    });

    const start = positions.get(automaton.start) || { x: centerX, y: centerY };

    return {
      width,
      height,
      states: orderedStates.map((id) => {
        const point = positions.get(id) || { x: centerX, y: centerY };
        return {
          id,
          x: point.x,
          y: point.y,
          accepting: automaton.accepts.includes(id),
          start: id === automaton.start,
        };
      }),
      transitions: this.groupTransitions(automaton.transitions).flatMap((transition, index) =>
        this.positionTransition(transition, positions, index),
      ),
      startArrowPath: `M ${start.x - 82} ${start.y} L ${start.x - 34} ${start.y}`,
      startLabelX: start.x - 92,
      startLabelY: start.y - 10,
    };
  }

  private groupTransitions(transitions: Transition[]): Array<{ from: string; to: string; label: string }> {
    const grouped = new Map<string, { from: string; to: string; labels: string[] }>();

    transitions.forEach((transition) => {
      const key = `${transition.from}->${transition.to}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          from: transition.from,
          to: transition.to,
          labels: [],
        });
      }
      grouped.get(key)?.labels.push(transition.symbol === null ? "ε" : transition.symbol);
    });

    return Array.from(grouped.values()).map((transition) => ({
      from: transition.from,
      to: transition.to,
      label: transition.labels.join(", "),
    }));
  }

  private positionTransition(
    transition: { from: string; to: string; label: string },
    positions: Map<string, { x: number; y: number }>,
    index: number,
  ): PositionedTransition[] {
    const from = positions.get(transition.from);
    const to = positions.get(transition.to);

    if (!from || !to) {
      return [];
    }

    if (transition.from === transition.to) {
      return [
        {
          ...transition,
          path: `M ${from.x - 18} ${from.y - 28} C ${from.x - 70} ${from.y - 92}, ${from.x + 70} ${from.y - 92}, ${from.x + 18} ${from.y - 28}`,
          labelX: from.x,
          labelY: from.y - 82,
          selfLoop: true,
        },
      ];
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy) || 1;
    const unitX = dx / distance;
    const unitY = dy / distance;
    const startX = from.x + unitX * 34;
    const startY = from.y + unitY * 34;
    const endX = to.x - unitX * 34;
    const endY = to.y - unitY * 34;
    const normalX = -unitY;
    const normalY = unitX;
    const curve = 34 + (index % 3) * 16;
    const controlX = (startX + endX) / 2 + normalX * curve;
    const controlY = (startY + endY) / 2 + normalY * curve;

    return [
      {
        ...transition,
        path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
        labelX: controlX,
        labelY: controlY - 8,
        selfLoop: false,
      },
    ];
  }
}
