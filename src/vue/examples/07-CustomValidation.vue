<template>
  <ExampleLayout
    title="07 · Custom Validation Rules"
    description="How to write your own IValidationRule classes and register them with useForm. Three examples: a hex colour rule, a no-spaces rule, and a dynamic 'must match' rule."
  >

    <!-- ── Example 1: Hex colour ───────────────────────────────── -->
    <section class="example-section">
      <div class="section-header">
        <h2 class="section-title">1 · Simple custom rule</h2>
        <p class="section-desc">
          <code>HexColorRule</code> — implements <code>IValidationRule</code>, registered via
          <code>form.registerRule()</code> after <code>useForm()</code>.
        </p>
      </div>

      <form name="colorForm" v-submit="submitColor">
        <div class="field-group">
          <label for="hexColor">
            Hex colour
            <span class="rule-tag">custom: HexColorRule</span>
          </label>
          <div class="input-row">
            <span
              class="color-swatch"
              :style="{ background: isValidHex(colorData.hex) ? colorData.hex : '#e2e8f0' }"
            ></span>
            <input
              id="hexColor"
              name="hex"
              type="text"
              v-model="colorData.hex"
              placeholder="#FF5733"
            />
          </div>
          <div class="error-list" v-show="colorForm.hex?.$touched || colorSubmitted" v-messages="colorForm.hex?.$error ?? {}">
            <span class="error-msg" v-message="'required'">Colour is required.</span>
            <span class="error-msg" v-message="'hexcolor'">Must be a valid hex colour, e.g. <code>#FF5733</code>.</span>
          </div>
        </div>

        <button type="submit" class="btn">Submit</button>
        <p v-if="colorSubmitted && colorForm.$valid?.value" class="success-msg">Valid colour!</p>
      </form>

      <div class="code-block">
        <div class="code-label">Rule definition</div>
        <pre><code>{{ hexRuleSource }}</code></pre>
      </div>
      <div class="code-block">
        <div class="code-label">Registration</div>
        <pre><code>{{ hexRegisterSource }}</code></pre>
      </div>
    </section>

    <!-- ── Example 2: No-spaces rule ──────────────────────────── -->
    <section class="example-section">
      <div class="section-header">
        <h2 class="section-title">2 · Rule with a custom error message</h2>
        <p class="section-desc">
          <code>NoSpacesRule</code> — same pattern, but demonstrates passing a custom error
          message string at registration time.
        </p>
      </div>

      <form name="slugForm" v-submit="submitSlug">
        <div class="field-group">
          <label for="slug">
            URL slug
            <span class="rule-tag">custom: NoSpacesRule</span>
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            v-model="slugData.slug"
            v-required
            v-pattern="'^[a-z0-9-]+$'"
            placeholder="my-article-slug"
          />
          <div class="error-list" v-show="slugForm.slug?.$touched || slugSubmitted" v-messages="slugForm.slug?.$error ?? {}">
            <span class="error-msg" v-message="'required'">Slug is required.</span>
            <span class="error-msg" v-message="'nospaces'">No spaces allowed.</span>
            <span class="error-msg" v-message="'pattern'">Lowercase letters, numbers, and hyphens only.</span>
          </div>
        </div>

        <button type="submit" class="btn">Submit</button>
        <p v-if="slugSubmitted && slugForm.$valid?.value" class="success-msg">Valid slug!</p>
      </form>

      <div class="code-block">
        <div class="code-label">Rule + registration with custom message</div>
        <pre><code>{{ noSpacesSource }}</code></pre>
      </div>
    </section>

    <!-- ── Example 3: Must-match ──────────────────────────────── -->
    <section class="example-section">
      <div class="section-header">
        <h2 class="section-title">3 · Rule with params (must-match)</h2>
        <p class="section-desc">
          <code>MustMatchRule</code> uses <code>setContext()</code> to read another field's value
          at validation time — the standard pattern for password-confirm rules.
        </p>
      </div>

      <form name="confirmForm" v-submit="submitConfirm">
        <div class="field-group">
          <label for="newPassword">New password</label>
          <input
            id="newPassword"
            name="password"
            type="password"
            v-model="confirmData.password"
            v-required
            v-minlength="8"
            placeholder="Min 8 characters"
          />
          <div class="error-list" v-show="confirmForm.password?.$touched || confirmSubmitted" v-messages="confirmForm.password?.$error ?? {}">
            <span class="error-msg" v-message="'required'">Password is required.</span>
            <span class="error-msg" v-message="'minlength'">At least 8 characters.</span>
          </div>
        </div>

        <div class="field-group">
          <label for="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirm"
            type="password"
            v-model="confirmData.confirm"
            v-required
            placeholder="Repeat password"
          />
          <div class="error-list" v-show="confirmForm.confirm?.$touched || confirmSubmitted" v-messages="confirmForm.confirm?.$error ?? {}">
            <span class="error-msg" v-message="'required'">Please confirm your password.</span>
            <span class="error-msg" v-message="'mustmatch'">Passwords do not match.</span>
          </div>
        </div>

        <button type="submit" class="btn">Submit</button>
        <p v-if="confirmSubmitted && confirmForm.$valid?.value" class="success-msg">Passwords match!</p>
      </form>

      <div class="code-block">
        <div class="code-label">MustMatchRule — reads another field via context</div>
        <pre><code>{{ mustMatchSource }}</code></pre>
      </div>
    </section>

    <!-- ── Example 4: ref() instead of reactive() ────────────── -->
    <section class="example-section">
      <div class="section-header">
        <h2 class="section-title">4 · Using <code>ref()</code> instead of <code>reactive()</code></h2>
        <p class="section-desc">
          <code>useForm</code> accepts either. The only difference: template bindings use
          <code>refData.name</code> (Vue auto-unwraps top-level refs in templates), but script
          code must use <code>refData.value.name</code>.
        </p>
      </div>

      <form name="refForm" v-submit="submitRef">
        <div class="field-group">
          <label for="refName">Full name</label>
          <input
            id="refName"
            name="name"
            type="text"
            v-model="refData.name"
            v-required
            v-minlength="2"
            placeholder="Jane Smith"
          />
          <div class="error-list" v-show="refForm.name?.$touched || refSubmitted" v-messages="refForm.name?.$error ?? {}">
            <span class="error-msg" v-message="'required'">Name is required.</span>
            <span class="error-msg" v-message="'minlength'">At least 2 characters.</span>
          </div>
        </div>

        <div class="field-group">
          <label for="refEmail">Email</label>
          <input
            id="refEmail"
            name="email"
            type="email"
            v-model="refData.email"
            v-required
            v-type
            placeholder="jane@example.com"
          />
          <div class="error-list" v-show="refForm.email?.$touched || refSubmitted" v-messages="refForm.email?.$error ?? {}">
            <span class="error-msg" v-message="'required'">Email is required.</span>
            <span class="error-msg" v-message="'type'">Enter a valid email address.</span>
          </div>
        </div>

        <button type="submit" class="btn">Submit</button>
        <p v-if="refSubmitted && refForm.$valid?.value" class="success-msg">Form is valid!</p>
      </form>

      <div class="code-block">
        <div class="code-label">ref() vs reactive() — the only difference</div>
        <pre><code>{{ refSource }}</code></pre>
      </div>
    </section>

  </ExampleLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import ExampleLayout from './ExampleLayout.vue'
import { useForm } from '@/vue/useForm'
import type { IValidationRule } from '@/index'

// ─── Custom rule 1: HexColorRule ────────────────────────────────────────────

class HexColorRule implements IValidationRule {
  private msg = 'Must be a valid hex colour (e.g. #FF5733).'

  isValid(value: any): [boolean, string] {
    if (value == null || value === '') return [true, '']
    const ok = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
    return [ok, ok ? '' : this.msg]
  }
  isMatch(type: string) { return type.toLowerCase() === 'hexcolor' }
  setParams(_: any) {}
  setErrorMessage(m: string) { this.msg = m }
}

// ─── Custom rule 2: NoSpacesRule ─────────────────────────────────────────────

class NoSpacesRule implements IValidationRule {
  private msg = 'This field must not contain spaces.'

  isValid(value: any): [boolean, string] {
    if (value == null || value === '') return [true, '']
    const ok = !/\s/.test(value)
    return [ok, ok ? '' : this.msg]
  }
  isMatch(type: string) { return type.toLowerCase() === 'nospaces' }
  setParams(_: any) {}
  setErrorMessage(m: string) { this.msg = m }
}

// ─── Custom rule 3: MustMatchRule ────────────────────────────────────────────

class MustMatchRule implements IValidationRule {
  private targetField = ''
  private context: Record<string, any> = {}
  private msg = 'Values do not match.'

  isValid(value: any): [boolean, string] {
    const target = this.context[this.targetField]
    const ok = value === target
    return [ok, ok ? '' : this.msg]
  }
  isMatch(type: string) { return type.toLowerCase() === 'mustmatch' }
  setParams(params: { field: string }) { this.targetField = params.field }
  setErrorMessage(m: string) { this.msg = m }
  // Called by FormValidationEngine before each validation with the full form data
  setContext(ctx: Record<string, any>) { this.context = ctx }
}

// ─── Form 1: hex colour ───────────────────────────────────────────────────────

const colorData = reactive({ hex: '' })
const colorForm = useForm('colorForm', colorData)
const colorSubmitted = ref(false)

colorForm.registerRule('hex', 'required', 'required')
colorForm.registerRule('hex', 'hexcolor', new HexColorRule())

const submitColor = () => { colorSubmitted.value = true }
const isValidHex = (v: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)

// ─── Form 2: slug ─────────────────────────────────────────────────────────────

const slugData = reactive({ slug: '' })
const slugForm = useForm('slugForm', slugData)
const slugSubmitted = ref(false)

const noSpacesRule = new NoSpacesRule()
noSpacesRule.setErrorMessage('Spaces are not allowed in a URL slug.')
slugForm.registerRule('slug', 'nospaces', noSpacesRule)

const submitSlug = () => { slugSubmitted.value = true }

// ─── Form 3: must-match ───────────────────────────────────────────────────────

const confirmData = reactive({ password: '', confirm: '' })
const confirmForm = useForm('confirmForm', confirmData)
const confirmSubmitted = ref(false)

const mustMatch = new MustMatchRule()
mustMatch.setParams({ field: 'password' })
mustMatch.setErrorMessage('Passwords do not match.')
confirmForm.registerRule('confirm', 'required', 'required')
confirmForm.registerRule('confirm', 'mustmatch', mustMatch)

const submitConfirm = () => { confirmSubmitted.value = true }

// ─── Source snippets shown in the UI ─────────────────────────────────────────

const hexRuleSource = `class HexColorRule implements IValidationRule {
  private msg = 'Must be a valid hex colour (e.g. #FF5733).'

  isValid(value: any): [boolean, string] {
    if (value == null || value === '') return [true, '']
    const ok = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
    return [ok, ok ? '' : this.msg]
  }
  isMatch(type: string) { return type.toLowerCase() === 'hexcolor' }
  setParams(_: any) {}
  setErrorMessage(m: string) { this.msg = m }
}`

const hexRegisterSource = `const colorData = reactive({ hex: '' })
const colorForm = useForm('colorForm', colorData)

colorForm.registerRule('hex', 'required', 'required')
colorForm.registerRule('hex', 'hexcolor', new HexColorRule())`

const noSpacesSource = `class NoSpacesRule implements IValidationRule {
  private msg = 'This field must not contain spaces.'

  isValid(value: any): [boolean, string] {
    if (value == null || value === '') return [true, '']
    const ok = !/\\s/.test(value)
    return [ok, ok ? '' : this.msg]
  }
  isMatch(type: string) { return type.toLowerCase() === 'nospaces' }
  setParams(_: any) {}
  setErrorMessage(m: string) { this.msg = m }
}

// Custom error message at registration time:
const noSpacesRule = new NoSpacesRule()
noSpacesRule.setErrorMessage('Spaces are not allowed in a URL slug.')
slugForm.registerRule('slug', 'nospaces', noSpacesRule)`

// ─── Form 4: ref() ───────────────────────────────────────────────────────────

const refData = ref({ name: '', email: '' })
const refForm = useForm('refForm', refData)
const refSubmitted = ref(false)

const submitRef = () => { refSubmitted.value = true }

const refSource = `// reactive() — access as data.name everywhere
const data = reactive({ name: '', email: '' })
const form = useForm('myForm', data)

// ref() — script uses data.value.name, template uses data.name (auto-unwrapped)
const data = ref({ name: '', email: '' })
const form = useForm('myForm', data)

// Both are identical from useForm's perspective.
// v-model="data.name" works in both cases inside the template.`

const mustMatchSource = `class MustMatchRule implements IValidationRule {
  private targetField = ''
  private context: Record<string, any> = {}
  private msg = 'Values do not match.'

  isValid(value: any): [boolean, string] {
    const target = this.context[this.targetField]
    const ok = value === target
    return [ok, ok ? '' : this.msg]
  }
  isMatch(type: string) { return type.toLowerCase() === 'mustmatch' }
  setParams(params: { field: string }) { this.targetField = params.field }
  setErrorMessage(m: string) { this.msg = m }

  // FormValidationEngine calls setContext() before each validate()
  // with the full form data object — use it to read other fields.
  setContext(ctx: Record<string, any>) { this.context = ctx }
}

const mustMatch = new MustMatchRule()
mustMatch.setParams({ field: 'password' })
mustMatch.setErrorMessage('Passwords do not match.')
confirmForm.registerRule('confirm', 'mustmatch', mustMatch)`
</script>

<style scoped>
.example-section {
  margin-bottom: 48px;
  padding-bottom: 40px;
  border-bottom: 1px solid #e2e8f0;
}

.example-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-header {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 6px;
}

.section-desc {
  font-size: 13px;
  color: #718096;
  margin: 0;
  line-height: 1.6;
}

.section-desc code {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
  color: #1e3a5f;
}

form {
  margin-bottom: 20px;
}

.field-group {
  margin-bottom: 20px;
}

.field-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1.5px solid #d1d5db;
  flex-shrink: 0;
  transition: background 0.2s;
}

input[type="text"],
input[type="password"] {
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
  box-sizing: border-box;
}

input:focus {
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
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

.error-msg code {
  font-size: 11px;
}

.rule-tag {
  background: #f1f5f9;
  color: #475569;
  font-size: 10px;
  font-family: monospace;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: normal;
  margin-left: 6px;
}

.btn {
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

.btn:hover {
  background: #535bf2;
}

.success-msg {
  display: inline-block;
  margin: 10px 0 0 12px;
  font-size: 13px;
  color: #38a169;
  font-weight: 600;
}

.code-block {
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.code-label {
  padding: 7px 14px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

pre {
  margin: 0;
  padding: 16px;
  background: #1e2637;
  overflow-x: auto;
}

pre code {
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.7;
  color: #cdd4e0;
  white-space: pre;
}
</style>
