<template>
  <div class="example-layout">
    <div class="example-header">
      <h1 class="example-title">{{ title }}</h1>
      <p v-if="description" class="example-description">{{ description }}</p>
    </div>
    <div class="example-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style scoped>
.example-layout {
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.example-header {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.example-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px;
}

.example-description {
  font-size: 14px;
  color: #718096;
  margin: 0;
  line-height: 1.6;
}
</style>
