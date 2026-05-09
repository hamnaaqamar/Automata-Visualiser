import test from "node:test";
import assert from "node:assert/strict";
import { AutomataService } from "../src/services/automata.service";

const service = new AutomataService();

function accepts(regex: string, input: string): boolean {
  const conversion = service.convert(regex);
  return service.test(regex, input).accepted && conversion.minimizedDfa.states.length > 0;
}

test("converts the sample expression (a|b)*ab", () => {
  assert.equal(accepts("(a|b)*ab", "ab"), true);
  assert.equal(accepts("(a|b)*ab", "aab"), true);
  assert.equal(accepts("(a|b)*ab", "bbab"), true);
  assert.equal(service.test("(a|b)*ab", "aba").accepted, false);
  assert.equal(service.test("(a|b)*ab", "ba").accepted, false);
});

test("supports union, concatenation, grouping, repetition, and epsilon", () => {
  assert.equal(service.test("a|b", "a").accepted, true);
  assert.equal(service.test("a|b", "b").accepted, true);
  assert.equal(service.test("a|b", "ab").accepted, false);
  assert.equal(service.test("a+b", "a").accepted, true);
  assert.equal(service.test("a+b", "b").accepted, true);
  assert.equal(service.test("a+b", "ab").accepted, false);
  assert.equal(service.test("a(b|c)", "ac").accepted, true);
  assert.equal(service.test("a*", "").accepted, true);
  assert.equal(service.test("a(b+c)?", "ac").accepted, true);
  assert.equal(service.test("ε", "").accepted, true);
  assert.equal(service.test("ε", "a").accepted, false);
});

test("accepts classroom plus-union notation", () => {
  const regex = "(a+b)*aa(a+b)*";

  assert.equal(service.test(regex, "aa").accepted, true);
  assert.equal(service.test(regex, "baa").accepted, true);
  assert.equal(service.test(regex, "aab").accepted, true);
  assert.equal(service.test(regex, "babaabb").accepted, true);
  assert.equal(service.test(regex, "abab").accepted, false);
});

test("minimization preserves deterministic transitions without display-only trap states", () => {
  const conversion = service.convert("(a|b)*ab");
  const minimized = conversion.minimizedDfa;

  assert.equal(minimized.start, "M0");
  assert.ok(minimized.accepts.length > 0);
  assert.ok(minimized.states.length <= conversion.dfa.states.length + 1);
  assert.equal(minimized.states.includes("DEAD"), false);

  minimized.states.forEach((state) => {
    minimized.alphabet.forEach((symbol) => {
      const transitions = minimized.transitions.filter(
        (transition) => transition.from === state && transition.symbol === symbol,
      );
      assert.ok(transitions.length <= 1);
    });
  });
});

test("testing uses the current regex semantics", () => {
  assert.equal(service.test("ab*", "a").accepted, true);
  assert.equal(service.test("ab*", "abbb").accepted, true);
  assert.equal(service.test("ab*", "b").accepted, false);
});

test("reports invalid expressions", () => {
  assert.throws(() => service.convert("a|"), /missing an operand/);
  assert.throws(() => service.convert("(ab"), /Mismatched opening parenthesis/);
  assert.throws(() => service.convert("*a"), /no expression to repeat/);
});
