# AutomataViz — DFA / NFA Visual Simulator

A **GUI-based visual simulator** for Deterministic and Non-Deterministic Finite Automata with step-by-step transition animation.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?logo=d3.js&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---|---|
| **DFA Simulation** | Define states, alphabet, transitions and simulate step-by-step |
| **NFA Simulation** | Set-based simulation with multiple active states |
| **ε-Transitions** | Full epsilon closure support for ε-NFA |
| **Visual Graph** | Interactive D3.js rendered state diagram with animated transitions |
| **Step-by-Step** | Manual step or auto-play with adjustable speed |
| **Speed Control** | Slider to adjust simulation speed (200ms – 2000ms) |
| **Quick Presets** | Pre-built automata (even 0s, ends in 01, contains "ab", divisible by 3, ε-NFA) |
| **Export / Import** | Save and load automaton definitions as JSON |
| **Dark / Light Theme** | Toggle between dark and light modes |
| **Simulation History** | Scrollable log of all simulation steps |

---

## 🚀 Getting Started

### Run Locally

No build tools required — just open `index.html` in any modern browser:

```bash
# Clone the repository
git clone https://github.com/your-username/dfa-nfa-simulator.git
cd dfa-nfa-simulator

# Open in browser
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

### Or use a local server

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

---

## 📁 Project Structure

```
dfa-nfa-simulator/
├── index.html          # Main HTML page (markup only)
├── css/
│   └── styles.css      # All styling (dark/light theme support)
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

## 🎮 Usage

1. **Select a preset** from the sidebar, or define your own automaton
2. **Build the transition table** and click "Draw Graph"
3. **Enter a test string** and click ▶ Simulate or Step
4. Watch the **animated state transitions** on the graph
5. Check the **history log** for a full trace of each step

---

## 🛠 Technologies

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, grid layout, transitions
- **JavaScript (ES6+)** — Modular vanilla JS (no framework)
- **D3.js v7** — SVG-based graph rendering

---

## 📄 License

MIT License — feel free to use, modify, and distribute.
