import { type ConversionResult, type SimulationResult } from "../models/automata.types";
import { DfaService } from "./dfa.service";
import { MinimizerService } from "./minimizer.service";
import { NfaService } from "./nfa.service";
import { ParserService } from "./parser.service";

export class AutomataService {
  constructor(
    private readonly parserService = new ParserService(),
    private readonly nfaService = new NfaService(),
    private readonly dfaService = new DfaService(),
    private readonly minimizerService = new MinimizerService(),
  ) {}

  convert(regex: string): ConversionResult {
    const compiled = this.parserService.compile(regex);
    const nfa = this.nfaService.build(compiled.postfix);
    const dfa = this.dfaService.convert(nfa);
    const minimizedDfa = this.minimizerService.minimize(dfa);

    return {
      regex,
      tokens: compiled.tokens.map((token) => token.label),
      tokensWithConcat: compiled.tokensWithConcat.map((token) => token.label),
      postfix: compiled.postfix.map((token) => token.label),
      nfa,
      dfa,
      minimizedDfa,
    };
  }

  test(regex: string, input: string): SimulationResult {
    const conversion = this.convert(regex);
    return this.dfaService.simulate(conversion.minimizedDfa, input);
  }
}
