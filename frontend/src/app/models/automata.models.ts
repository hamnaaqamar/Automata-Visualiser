export interface Transition {
  from: string;
  to: string;
  symbol: string | null;
}

export interface ConstructionStep {
  title: string;
  description: string;
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

export interface PositionedState {
  id: string;
  x: number;
  y: number;
  accepting: boolean;
  start: boolean;
}

export interface PositionedTransition {
  from: string;
  to: string;
  label: string;
  path: string;
  labelX: number;
  labelY: number;
  selfLoop: boolean;
}

export interface AutomatonLayout {
  width: number;
  height: number;
  states: PositionedState[];
  transitions: PositionedTransition[];
  startArrowPath: string;
  startLabelX: number;
  startLabelY: number;
}
