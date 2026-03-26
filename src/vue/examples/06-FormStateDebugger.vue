<template>
  <ExampleLayout
    title="06 · Form State Debugger"
    description="Every $property exposed in real time. CSS classes are computed from field state. Buttons demonstrate programmatic API methods."
  >
    <div class="debugger-layout">
      <!-- Left: form input -->
      <div class="form-panel">
        <form name="debugger" v-submit="() => {}">
          <div class="field-group">
            <label for="dbgField">Test Field</label>
            <input
              id="dbgField"
              ref="inputRef"
              name="field"
              type="text"
              v-model="formData.field"
              v-required
              v-minlength="3"
              v-maxlength="20"
              v-pattern="/^[a-z]+$/"
              placeholder="lowercase letters, 3–20 chars"
            />
          </div>
          <div class="error-list">
            <div v-messages="form.field?.$error ?? {}">
              <span class="error-msg" v-message="'required'">Required.</span>
              <span class="error-msg" v-message="'minlength'">Min 3 chars.</span>
              <span class="error-msg" v-message="'maxlength'">Max 20 chars.</span>
              <span class="error-msg" v-message="'pattern'">Lowercase only.</span>
            </div>
          </div>
        </form>

        <!-- Action buttons -->
        <div class="actions">
          <div class="actions-title">Programmatic API</div>
          <div class="btn-grid">
            <button class="action-btn" @click="form.touch('field')">
              <span class="btn-name">touch('field')</span>
              <span class="btn-desc">sets $touched</span>
            </button>
            <button class="action-btn" @click="form.$setPristine()">
              <span class="btn-name">$setPristine()</span>
              <span class="btn-desc">clears dirty/touched</span>
            </button>
            <button class="action-btn" @click="form.$setDirty()">
              <span class="btn-name">$setDirty()</span>
              <span class="btn-desc">marks all dirty</span>
            </button>
            <button class="action-btn" @click="form.$setUntouched()">
              <span class="btn-name">$setUntouched()</span>
              <span class="btn-desc">clears touched</span>
            </button>
            <button class="action-btn" @click="form.touchAll()">
              <span class="btn-name">touchAll()</span>
              <span class="btn-desc">touches all fields</span>
            </button>
            <button class="action-btn" @click="form.$validate()">
              <span class="btn-name">$validate()</span>
              <span class="btn-desc">runs validation</span>
            </button>
            <button class="action-btn action-btn--reset" @click="form.$reset(); formData.field = ''">
              <span class="btn-name">$reset()</span>
              <span class="btn-desc">full reset</span>
            </button>
          </div>
        </div>

        <!-- CSS classes live display -->
        <div class="css-classes-panel">
          <div class="panel-title">Active CSS classes on input</div>
          <div class="class-chips">
            <span
              v-for="cls in cssClassList"
              :key="cls"
              :class="['class-chip', activeCssClasses.includes(cls) ? 'class-chip--active' : 'class-chip--inactive']"
            >{{ cls }}</span>
          </div>
        </div>
      </div>

      <!-- Right: state table -->
      <div class="state-panel">
        <div class="state-section">
          <div class="state-section-title">Form-level state</div>
          <table class="state-table">
            <tr v-for="row in formLevelRows" :key="row.key">
              <td class="state-key">{{ row.key }}</td>
              <td :class="['state-val', row.bool ? (row.value ? 'val-true' : 'val-false') : 'val-other']">
                {{ row.display }}
              </td>
            </tr>
          </table>
        </div>

        <div class="state-section">
          <div class="state-section-title">Field-level state (field)</div>
          <table class="state-table">
            <tr v-for="row in fieldLevelRows" :key="row.key">
              <td class="state-key">{{ row.key }}</td>
              <td :class="['state-val', row.bool ? (row.value ? 'val-true' : 'val-false') : 'val-other']">
                {{ row.display }}
              </td>
            </tr>
          </table>
        </div>

        <div class="state-section">
          <div class="state-section-title">form.field.$error</div>
          <pre class="json-display">{{ JSON.stringify(form.field?.$error ?? {}, null, 2) }}</pre>
        </div>

        <div class="state-section">
          <div class="state-section-title">form.$error</div>
          <pre class="json-display">{{ JSON.stringify($error, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import ExampleLayout from './ExampleLayout.vue'
import { useForm } from '@/vue/useForm'

const formData = reactive({ field: '' })
const form = useForm('debugger', formData)

const $valid = form.$valid
const $invalid = form.$invalid
const $pristine = form.$pristine
const $dirty = form.$dirty
const $submitted = form.$submitted
const $pending = form.$pending
const $error = form.$error

const inputRef = ref<HTMLInputElement | null>(null)

const cssClassList = [
  'v-valid', 'v-invalid', 'v-pristine', 'v-dirty',
  'v-touched', 'v-untouched', 'v-pending',
  'v-valid-required', 'v-invalid-required',
  'v-valid-minlength', 'v-invalid-minlength',
  'v-valid-maxlength', 'v-invalid-maxlength',
  'v-valid-pattern', 'v-invalid-pattern',
]

const activeCssClasses = computed(() => {
  const field = form.field
  if (!field) return []
  const active: string[] = []
  if (field.$valid) active.push('v-valid')
  if (field.$invalid) active.push('v-invalid')
  if (field.$pristine) active.push('v-pristine')
  if (field.$dirty) active.push('v-dirty')
  if (field.$touched) active.push('v-touched')
  if (field.$untouched) active.push('v-untouched')
  if (field.$pending) active.push('v-pending')
  for (const [key, failing] of Object.entries(field.$error)) {
    if (failing) active.push(`v-invalid-${key}`)
    else active.push(`v-valid-${key}`)
  }
  return active
})

const formLevelRows = computed(() => [
  { key: 'form.$valid', bool: true, value: $valid.value, display: String($valid.value) },
  { key: 'form.$invalid', bool: true, value: $invalid.value, display: String($invalid.value) },
  { key: 'form.$pristine', bool: true, value: $pristine.value, display: String($pristine.value) },
  { key: 'form.$dirty', bool: true, value: $dirty.value, display: String($dirty.value) },
  { key: 'form.$submitted', bool: true, value: $submitted.value, display: String($submitted.value) },
  { key: 'form.$pending', bool: true, value: $pending.value, display: String($pending.value) },
])

const fieldLevelRows = computed(() => {
  const f = form.field
  if (!f) return []
  return [
    { key: 'field.$valid', bool: true, value: f.$valid, display: String(f.$valid) },
    { key: 'field.$invalid', bool: true, value: f.$invalid, display: String(f.$invalid) },
    { key: 'field.$pristine', bool: true, value: f.$pristine, display: String(f.$pristine) },
    { key: 'field.$dirty', bool: true, value: f.$dirty, display: String(f.$dirty) },
    { key: 'field.$touched', bool: true, value: f.$touched, display: String(f.$touched) },
    { key: 'field.$untouched', bool: true, value: f.$untouched, display: String(f.$untouched) },
    { key: 'field.$pending', bool: true, value: f.$pending, display: String(f.$pending) },
    { key: 'field.$name', bool: false, value: false, display: `"${f.$name}"` },
  ]
})
</script>

<style scoped>
.debugger-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 640px) {
  .debugger-layout { grid-template-columns: 1fr; }
}

.form-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  margin-bottom: 8px;
}

.field-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

input[type="text"] {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background: #fff;
  color: #1a202c;
  outline: none;
  transition: border-color 0.2s;
}

input:focus {
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.error-list {
  min-height: 20px;
}

.error-msg {
  display: block;
  font-size: 12px;
  color: #e74c3c;
  margin-top: 2px;
}

.actions {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
}

.actions-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  margin-bottom: 10px;
}

.btn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 10px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
}

.action-btn:hover {
  border-color: #646cff;
  background: #f5f5ff;
}

.action-btn--reset {
  border-color: #fecaca;
}

.action-btn--reset:hover {
  border-color: #dc2626;
  background: #fef2f2;
}

.btn-name {
  font-size: 11px;
  font-family: monospace;
  font-weight: 700;
  color: #1e3a5f;
}

.btn-desc {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 2px;
}

.css-classes-panel {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
}

.panel-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  margin-bottom: 10px;
}

.class-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.class-chip {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-family: monospace;
  font-weight: 600;
  transition: all 0.15s;
}

.class-chip--active {
  background: #dcfce7;
  color: #16a34a;
  border: 1px solid #86efac;
}

.class-chip--inactive {
  background: #f1f5f9;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}

/* State panel */
.state-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.state-section {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.state-section-title {
  padding: 8px 12px;
  background: #1e2637;
  color: #a8b4c4;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  font-family: monospace;
}

.state-table {
  width: 100%;
  border-collapse: collapse;
}

.state-table tr:not(:last-child) {
  border-bottom: 1px solid #e2e8f0;
}

.state-key {
  padding: 6px 12px;
  font-size: 12px;
  font-family: monospace;
  color: #374151;
  width: 55%;
}

.state-val {
  padding: 6px 12px;
  font-size: 12px;
  font-family: monospace;
  font-weight: 700;
}

.val-true { color: #16a34a; }
.val-false { color: #dc2626; }
.val-other { color: #6b7280; }

.json-display {
  margin: 0;
  padding: 10px 12px;
  font-size: 11px;
  font-family: monospace;
  color: #374151;
  background: transparent;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
