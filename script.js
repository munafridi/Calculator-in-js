const resultEl = document.querySelector('#result');
const expressionEl = document.querySelector('#expression');
const keypad = document.querySelector('.keypad');

let displayValue = '0';
let storedValue = null;
let pendingOperator = null;
let waitingForOperand = false;
let justEvaluated = false;

const symbols = { '+': '+', '−': '−', '×': '×', '÷': '÷' };

function pretty(value) {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Number.parseFloat(value.toPrecision(11));
  const text = String(rounded);
  if (text.length <= 13) return text;
  return rounded.toExponential(6).replace(/\.?(0+)e/, 'e');
}

function updateDisplay() {
  let shownValue = displayValue;
  let preview = '';
  if (pendingOperator && storedValue !== null) {
    const expression = waitingForOperand
      ? `${pretty(storedValue)} ${symbols[pendingOperator]}`
      : `${pretty(storedValue)} ${symbols[pendingOperator]} ${displayValue}`;
    shownValue = expression;
    if (!waitingForOperand) preview = `= ${pretty(calculate(storedValue, Number(displayValue), pendingOperator))}`;
    expressionEl.textContent = preview;
  }
  resultEl.textContent = shownValue;
  resultEl.title = shownValue;
  if (!pendingOperator && !justEvaluated) {
    expressionEl.textContent = '';
  }
}

function reset() {
  displayValue = '0'; storedValue = null; pendingOperator = null;
  waitingForOperand = false; justEvaluated = false;
  expressionEl.textContent = '';
  document.querySelectorAll('.key-operator').forEach(key => key.classList.remove('is-active'));
  updateDisplay();
}

function inputNumber(number) {
  if (displayValue === 'Error' || waitingForOperand || justEvaluated) {
    displayValue = number; waitingForOperand = false; justEvaluated = false;
    if (!pendingOperator) expressionEl.textContent = '';
  } else if (displayValue.replace('-', '').replace('.', '').length < 12) {
    displayValue = displayValue === '0' ? number : displayValue + number;
  }
  updateDisplay();
}

function inputDecimal() {
  if (displayValue === 'Error' || waitingForOperand || justEvaluated) {
    displayValue = '0.'; waitingForOperand = false; justEvaluated = false;
  } else if (!displayValue.includes('.')) displayValue += '.';
  updateDisplay();
}

function calculate(a, b, operator) {
  if (operator === '+') return a + b;
  if (operator === '−') return a - b;
  if (operator === '×') return a * b;
  if (operator === '÷') return b === 0 ? NaN : a / b;
  return b;
}

function chooseOperator(operator) {
  if (displayValue === 'Error') reset();
  const current = Number(displayValue);
  if (pendingOperator && !waitingForOperand) {
    const computed = calculate(storedValue, current, pendingOperator);
    displayValue = pretty(computed);
    storedValue = computed;
  } else storedValue = current;
  pendingOperator = operator;
  waitingForOperand = true;
  justEvaluated = false;
  document.querySelectorAll('.key-operator').forEach(key => key.classList.toggle('is-active', key.dataset.operator === operator));
  updateDisplay();
}

function equals() {
  if (!pendingOperator || storedValue === null || displayValue === 'Error') return;
  const first = storedValue;
  const second = Number(displayValue);
  const operator = pendingOperator;
  const answer = calculate(first, second, operator);
  expressionEl.textContent = `${pretty(first)} ${symbols[operator]} ${pretty(second)} =`;
  displayValue = pretty(answer);
  storedValue = null; pendingOperator = null;
  waitingForOperand = true; justEvaluated = true;
  document.querySelectorAll('.key-operator').forEach(key => key.classList.remove('is-active'));
  updateDisplay();
}

function performAction(action) {
  if (action === 'clear') return reset();
  if (action === 'decimal') return inputDecimal();
  if (action === 'equals') return equals();
  if (displayValue === 'Error') reset();
  if (action === 'sign') {
    if (displayValue !== '0') displayValue = displayValue.startsWith('-') ? displayValue.slice(1) : `-${displayValue}`;
  }
  if (action === 'percent') displayValue = pretty(Number(displayValue) / 100);
  updateDisplay();
}

keypad.addEventListener('click', event => {
  const key = event.target.closest('button');
  if (!key) return;
  if (key.dataset.number !== undefined) inputNumber(key.dataset.number);
  else if (key.dataset.operator) chooseOperator(key.dataset.operator);
  else if (key.dataset.action) performAction(key.dataset.action);
});

document.addEventListener('keydown', event => {
  if (/^[0-9]$/.test(event.key)) inputNumber(event.key);
  else if (event.key === '.' || event.key === ',') inputDecimal();
  else if (event.key === '+') chooseOperator('+');
  else if (event.key === '-') chooseOperator('−');
  else if (event.key === '*') chooseOperator('×');
  else if (event.key === '/') { event.preventDefault(); chooseOperator('÷'); }
  else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); equals(); }
  else if (event.key === 'Escape' || event.key === 'Delete') reset();
  else if (event.key === '%') performAction('percent');
  else if (event.key === 'Backspace') {
    if (!waitingForOperand && displayValue !== 'Error') {
      displayValue = displayValue.length > 1 ? displayValue.slice(0, -1) : '0';
      if (displayValue === '-') displayValue = '0';
      updateDisplay();
    }
  }
});

updateDisplay();
