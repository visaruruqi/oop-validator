<template>
  <div class="form-wrapper">
    <form @submit.prevent="validateForm">
      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="text" @keydown="validateEmail" placeholder="you@example.com" />
        <div v-if="errors.email.length" class="errors">
          <span v-for="(error, index) in errors.email" :key="index" class="error-item">{{ error }}</span>
        </div>
      </div>
      <div class="field">
        <label for="username">Username</label>
        <input id="username" v-model="username" type="text" placeholder="3–15 characters" />
        <div v-if="errors.username.length" class="errors">
          <span v-for="(error, index) in errors.username" :key="index" class="error-item">{{ error }}</span>
        </div>
      </div>
      <div class="field">
        <label for="city">City</label>
        <input id="city" v-model="city" type="text" @keydown="validateCity" placeholder="Letters only" />
        <div v-if="errors.city.length" class="errors">
          <span v-for="(error, index) in errors.city" :key="index" class="error-item">{{ error }}</span>
        </div>
      </div>
      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue';
import ValidationEngine from '../rules/ValidationEngine';
import RegexValidationRule from "@/rules/RegexValidationRule.ts";
import {IValidationRule} from "@/index.ts";

export default defineComponent({
  name: 'ValidationForm',
  setup() {
    const email = ref('');
    const username = ref('');
    const city = ref('')
    const errors = ref({email: [], username: [], city: []});

    const rulesForEmail = ['email', 'required'];
    const rulesForUsername = [
      'required',
      {
        rule: 'max',
        params: {length: 15},
        message: "Maximum length is 15 characters."
      },
      {
        rule: 'min',
        params: {length: 3},
        message: "Minimum length is 3 characters."
      }];

    const rulesForCity : IValidationRule[] = [
      new RegexValidationRule("^[a-zA-Z]+$")
    ]

    const validationEngineForEmail = new ValidationEngine(rulesForEmail);
    const validationEngineForUsername = new ValidationEngine(rulesForUsername);
    const validationEngineForCity = new ValidationEngine(rulesForCity);

    const validateForm = () => {
      errors.value.email = [];
      errors.value.username = [];

      const emailResult = validationEngineForEmail.validateValue(email.value);
      if (!emailResult.isValid) {
        errors.value.email = emailResult.errors;
      }

      const usernameResult = validationEngineForUsername.validateValue(username.value);
      if (!usernameResult.isValid) {
        errors.value.username = usernameResult.errors;
      }

      if (emailResult.isValid && usernameResult.isValid) {
        alert('Form is valid!');
      } else {
        alert('Form has errors.');
      }
    };

    const validateEmail = () => {
      errors.value.email = [];
      const emailResult = validationEngineForEmail.validateValue(email.value);
      if (!emailResult.isValid) {
        errors.value.email = emailResult.errors;
      }
    }

    const validateCity = () => {
      errors.value.city = [];
      const cityResult = validationEngineForCity.validateValue(city.value);
      if (!cityResult.isValid) {
        errors.value.city = cityResult.errors;
      }
    }

    return {
      email,
      username,
      city,
      errors,
      validateForm,
      validateEmail,
      validateCity
    };
  }
});
</script>

<style scoped>
.form-wrapper {
  max-width: 480px;
  margin: 40px auto;
  padding: 0 24px 64px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}

input {
  width: 100%;
  padding: 9px 12px;
  font-size: 14px;
  font-family: inherit;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #1a202c;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input:focus {
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.errors {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.error-item {
  color: #e53e3e;
  font-size: 12px;
}

button[type="submit"] {
  align-self: flex-start;
  padding: 9px 20px;
  font-size: 14px;
  font-weight: 600;
  background: #646cff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

button[type="submit"]:hover {
  background: #535bf2;
}
</style>
