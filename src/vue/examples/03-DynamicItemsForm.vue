<template>
  <ExampleLayout
    title="03 · Dynamic Items Form"
    description="Demonstrates v-if conditional fields (removed from validation when hidden) and v-for dynamic lists with add/remove. Watch form.$valid update as you add or remove items."
  >
    <form name="dynamic" v-submit="handleSubmit">
      <!-- Order type -->
      <div class="field-group">
        <label>Order Type <span class="required">*</span></label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" name="orderType" value="single" v-model="formData.orderType" v-required />
            Single Item
          </label>
          <label class="radio-label">
            <input type="radio" name="orderType" value="bulk" v-model="formData.orderType" v-required />
            Bulk Order
          </label>
        </div>
      </div>

      <!-- Conditional: Bulk-only fields (v-if) -->
      <template v-if="formData.orderType === 'bulk'">
        <div class="conditional-banner">Bulk order fields — these disappear (and leave no stale errors) when you switch back to Single Item.</div>

        <div class="field-group">
          <label for="companyName">Company Name <span class="required">*</span></label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            v-model="formData.companyName"
            v-required
            v-minlength="2"
            v-maxlength="100"
            placeholder="Acme Corp"
          />
          <div
            class="error-list"
            v-show="form.companyName?.$touched || $submitted"
            v-messages="form.companyName?.$error ?? {}"
          >
            <span class="error-msg" v-message="'required'">Company name is required.</span>
            <span class="error-msg" v-message="'minlength'">Must be at least 2 characters.</span>
          </div>
        </div>

        <div class="field-group">
          <label for="vatNumber">VAT Number <span class="optional">(optional)</span></label>
          <input
            id="vatNumber"
            name="vatNumber"
            type="text"
            v-model="formData.vatNumber"
            v-pattern="/^[A-Z]{2}[0-9]{8,12}$/"
            placeholder="GB123456789"
          />
          <div
            class="error-list"
            v-show="form.vatNumber?.$touched || $submitted"
            v-messages="form.vatNumber?.$error ?? {}"
          >
            <span class="error-msg" v-message="'pattern'">Format: 2 letters + 8–12 digits (e.g. GB123456789)</span>
          </div>
        </div>
      </template>

      <!-- Dynamic Items list (v-for) -->
      <div class="items-section">
        <div class="items-header">
          <h3 class="items-title">Items</h3>
          <button type="button" class="btn btn-add" @click="addItem">+ Add Item</button>
        </div>

        <div
          v-for="(item, index) in items"
          :key="item.id"
          class="item-card"
        >
          <div class="item-card-header">
            <span class="item-num">Item {{ index + 1 }}</span>
            <button
              v-if="items.length > 1"
              type="button"
              class="btn-remove"
              @click="removeItem(item.id)"
            >✕ Remove</button>
          </div>

          <div class="item-fields">
            <div class="field-group">
              <label>Description <span class="required">*</span></label>
              <input
                :name="`item_${item.id}_desc`"
                type="text"
                v-model="formData[`item_${item.id}_desc`]"
                v-required
                v-minlength="3"
                v-maxlength="200"
                placeholder="Widget A"
              />
              <div
                class="error-list"
                v-show="form[`item_${item.id}_desc`]?.$touched || $submitted"
                v-messages="form[`item_${item.id}_desc`]?.$error ?? {}"
              >
                <span class="error-msg" v-message="'required'">Description is required.</span>
                <span class="error-msg" v-message="'minlength'">At least 3 characters.</span>
              </div>
            </div>

            <div class="item-row">
              <div class="field-group">
                <label>Qty <span class="required">*</span></label>
                <input
                  :name="`item_${item.id}_qty`"
                  type="number"
                  v-model="formData[`item_${item.id}_qty`]"
                  v-required
                  v-min="1"
                  v-max="999"
                  placeholder="1"
                />
                <div
                  class="error-list"
                  v-show="form[`item_${item.id}_qty`]?.$touched || $submitted"
                  v-messages="form[`item_${item.id}_qty`]?.$error ?? {}"
                >
                  <span class="error-msg" v-message="'required'">Required.</span>
                  <span class="error-msg" v-message="'min'">Min 1.</span>
                  <span class="error-msg" v-message="'max'">Max 999.</span>
                </div>
              </div>

              <div class="field-group">
                <label>Price (€) <span class="required">*</span></label>
                <input
                  :name="`item_${item.id}_price`"
                  type="number"
                  step="0.01"
                  v-model="formData[`item_${item.id}_price`]"
                  v-required
                  v-min="0.01"
                  placeholder="9.99"
                />
                <div
                  class="error-list"
                  v-show="form[`item_${item.id}_price`]?.$touched || $submitted"
                  v-messages="form[`item_${item.id}_price`]?.$error ?? {}"
                >
                  <span class="error-msg" v-message="'required'">Required.</span>
                  <span class="error-msg" v-message="'min'">Must be > 0.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form state summary -->
      <div class="state-bar">
        <span :class="['badge', $valid ? 'badge-green' : 'badge-red']">
          form.$valid = {{ $valid }}
        </span>
        <span class="badge badge-blue">{{ items.length }} item(s)</span>
        <span v-if="formData.orderType === 'bulk'" class="badge badge-orange">bulk mode</span>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Place Order</button>
        <button type="button" class="btn btn-secondary" @click="$reset(); items.splice(1); cleanupExtraItems()">Reset</button>
      </div>

      <div v-if="$submitted && $invalid" class="form-error-summary">
        Please fix the errors above before submitting.
      </div>

      <div v-if="orderPlaced" class="success-banner">
        Order placed! {{ items.length }} item(s), type: {{ formData.orderType }}.
      </div>
    </form>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import ExampleLayout from './ExampleLayout.vue'
import { useForm } from '@/vue/useForm'

interface Item { id: number }

let nextId = 2

const items = ref<Item[]>([{ id: 1 }])

const formData = reactive<Record<string, any>>({
  orderType: 'single',
  companyName: '',
  vatNumber: '',
  item_1_desc: '',
  item_1_qty: '',
  item_1_price: '',
})

const form = useForm('dynamic', formData)
const $submitted = form.$submitted
const $invalid = form.$invalid
const $valid = form.$valid

const orderPlaced = ref(false)

function addItem() {
  const id = nextId++
  items.value.push({ id })
  formData[`item_${id}_desc`] = ''
  formData[`item_${id}_qty`] = ''
  formData[`item_${id}_price`] = ''
}

function removeItem(id: number) {
  items.value = items.value.filter(i => i.id !== id)
  delete formData[`item_${id}_desc`]
  delete formData[`item_${id}_qty`]
  delete formData[`item_${id}_price`]
}

function cleanupExtraItems() {
  // Keep only item 1 in formData after reset
  for (const key of Object.keys(formData)) {
    if (key.startsWith('item_') && !key.startsWith('item_1_')) {
      delete formData[key]
    }
  }
}

const $reset = () => form.$reset()

function handleSubmit() {
  orderPlaced.value = true
}
</script>

<style scoped>
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

input[type="text"],
input[type="number"] {
  width: 100%;
  padding: 8px 12px;
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
}

.conditional-banner {
  padding: 10px 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 12px;
  color: #1d4ed8;
  margin-bottom: 16px;
}

.items-section {
  margin-top: 24px;
}

.items-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.items-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.item-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background: #fafafa;
}

.item-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.item-num {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.5px;
}

.item-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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

.state-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 20px 0 4px;
  flex-wrap: wrap;
}

.badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
}

.badge-green { background: #dcfce7; color: #166534; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.badge-orange { background: #fef3c7; color: #92400e; }

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  padding: 9px 20px;
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

.btn-primary:hover {
  background: #535bf2;
}

.btn-secondary {
  background: #e2e8f0;
  color: #374151;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn-add {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #86efac;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
}

.btn-add:hover {
  background: #dcfce7;
}

.btn-remove {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-remove:hover {
  background: #fee2e2;
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
  margin-top: 16px;
  padding: 16px 20px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  font-size: 14px;
  color: #166534;
}
</style>
