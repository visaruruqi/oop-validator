<template>
  <ExampleLayout
    title="02 · Registration Form"
    description="Demonstrates async validation (email uniqueness check), cross-field matching (confirm password), v-messages.multiple to show all errors at once, and $pending spinner."
  >
    <div v-if="registered" class="success-banner">
      Account created! Welcome, {{ formData.username }}.
      <button class="btn btn-sm" @click="registered = false; $reset()">Register another</button>
    </div>

    <form v-else name="registration" v-submit="handleSubmit">
      <!-- Username -->
      <div class="field-group">
        <label for="username">Username <span class="required">*</span></label>
        <input
          id="username"
          name="username"
          type="text"
          v-model="formData.username"
          v-required="true"
          v-minlength="3"
          v-maxlength="20"
          v-pattern="/^[a-zA-Z0-9_]+$/"
          placeholder="john_doe"
          autocomplete="off"
        />
        <div
          class="error-list"
          v-show="form.username?.$touched || $submitted"
          v-messages="form.username?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">Username is required.</span>
          <span class="error-msg" v-message="'minlength'">Must be at least 3 characters.</span>
          <span class="error-msg" v-message="'maxlength'">Cannot exceed 20 characters.</span>
          <span class="error-msg" v-message="'pattern'">Letters, numbers, and underscores only.</span>
        </div>
      </div>

      <!-- Email with async check -->
      <div class="field-group">
        <label for="reg-email">
          Email <span class="required">*</span>
          <span v-if="form.email?.$pending" class="pending-badge">checking…</span>
          <span v-else-if="form.email?.$valid && form.email?.$dirty" class="valid-badge">✓ available</span>
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          v-model="formData.email"
          v-required
          v-type
          placeholder="john@example.com"
          autocomplete="off"
        />
        <div class="hint">Try <code>taken@example.com</code> to trigger the async error.</div>
        <div
          class="error-list"
          v-show="form.email?.$touched || $submitted"
          v-messages="form.email?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">Email is required.</span>
          <span class="error-msg" v-message="'type'">Enter a valid email address.</span>
          <span class="error-msg" v-message="'uniqueEmail'">This email is already taken.</span>
        </div>
      </div>

      <!-- Password with v-messages.multiple -->
      <div class="field-group">
        <label for="password">
          Password <span class="required">*</span>
          <span class="hint-inline">— all errors shown at once (v-messages.multiple)</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          v-model="formData.password"
          v-required
          v-minlength="8"
          v-pattern="/(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])/"
          autocomplete="new-password"
        />
        <div
          class="error-list"
          v-show="form.password?.$touched || $submitted"
          v-messages.multiple="form.password?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">Password is required.</span>
          <span class="error-msg" v-message="'minlength'">Must be at least 8 characters.</span>
          <span class="error-msg" v-message="'pattern'">Must contain uppercase, lowercase, and a digit.</span>
        </div>
      </div>

      <!-- Confirm Password -->
      <div class="field-group">
        <label for="confirmPassword">Confirm Password <span class="required">*</span></label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          v-model="formData.confirmPassword"
          v-required
          autocomplete="new-password"
        />
        <div
          class="error-list"
          v-show="form.confirmPassword?.$touched || $submitted"
          v-messages="form.confirmPassword?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">Please confirm your password.</span>
          <span class="error-msg" v-message="'match'">Passwords do not match.</span>
        </div>
      </div>

      <!-- Age -->
      <div class="field-group">
        <label for="age">Age <span class="required">*</span></label>
        <input
          id="age"
          name="age"
          type="number"
          v-model="formData.age"
          v-required
          v-min="13"
          v-max="120"
          placeholder="18"
          style="max-width: 120px;"
        />
        <div
          class="error-list"
          v-show="form.age?.$touched || $submitted"
          v-messages="form.age?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">Age is required.</span>
          <span class="error-msg" v-message="'min'">Must be at least 13.</span>
          <span class="error-msg" v-message="'max'">Must be 120 or under.</span>
        </div>
      </div>

      <!-- Terms -->
      <div class="field-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            name="terms"
            v-model="formData.terms"
            v-required
          />
          I agree to the Terms of Service <span class="required">*</span>
        </label>
        <div
          class="error-list"
          v-show="form.terms?.$touched || $submitted"
          v-messages="form.terms?.$error ?? {}"
        >
          <span class="error-msg" v-message="'required'">You must agree to the terms.</span>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="$pending">
          <span v-if="$pending">Validating…</span>
          <span v-else>Create Account</span>
        </button>
        <button type="button" class="btn btn-secondary" @click="$reset()">Reset</button>
      </div>

      <div v-if="$submitted && $invalid" class="form-error-summary">
        Please fix the errors above before submitting.
      </div>
    </form>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import ExampleLayout from './ExampleLayout.vue'
import { useForm } from '@/vue/useForm'
import { MatchFieldValidationRule } from '@/index'

const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: '',
  terms: false,
})

const form = useForm('registration', formData, {
  asyncValidators: {
    email: {
      uniqueEmail: async (value: string) => {
        await new Promise(r => setTimeout(r, 800))
        return value !== 'taken@example.com'
      }
    }
  },
  debounce: 500,
})

const $submitted = form.$submitted
const $invalid = form.$invalid
const $pending = form.$pending
const $reset = () => form.$reset()

const registered = ref(false)

onMounted(() => {
  form.registerRule('confirmPassword', 'match', new MatchFieldValidationRule('password'))
})

function handleSubmit() {
  registered.value = true
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
input[type="password"],
input[type="number"] {
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

input:focus {
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  font-weight: normal !important;
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

.hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.hint code {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 11px;
  color: #475569;
}

.hint-inline {
  font-weight: normal;
  font-size: 11px;
  color: #9ca3af;
}

.pending-badge {
  font-size: 11px;
  font-weight: normal;
  color: #3b82f6;
  margin-left: 6px;
  animation: pulse 1s infinite;
}

.valid-badge {
  font-size: 11px;
  font-weight: normal;
  color: #16a34a;
  margin-left: 6px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
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
  opacity: 0.6;
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
