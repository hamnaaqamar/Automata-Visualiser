export const EPSILON = null;
export const EPSILON_LABEL = "ε";
export const CONCAT = "·";

export type SymbolValue = string | null;

export interface Token {
  type: "literal" | "epsilon" | "operator";
  value: string;
  label: string;
}

export interface ConstructionStep {
  title: string;
  description: string;
}

export interface Transition {
  from: string;
  to: string;
  symbol: SymbolValue;
}

export interface Automaton {
  type: string;
  states: string[];
  alphabet: string[];
  transitions: Transition[];
  start: string;
  accepts: string[];
  steps?: ConstructionStep[];
  subsets?: Record<string, string[]>;
  groupedStates?: Record<string, string[]>;
}

export interface CompiledRegex {
  tokens: Token[];
  tokensWithConcat: Token[];
  postfix: Token[];
}

export interface ConversionResult {
  regex: string;
  tokens: string[];
  tokensWithConcat: string[];
  postfix: string[];
  nfa: Automaton;
  dfa: Automaton;
  minimizedDfa: Automaton;
}

export interface SimulationStep {
  state: string;
  symbol: string | null;
  remainingInput?: string;
  error?: string;
}

export interface SimulationResult {
  accepted: boolean;
  trace: SimulationStep[];
}

export interface ConvertRequest {
  regex: string;
}

export interface TestRequest {
  regex: string;
  input: string;
}

export class RegexSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegexSyntaxError";
  }
}
