const resultEl = document.querySelector('#result');
const expressionEl = document.querySelector('#expression');
const keypad = document.querySelector('.keypad');

let expression = '0';
let entryStart = 0;
let justEvaluated = false;
const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };

function pretty(value) {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Number.parseFloat(value.toPrecision(11));
  const text = String(rounded);
  return text.length <= 13 ? text : rounded.toExponential(6).replace(/\.?0+e/, 'e');
}

function shownExpression(value = expression) {
  return value.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');
}

function evaluate(source) {
  const tokens = source.match(/(?:\d*\.\d+|\d+\.?\d*|[+*/-])/g);
  if (!tokens || tokens.join('') !== source.replace(/\s/g, '')) throw new Error('Invalid expression');
  let pos = 0;

  function primary() {
    if (tokens[pos] === '+') { pos++; return primary(); }
    if (tokens[pos] === '-') { pos++; return -primary(); }
    const token = tokens[pos++];
    const value = Number(token);
    if (!Number.isFinite(value)) throw new Error('Invalid number');
    return value;
  }
  function term() {
    let value = primary();
    while (tokens[pos] === '*' || tokens[pos] === '/') {
      const operator = tokens[pos++];
      const right = primary();
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  }
  function sum() {
    let value = term();
    while (tokens[pos] === '+' || tokens[pos] === '-') {
      const operator = tokens[pos++];
      const right = term();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }
  const answer = sum();
  if (pos !== tokens.length || !Number.isFinite(answer)) throw new Error('Invalid result');
  return answer;
}

function isOperator(char) { return ['+', '-', '*', '/'].includes(char); }
function endsWithOperator(value = expression) { return isOperator(value[value.length - 1]); }

function updateDisplay() {
  const displayText = shownExpression();
  resultEl.textContent = displayText;
  resultEl.title = displayText;
  expressionEl.textContent = '';

  if (!justEvaluated && /\d$/.test(expression) && /[+*/-]/.test(expression)) {
    try { expressionEl.textContent = `= ${pretty(evaluate(expression))}`; }
    catch { expressionEl.textContent = ''; }
  }
}

function reset() {
  expression = '0'; entryStart = 0; justEvaluated = false;
  document.querySelectorAll('.key-operator').forEach(key => key.classList.remove('is-active'));
  updateDisplay();
}

function inputNumber(digit) {
  if (justEvaluated) reset();
  if (expression === '0') {
    expression = digit;
    entryStart = 0;
  } else if (endsWithOperator()) {
    entryStart = expression.length;
    expression += digit;
  } else {
    const entry = expression.slice(entryStart);
    if (entry.replace(/[-.]/g, '').length >= 12) return;
    if (entry === '0') expression = expression.slice(0, entryStart) + digit;
    else if (entry === '-0') expression = expression.slice(0, entryStart) + '-' + digit;
    else expression += digit;
  }
  updateDisplay();
}

function inputDecimal() {
  if (justEvaluated) reset();
  if (endsWithOperator()) {
    entryStart = expression.length;
    expression += '0.';
  } else {
    const entry = expression.slice(entryStart);
    if (entry.includes('.')) return;
    expression += '.';
  }
  updateDisplay();
}

function chooseOperator(operator) {
  if (justEvaluated) justEvaluated = false;
  if (endsWithOperator()) expression = expression.slice(0, -1) + operator;
  else expression += operator;
  entryStart = expression.length;
  document.querySelectorAll('.key-operator').forEach(key => key.classList.toggle('is-active', key.dataset.operator === opSymbols[operator]));
  updateDisplay();
}

function equals() {
  if (endsWithOperator() || !/[+*/-]/.test(expression)) return;
  try {
    const completedExpression = shownExpression();
    const answer = pretty(evaluate(expression));
    expression = answer;
    entryStart = 0;
    justEvaluated = true;
    document.querySelectorAll('.key-operator').forEach(key => key.classList.remove('is-active'));
    updateDisplay();
    expressionEl.textContent = `${completedExpression} =`;
  } catch {
    expression = 'Error';
    entryStart = 0;
    justEvaluated = true;
    updateDisplay();
  }
}

function performAction(action) {
  if (action === 'clear') return reset();
  if (action === 'decimal') return inputDecimal();
  if (action === 'equals') return equals();
  if (expression === 'Error') reset();
  if (action === 'sign') {
    const entry = expression.slice(entryStart);
    if (entry && !endsWithOperator()) {
      const updated = entry.startsWith('-') ? entry.slice(1) : `-${entry}`;
      expression = expression.slice(0, entryStart) + updated;
    } else if (endsWithOperator()) {
      expression += '-';
      entryStart = expression.length;
    } else if (expression === '0') expression = '-0';
  }
  if (action === 'percent' && !endsWithOperator()) {
    const entry = expression.slice(entryStart);
    const value = Number(entry) / 100;
    expression = expression.slice(0, entryStart) + pretty(value);
  }
  updateDisplay();
}

keypad.addEventListener('click', event => {
  const key = event.target.closest('button');
  if (!key) return;
  if (key.dataset.number !== undefined) inputNumber(key.dataset.number);
  else if (key.dataset.operator) chooseOperator(Object.keys(opSymbols).find(op => opSymbols[op] === key.dataset.operator));
  else if (key.dataset.action) performAction(key.dataset.action);
});

document.addEventListener('keydown', event => {
  if (/^[0-9]$/.test(event.key)) inputNumber(event.key);
  else if (event.key === '.' || event.key === ',') inputDecimal();
  else if (event.key === '+') chooseOperator('+');
  else if (event.key === '-') chooseOperator('-');
  else if (event.key === '*') chooseOperator('*');
  else if (event.key === '/') { event.preventDefault(); chooseOperator('/'); }
  else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); equals(); }
  else if (event.key === 'Escape' || event.key === 'Delete') reset();
  else if (event.key === '%') performAction('percent');
  else if (event.key === 'Backspace' && expression !== 'Error' && !justEvaluated) {
    if (expression.length > 1) {
      expression = expression.slice(0, -1);
      if (endsWithOperator()) entryStart = expression.length;
      updateDisplay();
    } else reset();
  }
});

updateDisplay();
