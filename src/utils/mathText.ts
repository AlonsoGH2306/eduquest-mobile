const SYMBOLS: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', Gamma: 'Γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', Theta: 'Θ', kappa: 'κ', lambda: 'λ', Lambda: 'Λ', mu: 'μ', nu: 'ν',
  xi: 'ξ', pi: 'π', Pi: 'Π', rho: 'ρ', sigma: 'σ', Sigma: 'Σ', tau: 'τ', phi: 'φ', varphi: 'φ', Phi: 'Φ',
  chi: 'χ', psi: 'ψ', Psi: 'Ψ', omega: 'ω', Omega: 'Ω',
  approx: '≈', neq: '≠', ne: '≠', leq: '≤', le: '≤', geq: '≥', ge: '≥', equiv: '≡', sim: '∼', propto: '∝',
  times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓', infty: '∞', sum: 'Σ', prod: 'Π', int: '∫', oint: '∮',
  partial: '∂', nabla: '∇', to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftrightarrow: '⇔',
  iff: '⇔', implies: '⇒', in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', cup: '∪', cap: '∩', emptyset: '∅',
  forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨', degree: '°', circ: '°', ldots: '…', cdots: '⋯',
  hbar: 'ℏ', ell: 'ℓ', angle: '∠', perp: '⊥', parallel: '∥',
};

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ', x: 'ˣ', '°': '°',
};

const SUBSCRIPT: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', a: 'ₐ', e: 'ₑ', o: 'ₒ', x: 'ₓ', i: 'ᵢ', n: 'ₙ', m: 'ₘ', k: 'ₖ',
};

const isGreek = (name: string) => /^[α-ωΑ-Ω]$/.test(SYMBOLS[name] ?? '');

const convertScript = (value: string, table: Record<string, string>, marker: string) => {
  const chars = [...value];
  return chars.every((char) => table[char]) ? chars.map((char) => table[char]).join('') : `${marker}(${value})`;
};

const wrap = (value: string) => (value.length > 1 && /[+\-−\s]/.test(value) ? `(${value})` : value);

export const formatMath = (text: string): string => {
  if (!text || !/[\\$^_]/.test(text)) return text;
  const latex = /[\\$]/.test(text);
  let result = text.replace(/\$\$?([^$]+?)\$\$?/g, '$1');
  for (let i = 0; i < 3; i += 1) {
    result = result
      .replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\{([^{}]*)\}/g, '$1')
      .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, top: string, bottom: string) => `${wrap(top)}/${wrap(bottom)}`)
      .replace(/\\sqrt\{([^{}]*)\}/g, (_, value: string) => `√${wrap(value)}`);
  }
  result = result
    .replace(/\^\{?\\circ\}?/g, '°')
    .replace(/\\left|\\right/g, '')
    .replace(/\\([A-Za-z]+)\s+(?=\\([A-Za-z]+))/g, (match, name: string, next: string) =>
      isGreek(name) && isGreek(next) ? `\\${name}` : match,
    )
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/\\([A-Za-z]+)/g, (_, name: string) => SYMBOLS[name] ?? name)
    .replace(/\^\{([^{}]*)\}|\^([A-Za-z0-9+\-])/g, (_, group: string, single: string) => convertScript(group ?? single, SUPERSCRIPT, '^'))
    .replace(latex ? /_\{([^{}]*)\}|_([A-Za-z0-9])/g : /_\{([^{}]*)\}|_(\d)/g, (_, group: string, single: string) =>
      convertScript(group ?? single, SUBSCRIPT, '_'),
    )
    .replace(/[{}]/g, '')
    .replace(/[ \t]{2,}/g, ' ');
  return result;
};
