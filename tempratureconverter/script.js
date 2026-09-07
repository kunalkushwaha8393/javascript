/* =====================================================
   ThermoConvert — Temperature Converter JavaScript
   ===================================================== */

'use strict';

// ─── DOM References ───────────────────────────────────
const body          = document.getElementById('body');
const tempInput     = document.getElementById('tempInput');
const fromUnit      = document.getElementById('fromUnit');
const errorMsg      = document.getElementById('errorMsg');
const celsiusResult = document.getElementById('celsiusResult');
const fahrenheitResult = document.getElementById('fahrenheitResult');
const kelvinResult  = document.getElementById('kelvinResult');
const convertBtn    = document.getElementById('convertBtn');
const clearBtn      = document.getElementById('clearBtn');
const badgeValue    = document.getElementById('badgeValue');
const gaugeStatus   = document.getElementById('gaugeStatus');
const gaugeFill     = document.getElementById('gaugeFill');
const gaugeThumb    = document.getElementById('gaugeThumb');
const gaugeTrack    = document.getElementById('gaugeTrack');
const formulaText   = document.getElementById('formulaText');
const toast         = document.getElementById('toast');

const celsiusCard    = document.getElementById('celsiusCard');
const fahrenheitCard = document.getElementById('fahrenheitCard');
const kelvinCard     = document.getElementById('kelvinCard');

const copyC = document.getElementById('copyC');
const copyF = document.getElementById('copyF');
const copyK = document.getElementById('copyK');

// Preset buttons
const presets = document.querySelectorAll('.preset-btn');

// ─── State ────────────────────────────────────────────
let lastCelsius = null;

// ─── Conversion Functions ──────────────────────────────

/**
 * Convert any temperature unit to Celsius
 * @param {number} value - The input temperature
 * @param {string} unit  - 'celsius' | 'fahrenheit' | 'kelvin'
 * @returns {number} Celsius value
 */
function toCelsius(value, unit) {
  switch (unit) {
    case 'celsius':    return value;
    case 'fahrenheit': return (value - 32) * (5 / 9);
    case 'kelvin':     return value - 273.15;
    default:           throw new Error('Unknown unit: ' + unit);
  }
}

/**
 * Convert Celsius to target unit
 * @param {number} celsius - Temperature in Celsius
 * @param {string} unit    - Target unit
 * @returns {number}
 */
function fromCelsius(celsius, unit) {
  switch (unit) {
    case 'celsius':    return celsius;
    case 'fahrenheit': return (celsius * 9 / 5) + 32;
    case 'kelvin':     return celsius + 273.15;
    default:           throw new Error('Unknown unit: ' + unit);
  }
}

/**
 * Get the formula string used for the current conversion
 * @param {string} unit - Source unit
 * @returns {string[]} Array of formula strings
 */
function getFormulas(unit) {
  const formulas = {
    celsius: [
      'F = (C × 9/5) + 32',
      'K = C + 273.15',
    ],
    fahrenheit: [
      'C = (F − 32) × 5/9',
      'K = (F − 32) × 5/9 + 273.15',
    ],
    kelvin: [
      'C = K − 273.15',
      'F = (K − 273.15) × 9/5 + 32',
    ],
  };
  return formulas[unit] || [];
}

// ─── Temperature Status ────────────────────────────────

const TEMP_STATUSES = [
  { max: -30,   emoji: '🥶', label: 'Extreme Cold',  theme: 'very-cold' },
  { max: 0,     emoji: '❄️',  label: 'Very Cold',     theme: 'very-cold' },
  { max: 10,    emoji: '🧊',  label: 'Cold',          theme: 'cold'      },
  { max: 20,    emoji: '😊',  label: 'Cool',          theme: 'cold'      },
  { max: 30,    emoji: '🌤️', label: 'Normal',        theme: 'normal'    },
  { max: 38,    emoji: '☀️',  label: 'Warm',          theme: 'normal'    },
  { max: 50,    emoji: '🔥',  label: 'Hot',           theme: 'hot'       },
  { max: 70,    emoji: '♨️',  label: 'Very Hot',      theme: 'hot'       },
  { max: Infinity, emoji: '💀', label: 'Extreme Heat', theme: 'very-hot' },
];

/**
 * Get status info based on Celsius value
 * @param {number} celsius
 * @returns {{ emoji, label, theme }}
 */
function getStatus(celsius) {
  return TEMP_STATUSES.find(s => celsius < s.max) || TEMP_STATUSES[TEMP_STATUSES.length - 1];
}

// ─── Gauge Logic ───────────────────────────────────────

/**
 * Map Celsius to a gauge percentage (range: -50°C to 150°C → 0% to 100%)
 * @param {number} celsius
 * @returns {number} percentage 0–100
 */
function celsiusToGaugePercent(celsius) {
  const MIN = -50;
  const MAX = 150;
  const clamped = Math.max(MIN, Math.min(MAX, celsius));
  return ((clamped - MIN) / (MAX - MIN)) * 100;
}

// ─── UI Updaters ───────────────────────────────────────

/**
 * Update gauge bar and thumb position
 * @param {number} percent - 0 to 100
 */
function updateGauge(percent) {
  gaugeFill.style.width  = percent + '%';
  gaugeThumb.style.left  = percent + '%';
  gaugeTrack.setAttribute('aria-valuenow', Math.round(percent));
}

/**
 * Apply the theme class to body based on temperature status
 * @param {string} theme
 */
function applyTheme(theme) {
  body.className = ''; // clear old themes
  body.classList.add('theme-' + theme);
}

/**
 * Format a number to 2 decimal places, trimming trailing zeros
 * @param {number} num
 * @returns {string}
 */
function formatNum(num) {
  if (!isFinite(num)) return '∞';
  return parseFloat(num.toFixed(2)).toString();
}

/**
 * Animate a result card with a pop effect
 * @param {HTMLElement} card
 */
function animateCard(card) {
  card.classList.remove('active');
  // Force reflow
  void card.offsetWidth;
  card.classList.add('active');
}

/**
 * Show toast notification
 * @param {string} msg - Message to show
 */
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/**
 * Show/hide error message
 * @param {boolean} show
 */
function toggleError(show) {
  errorMsg.classList.toggle('visible', show);
  tempInput.style.borderColor = show ? 'rgba(239, 68, 68, 0.7)' : '';
  tempInput.style.boxShadow   = show ? '0 0 0 4px rgba(239,68,68,0.2)' : '';
}

// ─── Main Convert Logic ────────────────────────────────

/**
 * Perform the conversion and update all UI elements
 */
function convert() {
  const raw  = tempInput.value.trim();
  const unit = fromUnit.value;

  // Validation
  if (raw === '' || isNaN(Number(raw))) {
    toggleError(true);
    clearResults();
    return;
  }
  toggleError(false);

  const inputVal = parseFloat(raw);

  // Kelvin cannot be below absolute zero (0 K = -273.15°C)
  const celsiusEquiv = toCelsius(inputVal, unit);
  if (celsiusEquiv < -273.15) {
    toggleError(true);
    errorMsg.innerHTML = '⚠️ Temperature cannot be below Absolute Zero (−273.15°C / 0 K)!';
    clearResults();
    return;
  }
  errorMsg.innerHTML = '⚠️ Please enter a valid temperature!';

  // Calculate all three values
  const celsius    = celsiusEquiv;
  const fahrenheit = fromCelsius(celsius, 'fahrenheit');
  const kelvin     = fromCelsius(celsius, 'kelvin');

  lastCelsius = celsius;

  // Update result cards
  celsiusResult.textContent    = formatNum(celsius);
  fahrenheitResult.textContent = formatNum(fahrenheit);
  kelvinResult.textContent     = formatNum(kelvin);

  // Highlight the input unit's card
  [celsiusCard, fahrenheitCard, kelvinCard].forEach(c => c.classList.remove('active'));
  if (unit === 'celsius')    animateCard(celsiusCard);
  if (unit === 'fahrenheit') animateCard(fahrenheitCard);
  if (unit === 'kelvin')     animateCard(kelvinCard);

  // Update status badge and gauge
  const status = getStatus(celsius);
  badgeValue.textContent  = `${status.emoji} ${status.label}`;
  gaugeStatus.textContent = `${status.emoji} ${status.label}`;
  applyTheme(status.theme);
  updateGauge(celsiusToGaugePercent(celsius));

  // Update formula display
  const formulas = getFormulas(unit);
  formulaText.textContent = formulas.join('   |   ');

  // Button micro-feedback
  convertBtn.classList.add('btn-flash');
  setTimeout(() => convertBtn.classList.remove('btn-flash'), 300);
}

/**
 * Clear all result fields and reset UI
 */
function clearResults() {
  celsiusResult.textContent    = '—';
  fahrenheitResult.textContent = '—';
  kelvinResult.textContent     = '—';
  gaugeStatus.textContent      = '—';
  badgeValue.textContent       = 'Enter a value';
  updateGauge(0);
  [celsiusCard, fahrenheitCard, kelvinCard].forEach(c => c.classList.remove('active'));
  formulaText.textContent = 'Enter a value to see the formula.';
  lastCelsius = null;
}

/**
 * Full reset
 */
function fullReset() {
  tempInput.value = '';
  fromUnit.value  = 'celsius';
  toggleError(false);
  clearResults();
  applyTheme('normal');
  tempInput.focus();
  showToast('🗑️ Cleared!');
}

// ─── Copy to Clipboard ────────────────────────────────

/**
 * Copy a value to clipboard and show toast
 * @param {string} val - Value string
 * @param {string} label - Unit label
 */
function copyToClipboard(val, label) {
  if (val === '—' || val === '') {
    showToast('❌ Nothing to copy yet!');
    return;
  }
  navigator.clipboard.writeText(val).then(() => {
    showToast(`✅ Copied ${val} ${label}`);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = val;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`✅ Copied ${val} ${label}`);
  });
}

// ─── Event Listeners ──────────────────────────────────

// Convert button
convertBtn.addEventListener('click', convert);

// Clear button
clearBtn.addEventListener('click', fullReset);

// Live conversion on input
tempInput.addEventListener('input', () => {
  if (tempInput.value.trim() !== '') {
    convert();
  } else {
    toggleError(false);
    clearResults();
    applyTheme('normal');
  }
});

// Unit change triggers reconversion
fromUnit.addEventListener('change', () => {
  if (tempInput.value.trim() !== '') convert();
});

// Enter key triggers convert
tempInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') convert();
});

// Copy buttons
copyC.addEventListener('click', () => copyToClipboard(celsiusResult.textContent, '°C'));
copyF.addEventListener('click', () => copyToClipboard(fahrenheitResult.textContent, '°F'));
copyK.addEventListener('click', () => copyToClipboard(kelvinResult.textContent, 'K'));

// Preset buttons
presets.forEach(btn => {
  btn.addEventListener('click', () => {
    const val  = btn.dataset.value;
    const unit = btn.dataset.unit;
    tempInput.value = val;
    fromUnit.value  = unit;
    convert();
    tempInput.focus();
    showToast(`📌 Preset loaded: ${val}°${unit === 'celsius' ? 'C' : unit === 'fahrenheit' ? 'F' : 'K'}`);
  });
});

// ─── Floating Particles Generator ─────────────────────

(function generateParticles() {
  const container = document.getElementById('particles');
  const COUNT = 18;
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 6 + 3;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 14 + 10}s;
      animation-delay: ${Math.random() * -20}s;
      opacity: ${Math.random() * 0.4 + 0.05};
    `;
    container.appendChild(p);
  }
})();

// ─── Initial Focus ─────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  tempInput.focus();
});
