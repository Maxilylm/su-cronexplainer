import { useState, useCallback } from 'react'
import './App.css'
import { parseCron, getNextRuns, PRESETS } from './cron'

function App() {
  const [expression, setExpression] = useState('* * * * *')
  const [copied, setCopied] = useState(false)

  const parsed = parseCron(expression)
  const nextRuns = parsed.valid ? getNextRuns(expression, 5) : []

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(expression)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [expression])

  const fields = expression.split(/\s+/)
  const minute = fields[0] || '*'
  const hour = fields[1] || '*'
  const dom = fields[2] || '*'
  const month = fields[3] || '*'
  const dow = fields[4] || '*'

  const updateField = (index: number, value: string) => {
    const parts = expression.split(/\s+/)
    while (parts.length < 5) parts.push('*')
    parts[index] = value
    setExpression(parts.join(' '))
  }

  return (
    <div className="app">
      <h1>Cron Explainer</h1>
      <p className="subtitle">Paste a cron expression or build one visually</p>

      <div className="input-row">
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="* * * * *"
          className="cron-input"
          spellCheck={false}
        />
        <button onClick={handleCopy} className="copy-btn">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="field-labels">
        <span>minute</span>
        <span>hour</span>
        <span>day (month)</span>
        <span>month</span>
        <span>day (week)</span>
      </div>

      <div className="explanation">
        {parsed.valid ? (
          <p className="explain-text">{parsed.description}</p>
        ) : (
          <p className="explain-error">{parsed.error}</p>
        )}
      </div>

      {nextRuns.length > 0 && (
        <div className="next-runs">
          <h2>Next 5 Runs</h2>
          <ul>
            {nextRuns.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="builder">
        <h2>Visual Builder</h2>
        <div className="builder-grid">
          <FieldSelect label="Minute" value={minute} onChange={(v) => updateField(0, v)} options={minuteOptions} />
          <FieldSelect label="Hour" value={hour} onChange={(v) => updateField(1, v)} options={hourOptions} />
          <FieldSelect label="Day of Month" value={dom} onChange={(v) => updateField(2, v)} options={domOptions} />
          <FieldSelect label="Month" value={month} onChange={(v) => updateField(3, v)} options={monthOptions} />
          <FieldSelect label="Day of Week" value={dow} onChange={(v) => updateField(4, v)} options={dowOptions} />
        </div>
      </div>

      <div className="presets">
        <h2>Common Presets</h2>
        <div className="preset-buttons">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => setExpression(p.value)} className="preset-btn">
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FieldSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[]
}) {
  return (
    <div className="field-select">
      <label>{label}</label>
      <select value={options.find(o => o.value === value) ? value : '__custom'} onChange={(e) => {
        if (e.target.value !== '__custom') onChange(e.target.value)
      }}>
        {!options.find(o => o.value === value) && <option value="__custom">{value} (custom)</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

const minuteOptions = [
  { label: 'Every minute (*)', value: '*' },
  { label: 'Every 5 minutes (*/5)', value: '*/5' },
  { label: 'Every 10 minutes (*/10)', value: '*/10' },
  { label: 'Every 15 minutes (*/15)', value: '*/15' },
  { label: 'Every 30 minutes (*/30)', value: '*/30' },
  { label: '0', value: '0' },
  { label: '15', value: '15' },
  { label: '30', value: '30' },
  { label: '45', value: '45' },
]

const hourOptions = [
  { label: 'Every hour (*)', value: '*' },
  { label: 'Every 2 hours (*/2)', value: '*/2' },
  { label: 'Every 6 hours (*/6)', value: '*/6' },
  { label: 'Every 12 hours (*/12)', value: '*/12' },
  { label: '0 (midnight)', value: '0' },
  { label: '6 (6am)', value: '6' },
  { label: '9 (9am)', value: '9' },
  { label: '12 (noon)', value: '12' },
  { label: '18 (6pm)', value: '18' },
]

const domOptions = [
  { label: 'Every day (*)', value: '*' },
  { label: '1st', value: '1' },
  { label: '15th', value: '15' },
  { label: '1st and 15th (1,15)', value: '1,15' },
]

const monthOptions = [
  { label: 'Every month (*)', value: '*' },
  { label: 'Jan (1)', value: '1' },
  { label: 'Every 3 months (*/3)', value: '*/3' },
  { label: 'Every 6 months (*/6)', value: '*/6' },
]

const dowOptions = [
  { label: 'Every day (*)', value: '*' },
  { label: 'Weekdays (1-5)', value: '1-5' },
  { label: 'Weekend (0,6)', value: '0,6' },
  { label: 'Monday (1)', value: '1' },
  { label: 'Friday (5)', value: '5' },
]

export default App
