<template>
  <ExampleLayout
    title="01 · Contact Form"
    description="Basic form demonstrating v-required, v-minlength, v-maxlength, v-pattern, v-type on text, email, select, textarea, radio, and checkbox inputs."
  >
    <div v-if="submitted" class="success-banner">
      Message sent! Thanks for reaching out.
      <button class="btn btn-sm" @click="submitted = false; $reset()">Send another</button>
    </div>

    <form v-else name="contact" v-submit="handleSubmit">
      <!-- Full Name -->
      <div class="field-group">
        <label for="fullName">Full Name <span class="required">*</span></label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          v-model="formData.fullName"
          v-required
          v-minlength="2"
          v-maxlength="100"
          v-pattern="/^[a-zA-Z\s]+$/"
          placeholder="Jane Smith"
        />
        <div
          class="error-list"
          v-show="form.fullName?.$touched || $submitted"
          v-messages="form.fullName?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">Full name is required.</span>
          <span class="error-msg" v-message="'minlength'">Must be at least 2 characters.</span>
          <span class="error-msg" v-message="'maxlength'">Cannot exceed 100 characters.</span>
          <span class="error-msg" v-message="'pattern'">Letters and spaces only.</span>
        </div>
      </div>

      <!-- Email -->
      <div class="field-group">
        <label for="email">Email <span class="required">*</span></label>
        <input
          id="email"
          name="email"
          type="email"
          v-model="formData.email"
          v-required
          v-type
          placeholder="jane@example.com"
        />
        <div
          class="error-list"
          v-show="form.email?.$touched || $submitted"
          v-messages="form.email?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">Email is required.</span>
          <span class="error-msg" v-message="'type'">Enter a valid email address.</span>
        </div>
      </div>

      <!-- Phone (optional) -->
      <div class="field-group">
        <label for="phone">Phone <span class="optional">(optional)</span></label>
        <input
          id="phone"
          name="phone"
          type="tel"
          v-model="formData.phone"
          v-pattern="/^\+?[0-9\s\-]{7,15}$/"
          placeholder="+1 555 123 4567"
        />
        <div
          class="error-list"
          v-show="form.phone?.$touched || $submitted"
          v-messages="form.phone?.$error ?? {}"
        >
          <span class="error-msg" v-message="'pattern'">7–15 digits, spaces or dashes.</span>
        </div>
      </div>

      <!-- Subject -->
      <div class="field-group">
        <label for="subject">Subject <span class="required">*</span></label>
        <select
          id="subject"
          name="subject"
          v-model="formData.subject"
          v-required="true"
        >
          <option value="">— Select a subject —</option>
          <option value="general">General Inquiry</option>
          <option value="support">Technical Support</option>
          <option value="billing">Billing</option>
          <option value="other">Other</option>
        </select>
        <div
          class="error-list"
          v-show="form.subject?.$touched || $submitted"
          v-messages="form.subject?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">Please select a subject.</span>
        </div>
      </div>

      <!-- Message -->
      <div class="field-group">
        <label for="message">
          Message <span class="required">*</span>
          <span class="char-count">{{ formData.message.length }} / 2000</span>
        </label>
        <textarea
          id="message"
          name="message"
          v-model="formData.message"
          v-required
          v-minlength="10"
          v-maxlength="2000"
          rows="5"
          placeholder="Describe your question or issue in detail…"
        ></textarea>
        <div
          class="error-list"
          v-show="form.message?.$touched || $submitted"
          v-messages="form.message?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">Message is required.</span>
          <span class="error-msg" v-message="'minlength'">Must be at least 10 characters.</span>
          <span class="error-msg" v-message="'maxlength'">Cannot exceed 2000 characters.</span>
        </div>
      </div>

      <!-- Priority (radio) -->
      <div class="field-group">
        <label>Priority <span class="required">*</span></label>
        <div class="radio-group">
          <label v-for="opt in ['Low', 'Medium', 'High']" :key="opt" class="radio-label">
            <input
              type="radio"
              name="priority"
              :value="opt"
              v-model="formData.priority"
              v-required
            />
            {{ opt }}
          </label>
        </div>
        <div
          class="error-list"
          v-show="form.priority?.$touched || $submitted"
          v-messages="form.priority?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">Please select a priority.</span>
        </div>
      </div>

      <!-- Subscribe (optional checkbox) -->
      <div class="field-group field-group--inline">
        <label class="checkbox-label">
          <input
            type="checkbox"
            name="subscribe"
            v-model="formData.subscribe"
          />
          Subscribe to updates
        </label>
      </div>

      <!-- Terms (required checkbox) -->
      <div class="field-group field-group--inline">
        <label class="checkbox-label">
          <input
            type="checkbox"
            name="terms"
            v-model="formData.terms"
            v-required
          />
          I accept the terms and conditions <span class="required">*</span>
        </label>
        <div
          class="error-list"
          v-show="form.terms?.$touched || $submitted"
          v-messages="form.terms?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">You must accept the terms.</span>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="$submitted && $invalid">
          Send Message
        </button>
        <button type="button" class="btn btn-secondary" @click="$reset()">
          Reset
        </button>
      </div>

      <div v-if="$submitted && $invalid" class="form-error-summary">
        Please fix the errors above before submitting.
      </div>
    </form>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import ExampleLayout from './ExampleLayout.vue'
import { useForm } from '@/vue/useForm'

const formData = reactive({
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  priority: '',
  subscribe: false,
  terms: false,
})

const form = useForm('contact', formData)
const $submitted = form.$submitted
const $invalid = form.$invalid
const $reset = () => form.$reset()

const submitted = ref(false)

function handleSubmit() {
  submitted.value = true
}
</script>

<style scoped>
.field-group {
  margin-bottom: 20px;
}

.field-group label:first-child {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

input[type="text"],
input[type="email"],
input[type="tel"],
select,
textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background: #fff;
  color: #1a202c;
  transition: border-color 0.2s;
  outline: none;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

textarea {
  resize: vertical;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  font-weight: normal;
}

.field-group--inline {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
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

.required {
  color: #e74c3c;
}

.optional {
  color: #9ca3af;
  font-weight: normal;
  font-size: 12px;
}

.char-count {
  float: right;
  font-size: 11px;
  color: #9ca3af;
  font-weight: normal;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}

.btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, background 0.15s;
}

.btn-primary {
  background: #646cff;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #535bf2;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e2e8f0;
  color: #374151;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
  background: #fff;
  color: #1a202c;
  border: 1px solid #d1d5db;
  margin-left: 12px;
}

.form-error-summary {
  margin-top: 12px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 13px;
  color: #dc2626;
}

.success-banner {
  padding: 20px 24px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  font-size: 15px;
  color: #166534;
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
