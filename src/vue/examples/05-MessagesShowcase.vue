<template>
  <ExampleLayout
    title="05 · Messages Showcase"
    description="Compares v-messages (first error only) vs v-messages.multiple (all errors at once), and demonstrates dynamic v-message keys."
  >
    <form name="messages" v-submit="() => {}">

      <!-- Side-by-side comparison -->
      <div class="compare-row">

        <!-- Field 1: v-messages (first error only) -->
        <div class="compare-card">
          <div class="compare-card-header compare-card-header--gray">
            <h3>v-messages</h3>
            <p>Shows <strong>first failing</strong> rule only</p>
          </div>
          <div class="compare-card-body">
            <div class="field-group">
              <label for="field1">Field 1</label>
              <input
                id="field1"
                name="field1"
                type="text"
                v-model="formData.field1"
                v-required
                v-minlength="5"
                v-maxlength="10"
                v-pattern="/^[a-z]+$/"
                placeholder="type here…"
              />
            </div>

            <div class="mode-label">Active errors (raw <code>$error</code>):</div>
            <div class="error-raw">
              <span
                v-for="(val, key) in form.field1?.$error ?? {}"
                :key="key"
                :class="['err-chip', val ? 'err-chip--active' : 'err-chip--ok']"
              >{{ key }}</span>
              <span v-if="!Object.keys(form.field1?.$error ?? {}).length" class="err-none">none</span>
            </div>

            <div class="mode-label mode-label--error">v-messages (first only):</div>
            <div
              class="messages-box"
              v-show="form.field1?.$dirty"
              v-messages="form.field1?.$error ?? {}"
            >
              <span class="error-msg" v-message="'required'">Field is required.</span>
              <span class="error-msg" v-message="'minlength'">Too short (min 5).</span>
              <span class="error-msg" v-message="'maxlength'">Too long (max 10).</span>
              <span class="error-msg" v-message="'pattern'">Lowercase letters only.</span>
            </div>
          </div>
        </div>

        <!-- Field 2: v-messages.multiple (all errors) -->
        <div class="compare-card">
          <div class="compare-card-header compare-card-header--indigo">
            <h3>v-messages.multiple</h3>
            <p>Shows <strong>all failing</strong> rules at once</p>
          </div>
          <div class="compare-card-body">
            <div class="field-group">
              <label for="field2">Field 2 (same rules)</label>
              <input
                id="field2"
                name="field2"
                type="text"
                v-model="formData.field2"
                v-required
                v-minlength="5"
                v-maxlength="10"
                v-pattern="/^[a-z]+$/"
                placeholder="type here…"
              />
            </div>

            <div class="mode-label">Active errors (raw <code>$error</code>):</div>
            <div class="error-raw">
              <span
                v-for="(val, key) in form.field2?.$error ?? {}"
                :key="key"
                :class="['err-chip', val ? 'err-chip--active' : 'err-chip--ok']"
              >{{ key }}</span>
              <span v-if="!Object.keys(form.field2?.$error ?? {}).length" class="err-none">none</span>
            </div>

            <div class="mode-label mode-label--error">v-messages.multiple (all):</div>
            <div
              class="messages-box"
              v-show="form.field2?.$dirty"
              v-messages.multiple="form.field2?.$error ?? {}"
            >
              <span class="error-msg" v-message="'required'">Field is required.</span>
              <span class="error-msg" v-message="'minlength'">Too short (min 5).</span>
              <span class="error-msg" v-message="'maxlength'">Too long (max 10).</span>
              <span class="error-msg" v-message="'pattern'">Lowercase letters only.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Field 3: dynamic v-message key -->
      <div class="dynamic-section">
        <h3 class="section-title">Dynamic v-message key</h3>
        <p class="section-desc">
          The key passed to <code>v-message</code> can be a reactive ref — switch the selector to show a different rule's message.
        </p>

        <div class="dynamic-controls">
          <label>Active message key:</label>
          <div class="key-buttons">
            <button
              v-for="key in ['required', 'minlength', 'pattern']"
              :key="key"
              type="button"
              :class="['key-btn', dynamicKey === key ? 'key-btn--active' : '']"
              @click="dynamicKey = key"
            >{{ key }}</button>
          </div>
        </div>

        <div class="dynamic-demo">
          <div class="field-group">
            <label for="field3">Field 3</label>
            <input
              id="field3"
              name="field3"
              type="text"
              v-model="formData.field3"
              v-required
              v-minlength="4"
              v-pattern="/^[A-Z]/"
              placeholder="Must start with uppercase"
            />
          </div>

          <div class="dynamic-label">
            Showing only the message for key <code>{{ dynamicKey }}</code>:
          </div>
          <div
            class="messages-box"
            v-show="form.field3?.$dirty"
            v-messages="form.field3?.$error ?? {}"
          >
            <span class="error-msg" :v-message="dynamicKey">
              <template v-if="dynamicKey === 'required'">Field is required.</template>
              <template v-else-if="dynamicKey === 'minlength'">Must be at least 4 characters.</template>
              <template v-else-if="dynamicKey === 'pattern'">Must start with an uppercase letter.</template>
            </span>
          </div>
          <div class="hint">
            Note: <code>v-message</code> with a dynamic binding hides/shows the single span based on whether that rule key is failing. Switch the key above to see the correct message.
          </div>
        </div>
      </div>
    </form>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import ExampleLayout from './ExampleLayout.vue'
import { useForm } from '@/vue/useForm'

const formData = reactive({ field1: '', field2: '', field3: '' })
const form = useForm('messages', formData)

const dynamicKey = ref<string>('required')
</script>

<style scoped>
.compare-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

@media (max-width: 580px) {
  .compare-row { grid-template-columns: 1fr; }
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

.compare-card-header--gray { background: #475569; }
.compare-card-header--indigo { background: #4338ca; }

.compare-card-body {
  padding: 16px;
}

.field-group {
  margin-bottom: 12px;
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

input:focus {
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.mode-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  margin-bottom: 6px;
  margin-top: 12px;
}

.mode-label--error {
  color: #dc2626;
}

.error-raw {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 22px;
}

.err-chip {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
}

.err-chip--active {
  background: #fee2e2;
  color: #dc2626;
}

.err-chip--ok {
  background: #dcfce7;
  color: #16a34a;
}

.err-none {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}

.messages-box {
  min-height: 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 8px 10px;
}

.error-msg {
  display: block;
  font-size: 12px;
  color: #dc2626;
  line-height: 1.5;
}

.dynamic-section {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px;
}

.section-desc {
  font-size: 13px;
  color: #475569;
  margin: 0 0 16px;
  line-height: 1.5;
}

.dynamic-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.dynamic-controls label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.key-buttons {
  display: flex;
  gap: 8px;
}

.key-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-family: monospace;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid #d1d5db;
  background: #fff;
  color: #374151;
  transition: all 0.15s;
}

.key-btn:hover {
  border-color: #646cff;
  color: #646cff;
}

.key-btn--active {
  background: #646cff;
  color: #fff;
  border-color: #646cff;
}

.dynamic-demo {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.dynamic-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
  margin-top: 12px;
}

.hint {
  margin-top: 8px;
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.5;
}
</style>
