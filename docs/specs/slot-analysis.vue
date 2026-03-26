<!-- 
  ============================================================================
  SLOT ANALYSIS: When do slotted inputs work with useForm?
  ============================================================================
-->


<!-- ========================================================== -->
<!-- CASE 1: ✅ WORKS — Form and useForm in same component       -->
<!--         Inputs in slots of child wrapper components         -->
<!-- ========================================================== -->

<!-- PageView.vue -->
<script setup>
import { reactive } from 'vue'
import { useForm } from 'oop-validator'

const model = reactive({ code: '', name: '' })
const form = useForm('editForm', model)
</script>

<template>
  <!-- useForm is here, <form> is here, inputs are in slots below -->
  <ScreenWrapper>
    <form name="editForm" v-submit="save" novalidate>
      
      <FormSection title="Basic Info">
        <!-- This input is in FormSection's <slot> -->
        <input name="code" v-model="model.code" v-required="true" v-minlength="2">
        <div v-messages="form.code?.$error" v-show="form.code?.$touched || form.$submitted">
          <span v-message="'required'">Code is required.</span>
        </div>
      </FormSection>

      <TabPanel>
        <Tab name="Details">
          <!-- This input is in Tab's <slot>, inside TabPanel's <slot> -->
          <input name="name" v-model="model.name" v-required="true">
        </Tab>
      </TabPanel>

    </form>
  </ScreenWrapper>
</template>

<!--
  WHY IT WORKS:
  
  The actual DOM is flat — all slot content is projected into one tree:
  
  <div class="screen-wrapper">           ← ScreenWrapper
    <form name="editForm">                ← our form
      <div class="form-section">          ← FormSection
        <input name="code">              ← el.closest('form') → finds <form> ✅
      </div>
      <div class="tab-panel">            ← TabPanel
        <div class="tab">                ← Tab
          <input name="name">            ← el.closest('form') → finds <form> ✅
        </div>
      </div>
    </form>
  </div>
  
  No matter how many wrapper components, closest('form') walks the DOM tree
  through ALL of them. Vue slots are compile-time — the rendered DOM is flat.
-->


<!-- ========================================================== -->
<!-- CASE 2: ✅ WORKS — Deeply nested reusable field component   -->
<!-- ========================================================== -->

<!-- FormField.vue — reusable field wrapper -->
<template>
  <div class="form-group" :class="{ 'has-error': hasError }">
    <label>{{ label }}</label>
    <slot></slot>  <!-- the actual <input> comes from parent via slot -->
    <slot name="errors"></slot>
  </div>
</template>

<!-- Usage in page -->
<template>
  <form name="myForm" v-submit="save" novalidate>
    <FormField label="Email" :has-error="form.email?.$invalid && form.email?.$touched">
      <input name="email" v-model="data.email" v-required="true" v-type type="email">
      
      <template #errors>
        <div v-messages="form.email?.$error" v-show="form.email?.$touched || form.$submitted">
          <span v-message="'required'">Required.</span>
          <span v-message="'email'">Invalid email.</span>
        </div>
      </template>
    </FormField>
  </form>
</template>

<!--
  WHY IT WORKS:
  
  DOM result:
  <form name="myForm">
    <div class="form-group">           ← FormField wrapper
      <label>Email</label>
      <input name="email">             ← el.closest('form') → ✅
      <div v-messages="...">           ← also inside <form>, works
        <span v-message="'required'">
      </div>
    </div>
  </form>
-->


<!-- ========================================================== -->
<!-- CASE 3: ❌ BREAKS — Form is INSIDE the child component      -->
<!--         but useForm is in the parent                        -->
<!-- ========================================================== -->

<!-- ModalDialog.vue — renders its own <form> internally -->
<template>
  <div class="modal-overlay">
    <div class="modal-body">
      <form :name="formName">    <!-- ← form element is HERE, inside child -->
        <slot></slot>
      </form>
    </div>
  </div>
</template>

<!-- Parent usage -->
<script setup>
const form = useForm('editForm', data)  // ← useForm is HERE, in parent
</script>
<template>
  <ModalDialog form-name="editForm">
    <input name="code" v-model="data.code" v-required="true">
  </ModalDialog>
</template>

<!--
  WHY IT BREAKS:
  
  useForm('editForm', data) runs onMounted() in the PARENT component.
  It does: document.querySelector('form[name="editForm"]') to find the <form>.
  
  TIMING PROBLEM:
  - Parent's onMounted fires AFTER all children have mounted (Vue lifecycle)
  - So the <form> element DOES exist in the DOM by then — querySelector finds it ✅
  - Actually... this MIGHT work. But it's fragile and depends on mount order.
  
  BETTER APPROACH: Move useForm into the child, or pass it as a prop.
-->


<!-- ========================================================== -->
<!-- CASE 3 — FIXED VERSION                                       -->
<!-- ========================================================== -->

<!-- Option A: useForm inside the modal (recommended) -->
<script setup>
// ModalDialog.vue
import { useForm } from 'oop-validator'
const props = defineProps(['modelValue'])
const form = useForm('editForm', props.modelValue)
defineExpose({ form })  // expose to parent if needed
</script>

<!-- Option B: Parent passes form down, child provides the <form> element -->
<!-- This needs useForm to support late binding to a form element -->


<!-- ========================================================== -->
<!-- CASE 4: ❌ BREAKS — Teleport moves DOM outside <form>        -->
<!-- ========================================================== -->

<template>
  <form name="myForm" v-submit="save" novalidate>
    <input name="name" v-model="data.name" v-required="true">  <!-- ✅ works -->
    
    <Teleport to="body">
      <!-- This input is teleported OUTSIDE the <form> in the DOM -->
      <input name="email" v-model="data.email" v-required="true">  <!-- ❌ breaks -->
    </Teleport>
  </form>
</template>

<!--
  WHY IT BREAKS:
  
  Teleport physically moves the DOM element to <body>.
  el.closest('form') from the teleported <input> will NOT find the <form>.
  
  This is the same problem AngularJS had — ng-model in a transcluded 
  element outside the ng-form boundary didn't work either.
  
  FIX: Don't teleport form inputs. If you need a modal with form fields,
  put the entire <form> inside the modal.
-->


<!-- ========================================================== -->
<!-- CASE 5: ✅ WORKS — v-if / v-show inside slots               -->
<!-- ========================================================== -->

<template>
  <form name="myForm" v-submit="save" novalidate>
    <FormSection>
      <template v-if="showAdvanced">
        <!-- When v-if is true: directives mount, rules register -->
        <!-- When v-if is false: directives unmount, rules unregister, listeners removed -->
        <input name="advancedField" v-model="data.advanced" v-required="true">
      </template>
    </FormSection>
  </form>
</template>

<!-- Works because v-if adds/removes from the DOM tree that's inside <form> -->


<!-- ========================================================== -->
<!-- CASE 6: ✅ WORKS — Your exact AngularJS migration pattern    -->
<!-- ========================================================== -->

<script setup>
import { reactive } from 'vue'
import { useForm } from 'oop-validator'

const modal = reactive({
  model: { code: '' }
})
const REGEX_FOR_CODE = /^[a-zA-Z0-9_-]+$/

const form = useForm('editPropertyContentForm', modal.model)

function save() { /* ... */ }
</script>

<template>
  <ScreenWrapper>
    <form name="editPropertyContentForm" v-submit="save" novalidate>
      <div class="col-sm-12">
        <div class="form-group"
             :class="{
               'has-error': form.code?.$invalid 
                 && (form.code?.$dirty || form.$submitted)
             }">

          <input type="text" name="code"
                 v-model="modal.model.code"
                 v-pattern="REGEX_FOR_CODE"
                 v-maxlength="255"
                 v-required="true"
                 v-minlength="2"
                 :placeholder="$t('lbl_code')"
                 class="form-control"
                 autocomplete="off">

          <div v-messages="form.code?.$error"
               v-show="form.code?.$dirty || form.$submitted">
            <p v-message="'minlength'" class="help-block">
              {{ $t('msg_short_code') }}
            </p>
            <p v-message="'maxlength'" class="help-block">
              {{ $t('msg_long_code') }}
            </p>
            <p v-message="'required'" class="help-block">
              {{ $t('msg_required_code') }}
            </p>
            <p v-message="'pattern'" class="help-block">
              {{ $t('msg_special_characters_code_valid') }}
            </p>
          </div>
        </div>
      </div>
    </form>
  </ScreenWrapper>
</template>

<!--
  MIGRATION DIFF FROM YOUR ANGULARJS ORIGINAL:
  
  ng-class="{'has-error':editPropertyContentForm.code.$invalid && ...}"
  →  :class="{'has-error': form.code?.$invalid && ...}"
  
  ng-pattern="REGEX_FOR_CODE"        →  v-pattern="REGEX_FOR_CODE"
  ng-maxlength="255"                 →  v-maxlength="255"
  ng-required="true"                 →  v-required="true"
  ng-minlength="2"                   →  v-minlength="2"
  ng-model="modal.model.code"        →  v-model="modal.model.code"
  
  placeholder='{{ ::"lbl_code" | translate}}'
  →  :placeholder="$t('lbl_code')"
  
  ng-messages="editPropertyContentForm.code.$error"
  →  v-messages="form.code?.$error"
  
  ng-show="editPropertyContentForm.code.$dirty || propertyContent.$submitted"
  →  v-show="form.code?.$dirty || form.$submitted"
  
  ng-message="minlength"             →  v-message="'minlength'"
  ng-message="required"              →  v-message="'required'"
  
  {{ ::"msg_short_code" | translate}}  →  {{ $t('msg_short_code') }}
  
  That's it. Structure is identical. ScreenWrapper slot works fine.
-->
