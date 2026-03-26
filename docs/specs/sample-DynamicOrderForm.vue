<!--
  ============================================================================
  SAMPLE 2: Dynamic Form with v-if / v-for fields
  Shows that cleanup works correctly — no memory leaks
  ============================================================================
-->

<!-- src/views/DynamicOrderForm.vue -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useForm, MatchFieldValidationRule } from 'oop-validator'

const order = reactive({
  customerType: 'individual' as 'individual' | 'business',
  name: '',
  companyName: '',
  vatNumber: '',
  email: '',
  items: [
    { description: '', quantity: 1 }
  ],
})

const form = useForm('orderForm', order, {
  // Async validators: server-side checks
  // Only run AFTER all sync validators pass, debounced, auto-cancelled on new input
  asyncValidators: {
    email: {
      uniqueEmail: async (value: string) => {
        const res = await fetch(`/api/check-email?email=${encodeURIComponent(value)}`)
        return (await res.json()).available  // true = valid, false = taken
      }
    },
    vatNumber: {
      validVat: async (value: string) => {
        const res = await fetch(`/api/validate-vat?vat=${encodeURIComponent(value)}`)
        return (await res.json()).valid
      }
    }
  },
  debounce: 400,  // 400ms debounce for async validators
})

// Add a cross-field validation rule programmatically (engine is exposed)
// This shows that form.engine gives you full oop-validator power
// form.engine.addRuleToField('confirmEmail', new MatchFieldValidationRule('email'))

function addItem() {
  order.items.push({ description: '', quantity: 1 })
}

function removeItem(index: number) {
  order.items.splice(index, 1)
  // When the DOM removes the <input> elements, their v-required/v-minlength
  // directives fire "unmounted" → which calls form.unregisterRule() and
  // removes event listeners. No manual cleanup needed.
}

async function submitOrder() {
  console.log('Order submitted:', order)
}
</script>

<template>
  <form name="orderForm" v-submit="submitOrder" novalidate>

    <!-- ============================================================ -->
    <!-- RADIO: controls which fields are visible via v-if             -->
    <!-- When v-if removes a field, directives unmount → cleanup       -->
    <!-- ============================================================ -->
    <fieldset>
      <legend>Customer Type</legend>
      <label>
        <input type="radio" v-model="order.customerType" value="individual"> Individual
      </label>
      <label>
        <input type="radio" v-model="order.customerType" value="business"> Business
      </label>
    </fieldset>

    <!-- Always visible -->
    <div class="field">
      <label>Name</label>
      <input
        type="text"
        name="name"
        v-model="order.name"
        v-required="true"
        v-minlength="2"
      >
      <div v-messages="form.name?.$error" v-show="form.name?.$touched || form.$submitted" class="errors">
        <span v-message="'required'">Name is required.</span>
        <span v-message="'minlength'">At least 2 characters.</span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- CONDITIONAL FIELDS: v-if removes from DOM completely          -->
    <!--                                                               -->
    <!-- When customerType switches to 'individual':                   -->
    <!--   1. Vue removes the companyName/vatNumber <input> elements   -->
    <!--   2. v-required directive's "unmounted" hook fires             -->
    <!--   3. Directive calls form.unregisterRule('companyName', ...)   -->
    <!--   4. Directive calls el.removeEventListener('blur', ...)      -->
    <!--   5. Directive calls el.removeEventListener('input', ...)     -->
    <!--   6. form.companyName is removed from form state              -->
    <!--   7. form.$valid recomputes without the removed fields        -->
    <!--                                                               -->
    <!-- NO memory leaks. NO stale field state. NO orphan listeners.   -->
    <!-- ============================================================ -->
    <template v-if="order.customerType === 'business'">
      <div class="field">
        <label>Company Name</label>
        <input
          type="text"
          name="companyName"
          v-model="order.companyName"
          v-required="true"
          v-minlength="2"
          v-maxlength="200"
        >
        <div v-messages="form.companyName?.$error"
             v-show="form.companyName?.$touched || form.$submitted" class="errors">
          <span v-message="'required'">Company name is required.</span>
          <span v-message="'minlength'">At least 2 characters.</span>
        </div>
      </div>

      <div class="field">
        <label>VAT Number</label>
        <input
          type="text"
          name="vatNumber"
          v-model="order.vatNumber"
          v-required="true"
          v-pattern="/^[A-Z]{2}\d{8,12}$/"
        >
        <span v-if="form.vatNumber?.$pending" class="pending">Validating VAT...</span>
        <div v-messages="form.vatNumber?.$error"
             v-show="form.vatNumber?.$touched || form.$submitted" class="errors">
          <span v-message="'required'">VAT number is required for business.</span>
          <span v-message="'pattern'">Invalid VAT format (e.g., DE123456789).</span>
          <span v-message="'validVat'">VAT number not recognized.</span>
        </div>
      </div>
    </template>

    <!-- Email with async validation -->
    <div class="field">
      <label>Email</label>
      <input
        type="email"
        name="email"
        v-model="order.email"
        v-required="true"
        v-type
      >
      <span v-if="form.email?.$pending" class="pending">Checking email...</span>
      <div v-messages="form.email?.$error"
           v-show="form.email?.$touched || form.$submitted" class="errors">
        <span v-message="'required'">Email is required.</span>
        <span v-message="'email'">Invalid email format.</span>
        <span v-message="'uniqueEmail'">This email is already registered.</span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- DYNAMIC v-for FIELDS: items array                             -->
    <!--                                                               -->
    <!-- Each item's inputs have name="items[0].description" etc.      -->
    <!-- When removeItem() splices the array:                          -->
    <!--   1. Vue removes the <input> elements from DOM                -->
    <!--   2. All v-* directives on those inputs fire "unmounted"      -->
    <!--   3. Rules unregistered, listeners removed, field state gone  -->
    <!--   4. form.$valid recomputes cleanly                           -->
    <!-- ============================================================ -->
    <fieldset>
      <legend>Order Items</legend>

      <div v-for="(item, index) in order.items" :key="index" class="item-row">
        <div class="field">
          <label>Description</label>
          <input
            type="text"
            :name="`items[${index}].description`"
            v-model="item.description"
            v-required="true"
            v-minlength="3"
          >
          <div
            v-messages="form[`items[${index}].description`]?.$error"
            v-show="form[`items[${index}].description`]?.$touched || form.$submitted"
            class="errors"
          >
            <span v-message="'required'">Description is required.</span>
            <span v-message="'minlength'">At least 3 characters.</span>
          </div>
        </div>

        <div class="field">
          <label>Quantity</label>
          <input
            type="number"
            :name="`items[${index}].quantity`"
            v-model.number="item.quantity"
            v-required="true"
            v-min="1"
            v-max="999"
          >
          <div
            v-messages="form[`items[${index}].quantity`]?.$error"
            v-show="form[`items[${index}].quantity`]?.$touched || form.$submitted"
            class="errors"
          >
            <span v-message="'required'">Quantity is required.</span>
            <span v-message="'min'">Minimum quantity is 1.</span>
            <span v-message="'max'">Maximum quantity is 999.</span>
          </div>
        </div>

        <button type="button" @click="removeItem(index)" v-if="order.items.length > 1">
          Remove
        </button>
      </div>

      <button type="button" @click="addItem">+ Add Item</button>
    </fieldset>

    <!-- ============================================================ -->
    <!-- DYNAMIC v-required: toggle based on expression                -->
    <!-- ============================================================ -->
    <div class="field">
      <label>
        <input type="checkbox" v-model="order.needsInvoice"> I need an invoice
      </label>
    </div>
    <div class="field" v-if="order.needsInvoice">
      <label>Invoice Address</label>
      <input
        type="text"
        name="invoiceAddress"
        v-model="order.invoiceAddress"
        v-required="order.needsInvoice"
      >
      <!-- v-required="order.needsInvoice" is reactive — when false, rule is removed -->
      <div v-messages="form.invoiceAddress?.$error"
           v-show="form.invoiceAddress?.$touched || form.$submitted" class="errors">
        <span v-message="'required'">Invoice address is required.</span>
      </div>
    </div>

    <!-- Submit -->
    <div class="actions">
      <button type="submit" :disabled="form.$invalid || form.$pending">
        Place Order
      </button>

      <!-- Conditional messaging based on form state -->
      <span v-if="form.$submitted && form.$invalid" class="form-error">
        Please fix the errors above.
      </span>
    </div>
  </form>
</template>
