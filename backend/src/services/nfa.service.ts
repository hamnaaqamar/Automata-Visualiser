import {
  CONCAT,
  EPSILON,
  type Automaton,
  type ConstructionStep,
  type Token,
  type Transition,
} from "../models/automata.types";
import { naturalCompare, symbolLabel } from "./sort.service";

interface Fragment {
  start: string;
  accept: string;
  expression: string;
}

export class NfaService {
  build(postfix: Token[]): Automaton {
    let stateCounter = 0;
    const transitions: Transition[] = [];
    const alphabet = new Set<string>();
    const steps: ConstructionStep[] = [];
    const stack: Fragment[] = [];
    const createState = () => `q${stateCounter++}`;
    const createFragment = (start: string, accept: string, expression: string): Fragment => ({ start, accept, expression });
    const addTransition = (from: string, to: string, symbol: string | null) => {
      transitions.push({ from, to, symbol });
    };

    postfix.forEach((token) => {
      if (token.type === "literal" || token.type === "epsilon") {
        const start = createState();
        const accept = createState();
        const symbol = token.type === "epsilon" ? EPSILON : token.value;
        if (symbol !== EPSILON) {
          alphabet.add(symbol);
        }
        addTransition(start, accept, symbol);
        stack.push(createFragment(start, accept, token.label));
        steps.push({
          title: `Create fragment for ${token.label}`,
          description: `A start state connects to an accept state using ${token.label}.`,
        });
        return;
      }

      if (token.value === CONCAT) {
        const right = this.popFragment(stack);
        const left = this.popFragment(stack);
        addTransition(left.accept, right.start, EPSILON);
        stack.push(createFragment(left.start, right.accept, `${left.expression}${right.expression}`));
        steps.push({
          title: "Concatenate fragments",
          description: `Join ${left.expression} to ${right.expression} with an epsilon transition.`,
        });
        return;
      }

      if (token.value === "|" || token.value === "+") {
        const right = this.popFragment(stack);
        const left = this.popFragment(stack);
        const start = createState();
        const accept = createState();
        addTransition(start, left.start, EPSILON);
        addTransition(start, right.start, EPSILON);
        addTransition(left.accept, accept, EPSILON);
        addTransition(right.accept, accept, EPSILON);
        stack.push(createFragment(start, accept, `(${left.expression}|${right.expression})`));
        steps.push({
          title: "Apply alternation",
          description: `Branch to either ${left.expression} or ${right.expression}, then merge with epsilon transitions.`,
        });
        return;
      }

      if (token.value === "*") {
        const fragment = this.popFragment(stack);
        const start = createState();
        const accept = createState();
        addTransition(start, fragment.start, EPSILON);
        addTransition(start, accept, EPSILON);
        addTransition(fragment.accept, fragment.start, EPSILON);
        addTransition(fragment.accept, accept, EPSILON);
        stack.push(createFragment(start, accept, `(${fragment.expression})*`));
        steps.push({
          title: "Apply Kleene star",
          description: `Allow zero or more repetitions of ${fragment.expression}.`,
        });
        return;
      }

      if (token.value === "?") {
        const fragment = this.popFragment(stack);
        const start = createState();
        const accept = createState();
        addTransition(start, fragment.start, EPSILON);
        addTransition(start, accept, EPSILON);
        addTransition(fragment.accept, accept, EPSILON);
        stack.push(createFragment(start, accept, `(${fragment.expression})?`));
        steps.push({
          title: "Apply optional",
          description: `Allow either ${fragment.expression} or the empty string.`,
        });
      }
    });

    if (stack.length !== 1) {
      throw new Error("Unable to build an NFA from the expression.");
    }

    const finalFragment = stack[0];
    const states = Array.from({ length: stateCounter }, (_, index) => `q${index}`);

    return this.normalize({
      type: "NFA",
      states,
      alphabet: Array.from(alphabet),
      transitions,
      start: finalFragment.start,
      accepts: [finalFragment.accept],
      steps,
    });
  }

  normalize(automaton: Automaton): Automaton {
    return {
      ...automaton,
      states: [...automaton.states].sort(naturalCompare),
      alphabet: [...automaton.alphabet].sort(),
      transitions: [...automaton.transitions].sort((a, b) => {
        const from = naturalCompare(a.from, b.from);
        if (from !== 0) return from;
        const symbol = symbolLabel(a.symbol).localeCompare(symbolLabel(b.symbol));
        if (symbol !== 0) return symbol;
        return naturalCompare(a.to, b.to);
      }),
      accepts: [...automaton.accepts].sort(naturalCompare),
    };
  }

  private popFragment(stack: Fragment[]): Fragment {
    const fragment = stack.pop();
    if (!fragment) {
      throw new Error("Invalid construction stack.");
    }
    return fragment;
  }
}
