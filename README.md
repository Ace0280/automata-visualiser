# Stateforge — Finite Automata Toolkit

A **GUI-based visual learning workspace** for Deterministic and Non-Deterministic Finite Automata with step-by-step transition animation, subset construction, and regex compilation.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?logo=d3.js&logoColor=white)

---

## Features

| Feature | Description |
|---|---|
| **DFA & NFA Simulation** | Define states, alphabet, transitions, and simulate sequentially or concurrently. |
| **ε-Transitions** | Full epsilon closure support for ε-NFA. |
| **Visual Graph** | Interactive D3.js rendered state diagram tracking state traversal. |
| **Batch Testing** | Test multiple strings instantly and export results as CSV. |
| **URL State Sharing** | Share your automaton exact configuration with a single URL natively. |
| **NFA → DFA Conversion** | Interactively run Subset Construction to generate equivalent DFA. |
| **Regex → NFA** | Build automata automatically from Regular Expressions (Thompson's construction). |
| **Export Data** | Export transition tables as LaTeX grids or valid CSV. |
| **Simulation History** | Scrollable trace log of the current execution. |
| **Keyboard Shortcuts** | Fully keyboard-navigable execution controls. |

---

## Getting Started

### Live Demo

You can try out the Stateforge toolkit directly in your browser, no installation required.

🔗 **Run Stateforge on Vercel:** [https://automata-visualiser-fapn-5xkjvlnlr-ace0280s-projects.vercel.app]

It works out of the box — just open the link, pick a preset, or build one with Regex.

> **Note:** The simulator is built with pure HTML, CSS, and Vanilla JavaScript with modular structure.


---

## Project Structure

```
dfa-nfa-simulator/
├── index.html          # Main HTML page (markup only)
├── css/
│   └── styles.css      # All styling 
├── js/
│   ├── automaton.js    # Automaton data model, presets, ε-closure
│   ├── ui.js           # DOM helpers, toast, table, theme toggle
│   ├── graph.js        # D3.js graph rendering
│   ├── simulator.js    # Simulation engine (DFA/NFA/ε-NFA)
│   └── app.js          # Main entry point, event wiring
├── .gitignore
└── README.md
```

---

## Usage

1. **Select a preset** from the sidebar, or define your own automaton
2. **Build the transition table** and click "Draw Graph"
3. **Enter a test string** and click ▶ Simulate or Step
4. Watch the **animated state transitions** on the graph
5. Check the **history log** for a full trace of each step

---

## Technologies

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, grid layout, transitions
- **JavaScript (ES6+)** — Modular vanilla JS (no framework)
- **D3.js v7** — SVG-based graph rendering

---

## License

MIT License — feel free to use, modify, and distribute.
