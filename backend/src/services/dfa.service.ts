import {
  EPSILON,
  type Automaton,
  type SimulationResult,
  type SimulationStep,
  type Transition,
} from "../models/automata.types";
import { NfaService } from "./nfa.service";
import { naturalCompare } from "./sort.service";

export class DfaService {
  constructor(private readonly nfaService = new NfaService()) {}

  convert(nfa: Automaton): Automaton {
    const alphabet = [...nfa.alphabet].sort();
    const startSet = this.epsilonClosure(nfa, new Set([nfa.start]));
    const setByKey = new Map<string, string>();
    const queue: Set<string>[] = [];
    const states: string[] = [];
    const transitions: Transition[] = [];
    const accepts = new Set<string>();
    const subsets: Record<string, string[]> = {};

    const registerSet = (stateSet: Set<string>) => {
      const key = this.setKey(stateSet);
      const existing = setByKey.get(key);
      if (existing) {
        return existing;
      }

      const id = `D${states.length}`;
      states.push(id);
      setByKey.set(key, id);
      queue.push(stateSet);
      subsets[id] = Array.from(stateSet).sort(naturalCompare);

      if (subsets[id].some((state) => nfa.accepts.includes(state))) {
        accepts.add(id);
      }

      return id;
    };

    registerSet(startSet);

    while (queue.length > 0) {
      const currentSet = queue.shift();
      if (!currentSet) {
        break;
      }
      const from = setByKey.get(this.setKey(currentSet));
      if (!from) {
        continue;
      }

      alphabet.forEach((symbol) => {
        const target = this.epsilonClosure(nfa, this.move(nfa, currentSet, symbol));
        if (target.size === 0) {
          return;
        }
        const to = registerSet(target);
        transitions.push({ from, to, symbol });
      });
    }

    return this.nfaService.normalize({
      type: "DFA",
      states,
      alphabet,
      transitions,
      start: "D0",
      accepts: Array.from(accepts),
      subsets,
    });
  }

  complete(dfa: Automaton): Automaton {
    const states = [...dfa.states];
    const transitions = [...dfa.transitions];
    let needsSink = false;

    dfa.states.forEach((state) => {
      dfa.alphabet.forEach((symbol) => {
        if (!this.transitionTarget(dfa, state, symbol)) {
          needsSink = true;
        }
      });
    });

    if (needsSink) {
      states.push("DEAD");
      dfa.alphabet.forEach((symbol) => {
        transitions.push({ from: "DEAD", to: "DEAD", symbol });
      });

      dfa.states.forEach((state) => {
        dfa.alphabet.forEach((symbol) => {
          if (!this.transitionTarget(dfa, state, symbol)) {
            transitions.push({ from: state, to: "DEAD", symbol });
          }
        });
      });
    }

    return this.nfaService.normalize({
      ...dfa,
      states,
      transitions,
      accepts: dfa.accepts,
    });
  }

  simulate(dfa: Automaton, input: string): SimulationResult {
    let current = dfa.start;
    const trace: SimulationStep[] = [{ state: current, remainingInput: input, symbol: null }];

    for (const symbol of input) {
      if (!dfa.alphabet.includes(symbol)) {
        trace.push({
          state: current,
          symbol,
          error: `Symbol "${symbol}" is not in the DFA alphabet.`,
        });
        return { accepted: false, trace };
      }

      const next = this.transitionTarget(dfa, current, symbol);
      if (!next) {
        trace.push({
          state: current,
          symbol,
          error: `No transition exists from ${current} on "${symbol}".`,
        });
        return { accepted: false, trace };
      }

      current = next;
      trace.push({ state: current, symbol });
    }

    return {
      accepted: dfa.accepts.includes(current),
      trace,
    };
  }

  transitionTarget(dfa: Automaton, state: string, symbol: string): string | null {
    const transition = dfa.transitions.find((item) => item.from === state && item.symbol === symbol);
    return transition ? transition.to : null;
  }

  private epsilonClosure(nfa: Automaton, stateSet: Set<string>): Set<string> {
    const closure = new Set(stateSet);
    const stack = Array.from(stateSet);

    while (stack.length > 0) {
      const state = stack.pop();
      if (!state) {
        continue;
      }

      nfa.transitions
        .filter((transition) => transition.from === state && transition.symbol === EPSILON)
        .forEach((transition) => {
          if (!closure.has(transition.to)) {
            closure.add(transition.to);
            stack.push(transition.to);
          }
        });
    }

    return closure;
  }

  private move(nfa: Automaton, stateSet: Set<string>, symbol: string): Set<string> {
    const target = new Set<string>();

    stateSet.forEach((state) => {
      nfa.transitions
        .filter((transition) => transition.from === state && transition.symbol === symbol)
        .forEach((transition) => target.add(transition.to));
    });

    return target;
  }

  private setKey(stateSet: Set<string>): string {
    return Array.from(stateSet).sort(naturalCompare).join(",");
  }
}
