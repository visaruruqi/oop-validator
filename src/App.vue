<template>
  <div id="app">
    <ValidationForm />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ValidationForm from './components/ValidationForm.vue';

export default defineComponent({
  name: 'App',
  components: {
    ValidationForm
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
