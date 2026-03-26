<!-- 
  ============================================================================
  SAMPLE 1: Basic Registration Form
  Shows the complete developer experience after oop-validator is enhanced
  ============================================================================
-->

<!-- src/views/RegisterForm.vue -->
<script setup lang="ts">
import { reactive } from 'vue'
import { useForm } from 'oop-validator'

const user = reactive({
  name: '',
  email: '',
  age: null as number | null,
  password: '',
  confirmPassword: '',
  bio: '',
  acceptTerms: false,
})

// THE ONE LINE — everything else is automatic via directives
const form = useForm('registerForm', user)

async function register() {
  // This only runs when form.$valid is true (v-submit guarantees it)
  console.log('Submitting:', user)
  await fetch('/api/register', { method: 'POST', body: JSON.stringify(user) })

  // Reset the form after successful submit
  form.$reset()
}
</script>

<template>
  <form name="registerForm" v-submit="register" novalidate>

    <!-- ============================================================ -->
    <!-- TEXT FIELD: name + required, minlength, maxlength, pattern    -->
    <!-- ============================================================ -->
    <div class="field">
      <label for="name">Full Name</label>
      <input
        id="name"
        type="text"
        name="name"
        v-model="user.name"
        v-required="true"
        v-minlength="2"
        v-maxlength="100"
        v-pattern="/^[a-zA-Z\s]+$/"
        placeholder="John Doe"
      >
      <!--
        form.name.$error  → { required: true } or { minlength: true } etc.
        form.name.$touched → true after blur
        form.$submitted    → true after submit attempt
        
        v-messages shows FIRST matching error only (DOM order = priority)
      -->
      <div
        v-messages="form.name?.$error"
        v-show="form.name?.$touched || form.$submitted"
        class="errors"
      >
        <span v-message="'required'">Name is required.</span>
        <span v-message="'minlength'">Name must be at least 2 characters.</span>
        <span v-message="'maxlength'">Name cannot exceed 100 characters.</span>
        <span v-message="'pattern'">Name can only contain letters and spaces.</span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- EMAIL FIELD: type-based validation + async uniqueness check   -->
    <!-- ============================================================ -->
    <div class="field">
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        name="email"
        v-model="user.email"
        v-required="true"
        v-type
        placeholder="john@example.com"
      >
      <!--
        v-type reads el.type="email" and registers EmailValidationRule automatically
        The $error keys will be: required, email
      -->
      <span v-if="form.email?.$pending" class="pending">Checking availability...</span>
      <div
        v-messages="form.email?.$error"
        v-show="form.email?.$touched || form.$submitted"
        class="errors"
      >
        <span v-message="'required'">Email is required.</span>
        <span v-message="'email'">Please enter a valid email address.</span>
        <span v-message="'uniqueEmail'">This email is already registered.</span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- NUMBER FIELD: numeric min/max (NOT string length)             -->
    <!-- ============================================================ -->
    <div class="field">
      <label for="age">Age</label>
      <input
        id="age"
        type="number"
        name="age"
        v-model.number="user.age"
        v-required="true"
        v-min="18"
        v-max="120"
        placeholder="25"
      >
      <!--
        v-min="18" uses NumericMinValidationRule (checks value >= 18)
        NOT MinValidationRule (which checks string length >= 18)
      -->
      <div
        v-messages="form.age?.$error"
        v-show="form.age?.$touched || form.$submitted"
        class="errors"
      >
        <span v-message="'required'">Age is required.</span>
        <span v-message="'min'">You must be at least 18 years old.</span>
        <span v-message="'max'">Please enter a valid age.</span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- PASSWORD: v-messages.multiple shows ALL errors at once        -->
    <!-- ============================================================ -->
    <div class="field">
      <label for="password">Password</label>
      <input
        id="password"
        type="password"
        name="password"
        v-model="user.password"
        v-required="true"
        v-minlength="8"
        v-maxlength="128"
        v-pattern="/(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])/"
      >
      <!--
        .multiple modifier → all matching errors shown simultaneously
        (like ng-messages-multiple in AngularJS)
      -->
      <div
        v-messages.multiple="form.password?.$error"
        v-show="form.password?.$touched || form.$submitted"
        class="errors"
      >
        <span v-message="'required'">Password is required.</span>
        <span v-message="'minlength'">At least 8 characters.</span>
        <span v-message="'maxlength'">Maximum 128 characters.</span>
        <span v-message="'pattern'">Must contain uppercase, lowercase, and a number.</span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- CONFIRM PASSWORD: cross-field match validation                -->
    <!-- ============================================================ -->
    <div class="field">
      <label for="confirmPassword">Confirm Password</label>
      <input
        id="confirmPassword"
        type="password"
        name="confirmPassword"
        v-model="user.confirmPassword"
        v-required="true"
      >
      <!--
        Cross-field validation can be added programmatically via engine:
      -->
      <div
        v-messages="form.confirmPassword?.$error"
        v-show="form.confirmPassword?.$touched || form.$submitted"
        class="errors"
      >
        <span v-message="'required'">Please confirm your password.</span>
        <span v-message="'matchfield'">Passwords do not match.</span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TEXTAREA: just maxlength                                      -->
    <!-- ============================================================ -->
    <div class="field">
      <label for="bio">Bio</label>
      <textarea
        id="bio"
        name="bio"
        v-model="user.bio"
        v-maxlength="500"
        placeholder="Tell us about yourself..."
        rows="4"
      ></textarea>
      <div
        v-messages="form.bio?.$error"
        v-show="form.bio?.$touched || form.$submitted"
        class="errors"
      >
        <span v-message="'maxlength'">Bio cannot exceed 500 characters.</span>
      </div>
      <span class="char-count">{{ user.bio.length }} / 500</span>
    </div>

    <!-- ============================================================ -->
    <!-- CHECKBOX: required (false = invalid, true = valid)            -->
    <!-- ============================================================ -->
    <div class="field">
      <label>
        <input
          type="checkbox"
          name="acceptTerms"
          v-model="user.acceptTerms"
          v-required="true"
        >
        I accept the terms and conditions
      </label>
      <div
        v-messages="form.acceptTerms?.$error"
        v-show="form.acceptTerms?.$touched || form.$submitted"
        class="errors"
      >
        <span v-message="'required'">You must accept the terms.</span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- FORM ACTIONS                                                  -->
    <!-- ============================================================ -->
    <div class="actions">
      <button type="submit" :disabled="form.$invalid || form.$pending">
        Register
      </button>
      <button type="button" @click="form.$reset()">
        Reset
      </button>
    </div>

    <!-- ============================================================ -->
    <!-- DEBUG PANEL (remove in production)                             -->
    <!-- ============================================================ -->
    <details class="debug">
      <summary>Debug: Form State</summary>
      <pre>
form.$valid     = {{ form.$valid }}
form.$invalid   = {{ form.$invalid }}
form.$dirty     = {{ form.$dirty }}
form.$pristine  = {{ form.$pristine }}
form.$submitted = {{ form.$submitted }}
form.$pending   = {{ form.$pending }}
      </pre>
      <pre>
form.name.$error    = {{ JSON.stringify(form.name?.$error) }}
form.name.$dirty    = {{ form.name?.$dirty }}
form.name.$touched  = {{ form.name?.$touched }}
form.name.$valid    = {{ form.name?.$valid }}

form.email.$error   = {{ JSON.stringify(form.email?.$error) }}
form.email.$pending = {{ form.email?.$pending }}

form.age.$error     = {{ JSON.stringify(form.age?.$error) }}
      </pre>
      <pre>
Aggregated $error = {{ JSON.stringify(form.$error, null, 2) }}
      </pre>
    </details>
  </form>
</template>

<style scoped>
.field {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
}
input, textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* AngularJS-style CSS classes — auto-applied by directives */
input.v-invalid.v-touched,
textarea.v-invalid.v-touched {
  border-color: #e74c3c;
}
input.v-valid.v-dirty,
textarea.v-valid.v-dirty {
  border-color: #2ecc71;
}
input.v-pristine {
  border-color: #ccc;
}

.errors span {
  display: block;
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}
.pending {
  color: #3498db;
  font-size: 0.85rem;
}
.char-count {
  font-size: 0.8rem;
  color: #999;
}
.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.debug {
  margin-top: 2rem;
  background: #f8f8f8;
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.8rem;
}
</style>
