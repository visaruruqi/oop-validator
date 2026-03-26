<template>
  <ExampleLayout
    title="04 · Numeric Validation"
    description="Side-by-side comparison: v-min / v-max validate the numeric VALUE; v-minlength / v-maxlength validate the string LENGTH. Both the value and string length are displayed for each field."
  >
    <div class="compare-grid">
      <!-- Left: v-min / v-max -->
      <div class="compare-card">
        <div class="compare-card-header compare-card-header--blue">
          <h3>v-min &amp; v-max</h3>
          <p>Validates the <strong>numeric value</strong></p>
        </div>

        <form name="numeric" v-submit="() => {}">
          <!-- Age: v-min="0" v-max="150" -->
          <div class="field-group">
            <label>
              Age
              <span class="rule-tag">v-min="0" v-max="150"</span>
            </label>
            <input
              name="age"
              type="number"
              v-model="numData.age"
              v-min="0"
              v-max="150"
              placeholder="25"
            />
            <div class="value-display">
              <span class="vd-item">value: <code>{{ numData.age || '—' }}</code></span>
              <span class="vd-item">length: <code>{{ String(numData.age || '').length }}</code></span>
            </div>
            <div
              class="error-list"
              v-show="numForm.age?.$touched"
              v-messages="numForm.age?.$error ?? {}"
            >
              <span class="error-msg" v-message="'min'">Must be ≥ 0 (value check).</span>
              <span class="error-msg" v-message="'max'">Must be ≤ 150 (value check).</span>
            </div>
          </div>

          <!-- Score: v-min="0" v-max="100" -->
          <div class="field-group">
            <label>
              Score
              <span class="rule-tag">v-min="0" v-max="100"</span>
            </label>
            <input
              name="score"
              type="number"
              v-model="numData.score"
              v-min="0"
              v-max="100"
              placeholder="95"
            />
            <div class="value-display">
              <span class="vd-item">value: <code>{{ numData.score || '—' }}</code></span>
              <span class="vd-item">length: <code>{{ String(numData.score || '').length }}</code></span>
            </div>
            <div
              class="error-list"
              v-show="numForm.score?.$touched"
              v-messages="numForm.score?.$error ?? {}"
            >
              <span class="error-msg" v-message="'min'">Must be ≥ 0.</span>
              <span class="error-msg" v-message="'max'">Must be ≤ 100.</span>
            </div>
          </div>
        </form>

        <div class="explanation">
          <strong>How it works:</strong> v-min/v-max cast the input to a number and compare the numeric value. Enter <code>-5</code> or <code>200</code> to trigger errors, regardless of string length.
        </div>
      </div>

      <!-- Right: v-minlength / v-maxlength -->
      <div class="compare-card">
        <div class="compare-card-header compare-card-header--purple">
          <h3>v-minlength &amp; v-maxlength</h3>
          <p>Validates the <strong>string length</strong></p>
        </div>

        <form name="lengths" v-submit="() => {}">
          <!-- Username: v-minlength="3" v-maxlength="20" -->
          <div class="field-group">
            <label>
              Username
              <span class="rule-tag">v-minlength="3" v-maxlength="20"</span>
            </label>
            <input
              name="username"
              type="text"
              v-model="lenData.username"
              v-minlength="3"
              v-maxlength="20"
              placeholder="john_doe"
            />
            <div class="value-display">
              <span class="vd-item">value: <code>{{ lenData.username || '—' }}</code></span>
              <span class="vd-item">length: <code>{{ lenData.username.length }}</code></span>
            </div>
            <div
              class="error-list"
              v-show="lenForm.username?.$touched"
              v-messages="lenForm.username?.$error ?? {}"
            >
              <span class="error-msg" v-message="'minlength'">Must be ≥ 3 characters long.</span>
              <span class="error-msg" v-message="'maxlength'">Must be ≤ 20 characters long.</span>
            </div>
          </div>

          <!-- Bio: v-maxlength="500" -->
          <div class="field-group">
            <label>
              Bio
              <span class="rule-tag">v-maxlength="500"</span>
              <span class="char-count">{{ lenData.bio.length }} / 500</span>
            </label>
            <textarea
              name="bio"
              v-model="lenData.bio"
              v-maxlength="500"
              rows="4"
              placeholder="Tell us about yourself…"
            ></textarea>
            <div class="value-display">
              <span class="vd-item">length: <code>{{ lenData.bio.length }}</code></span>
            </div>
            <div
              class="error-list"
              v-show="lenForm.bio?.$touched"
              v-messages="lenForm.bio?.$error ?? {}"
            >
              <span class="error-msg" v-message="'maxlength'">Cannot exceed 500 characters.</span>
            </div>
          </div>
        </form>

        <div class="explanation">
          <strong>How it works:</strong> v-minlength/v-maxlength check <code>String(value).length</code>. The string <code>"99"</code> has length 2, so it passes v-minlength="2" even though the number 99 is large.
        </div>
      </div>
    </div>

    <!-- Summary table -->
    <div class="summary-table">
      <h3 class="summary-title">Quick Reference</h3>
      <table>
        <thead>
          <tr>
            <th>Directive</th>
            <th>Checks</th>
            <th>Use case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>v-min="n"</code></td>
            <td>Number value ≥ n</td>
            <td>Age, score, quantity, price</td>
          </tr>
          <tr>
            <td><code>v-max="n"</code></td>
            <td>Number value ≤ n</td>
            <td>Age, score, quantity, price</td>
          </tr>
          <tr>
            <td><code>v-minlength="n"</code></td>
            <td>String length ≥ n</td>
            <td>Username, password, description</td>
          </tr>
          <tr>
            <td><code>v-maxlength="n"</code></td>
            <td>String length ≤ n</td>
            <td>Textarea, bio, title fields</td>
          </tr>
        </tbody>
      </table>
    </div>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import ExampleLayout from './ExampleLayout.vue'
import { useForm } from '@/vue/useForm'

const numData = reactive({ age: '', score: '' })
const numForm = useForm('numeric', numData)

const lenData = reactive({ username: '', bio: '' })
const lenForm = useForm('lengths', lenData)
</script>

<style scoped>
.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

@media (max-width: 600px) {
  .compare-grid { grid-template-columns: 1fr; }
}

.compare-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.compare-card-header {
  padding: 14px 16px;
  color: #fff;
}

.compare-card-header h3 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 700;
}

.compare-card-header p {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

.compare-card-header--blue { background: #2563eb; }
.compare-card-header--purple { background: #7c3aed; }

.compare-card form {
  padding: 16px;
}

.explanation {
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}

.field-group {
  margin-bottom: 16px;
}

.field-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

input[type="number"],
input[type="text"],
textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background: #fff;
  color: #1a202c;
  outline: none;
  transition: border-color 0.2s;
}

input:focus, textarea:focus {
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

textarea { resize: vertical; }

.value-display {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.vd-item {
  font-size: 11px;
  color: #6b7280;
}

.vd-item code {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 11px;
  color: #1a202c;
}

.error-list {
  margin-top: 4px;
}

.error-msg {
  display: block;
  font-size: 12px;
  color: #e74c3c;
  margin-top: 2px;
}

.rule-tag {
  background: #f1f5f9;
  color: #475569;
  font-size: 10px;
  font-family: monospace;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: normal;
  margin-left: 4px;
}

.char-count {
  float: right;
  font-size: 11px;
  color: #9ca3af;
  font-weight: normal;
}

.summary-table {
  margin-top: 8px;
}

.summary-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  text-align: left;
  padding: 10px 14px;
  background: #f8fafc;
  color: #374151;
  font-weight: 700;
  border-bottom: 2px solid #e2e8f0;
}

td {
  padding: 10px 14px;
  border-bottom: 1px solid #e2e8f0;
  color: #374151;
}

td code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #1e3a5f;
}

tr:last-child td {
  border-bottom: none;
}
</style>
