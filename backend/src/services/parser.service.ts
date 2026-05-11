import { CONCAT, EPSILON_LABEL, RegexSyntaxError, type CompiledRegex, type Token } from "../models/automata.types";

export class ParserService {
  compile(regex: string): CompiledRegex {
    const tokens = this.tokenize(regex);
    const tokensWithConcat = this.insertConcatenation(tokens);
    const postfix = this.toPostfix(tokensWithConcat);

    return {
      tokens,
      tokensWithConcat,
      postfix,
    };
  }

  private tokenize(regex: string): Token[] {
    if (typeof regex !== "string") {
      throw new RegexSyntaxError("Regular expression must be a string.");
    }

    const tokens: Token[] = [];
    for (let index = 0; index < regex.length; index += 1) {
      const char = regex[index];

      if (/\s/.test(char)) {
        continue;
      }

      if (char === "\\") {
        const next = regex[index + 1];
        if (!next) {
          throw new RegexSyntaxError("Dangling escape character at the end of the expression.");
        }
        tokens.push({ type: "literal", value: next, label: this.escapeLabel(next) });
        index += 1;
        continue;
      }

      if (char === EPSILON_LABEL) {
        tokens.push({ type: "epsilon", value: EPSILON_LABEL, label: EPSILON_LABEL });
        continue;
      }

      if (char === "^") {
        if (regex[index + 1] !== "+") {
          throw new RegexSyntaxError('Use "^+" for positive closure.');
        }
        tokens.push({ type: "operator", value: "^+", label: "^+" });
        index += 1;
        continue;
      }

      if ("|()*+?".includes(char)) {
        tokens.push({ type: "operator", value: char, label: char });
        continue;
      }

      tokens.push({ type: "literal", value: char, label: this.escapeLabel(char) });
    }

    if (tokens.length === 0) {
      throw new RegexSyntaxError(`Enter a regular expression, or use ${EPSILON_LABEL} for the empty string.`);
    }

    return tokens;
  }

  private insertConcatenation(tokens: Token[]): Token[] {
    const withConcat: Token[] = [];

    tokens.forEach((token, index) => {
      if (index > 0 && this.isAtomEnd(tokens[index - 1]) && this.isAtomStart(token)) {
        withConcat.push({ type: "operator", value: CONCAT, label: CONCAT });
      }
      withConcat.push(token);
    });

    return withConcat;
  }

  private toPostfix(tokens: Token[]): Token[] {
    const output: Token[] = [];
    const stack: Token[] = [];
    const precedence: Record<string, number> = {
      "|": 1,
      "+": 1,
      [CONCAT]: 2,
    };

    tokens.forEach((token) => {
      if (token.type === "literal" || token.type === "epsilon") {
        output.push(token);
        return;
      }

      if (token.value === "(") {
        stack.push(token);
        return;
      }

      if (token.value === ")") {
        let foundOpen = false;
        while (stack.length > 0) {
          const top = stack.pop();
          if (!top) {
            break;
          }
          if (top.value === "(") {
            foundOpen = true;
            break;
          }
          output.push(top);
        }
        if (!foundOpen) {
          throw new RegexSyntaxError("Mismatched closing parenthesis.");
        }
        return;
      }

      if (token.value === "*" || token.value === "^+" || token.value === "?") {
        output.push(token);
        return;
      }

      if (token.value === "|" || token.value === "+" || token.value === CONCAT) {
        while (
          stack.length > 0 &&
          stack[stack.length - 1].value !== "(" &&
          precedence[stack[stack.length - 1].value] >= precedence[token.value]
        ) {
          const top = stack.pop();
          if (top) {
            output.push(top);
          }
        }
        stack.push(token);
        return;
      }

      throw new RegexSyntaxError(`Unsupported token "${token.value}".`);
    });

    while (stack.length > 0) {
      const top = stack.pop();
      if (!top) {
        break;
      }
      if (top.value === "(" || top.value === ")") {
        throw new RegexSyntaxError("Mismatched opening parenthesis.");
      }
      output.push(top);
    }

    this.validatePostfix(output);
    return output;
  }

  private validatePostfix(postfix: Token[]): void {
    let depth = 0;

    postfix.forEach((token) => {
      if (token.type === "literal" || token.type === "epsilon") {
        depth += 1;
        return;
      }

      if (token.value === "*" || token.value === "^+" || token.value === "?") {
        if (depth < 1) {
          throw new RegexSyntaxError(`Operator "${token.value}" has no expression to repeat.`);
        }
        return;
      }

      if (token.value === "|" || token.value === "+" || token.value === CONCAT) {
        if (depth < 2) {
          throw new RegexSyntaxError(`Operator "${token.value}" is missing an operand.`);
        }
        depth -= 1;
      }
    });

    if (depth !== 1) {
      throw new RegexSyntaxError("The expression is incomplete.");
    }
  }

  private isAtomEnd(token: Token): boolean {
    return (
      token.type === "literal" ||
      token.type === "epsilon" ||
      token.value === ")" ||
      token.value === "*" ||
      token.value === "^+" ||
      token.value === "?"
    );
  }

  private isAtomStart(token: Token): boolean {
    return token.type === "literal" || token.type === "epsilon" || token.value === "(";
  }

  private escapeLabel(value: string): string {
    return value === " " ? "space" : value;
  }
}
