# Automata Visualizer

An educational web application that converts a regular expression into:

1. a nondeterministic finite automaton (NFA) with Thompson's construction,
2. a deterministic finite automaton (DFA) with subset construction, and
3. a minimized DFA.

The app also lets learners test strings against the minimized DFA and inspect SVG
diagrams for every automaton stage. The project is split into a TypeScript Express
backend and an Angular frontend.

## Features

- Regular expression input with implicit concatenation.
- Supported operators:
  - union: `|`
  - Kleene star: `*`
  - one-or-more: `+`
  - optional: `?`
  - grouping: `()`
  - epsilon: `ε`
- Thompson NFA construction steps.
- Subset-construction DFA with NFA-state-set mappings.
- DFA minimization with equivalent-state group mappings.
- Interactive string acceptance/rejection tracing.
- TypeScript Express backend with controller, route, middleware, model, and service layers.
- Angular frontend with reusable visualization, stats, table, and string-testing components.

## Project structure

```text
automata-visualizer/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── controllers/
│       │   └── automata.controller.ts
│       ├── middleware/
│       │   └── error.middleware.ts
│       ├── models/
│       │   └── automata.types.ts
│       ├── routes/
│       │   └── automata.routes.ts
│       └── services/
│           ├── automata.service.ts
│           ├── dfa.service.ts
│           ├── minimizer.service.ts
│           ├── nfa.service.ts
│           └── parser.service.ts
└── frontend/
    ├── angular.json
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── environments/
        │   ├── environment.ts
        │   └── environment.prod.ts
        └── app/
            ├── components/
            │   ├── automaton-canvas/
            │   ├── stats-card/
            │   ├── string-tester/
            │   └── transition-table/
            ├── models/
            └── services/
```

## Run locally

```bash
npm install
npm run start:backend
```

In a second terminal:

```bash
npm run start:frontend
```

Open <http://localhost:4200> in your browser. The frontend calls the backend at
<http://localhost:3000/api/automata>.

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## Example

Use the expression:

```text
(a|b)*ab
```

Accepted strings include `ab`, `aab`, and `bbab`. Rejected strings include `aba`
and `ba`.
# Automata-Visualiser
