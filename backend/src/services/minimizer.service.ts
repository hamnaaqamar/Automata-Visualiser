import { type Automaton, type Transition } from "../models/automata.types";
import { DfaService } from "./dfa.service";
import { NfaService } from "./nfa.service";
import { naturalCompare } from "./sort.service";

export class MinimizerService {
  constructor(
    private readonly dfaService = new DfaService(),
    private readonly nfaService = new NfaService(),
  ) {}

  minimize(dfa: Automaton): Automaton {
    const complete = this.dfaService.complete(dfa);
    const accepting = new Set(complete.accepts);
    const acceptingGroup = complete.states.filter((state) => accepting.has(state));
    const rejectingGroup = complete.states.filter((state) => !accepting.has(state));
    let partitions = [acceptingGroup, rejectingGroup].filter((group) => group.length > 0);
    let changed = true;

    while (changed) {
      changed = false;
      const nextPartitions: string[][] = [];

      partitions.forEach((group) => {
        const buckets = new Map<string, string[]>();

        group.forEach((state) => {
          const signature = complete.alphabet
            .map((symbol) => this.partitionIndex(partitions, this.dfaService.transitionTarget(complete, state, symbol)))
            .join("|");

          if (!buckets.has(signature)) {
            buckets.set(signature, []);
          }
          buckets.get(signature)?.push(state);
        });

        if (buckets.size > 1) {
          changed = true;
        }

        buckets.forEach((bucket) => nextPartitions.push(bucket));
      });

      partitions = nextPartitions;
    }

    partitions = this.orderPartitions(partitions, complete.start);

    const stateMap = new Map<string, string>();
    const groupedStates: Record<string, string[]> = {};
    partitions.forEach((group, index) => {
      const id = `M${index}`;
      groupedStates[id] = group.slice().sort(naturalCompare);
      group.forEach((state) => stateMap.set(state, id));
    });

    const transitions: Transition[] = [];
    const seenTransitions = new Set<string>();
    partitions.forEach((group, index) => {
      const from = `M${index}`;
      const representative = group[0];

      complete.alphabet.forEach((symbol) => {
        const target = this.dfaService.transitionTarget(complete, representative, symbol);
        const to = target ? stateMap.get(target) : undefined;
        if (!to) {
          return;
        }

        const key = `${from}|${symbol}|${to}`;
        if (!seenTransitions.has(key)) {
          seenTransitions.add(key);
          transitions.push({ from, to, symbol });
        }
      });
    });

    return this.nfaService.normalize({
      type: "Minimized DFA",
      states: partitions.map((_, index) => `M${index}`),
      alphabet: complete.alphabet,
      transitions,
      start: stateMap.get(complete.start) || "M0",
      accepts: partitions
        .map((group, index) => (group.some((state) => accepting.has(state)) ? `M${index}` : null))
        .filter((state): state is string => Boolean(state)),
      groupedStates,
    });
  }

  private partitionIndex(partitions: string[][], state: string | null): number {
    return partitions.findIndex((group) => state !== null && group.includes(state));
  }

  private orderPartitions(partitions: string[][], startState: string): string[][] {
    const ordered = [...partitions];
    const startIndex = ordered.findIndex((group) => group.includes(startState));
    if (startIndex > 0) {
      const [startGroup] = ordered.splice(startIndex, 1);
      ordered.unshift(startGroup);
    }
    return ordered;
  }
}
