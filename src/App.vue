<template>
  <div id="app-shell">
    <nav class="sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">oop-validator</span>
        <span class="sidebar-subtitle">v0.6.0 · Vue directives</span>
      </div>
      <ul class="nav-list">
        <li class="nav-section-label">Examples</li>
        <li><RouterLink to="/examples/contact">01 · Contact Form</RouterLink></li>
        <li><RouterLink to="/examples/registration">02 · Registration</RouterLink></li>
        <li><RouterLink to="/examples/dynamic">03 · Dynamic Items</RouterLink></li>
        <li><RouterLink to="/examples/numeric">04 · Numeric Validation</RouterLink></li>
        <li><RouterLink to="/examples/messages">05 · Messages Showcase</RouterLink></li>
        <li><RouterLink to="/examples/debugger">06 · State Debugger</RouterLink></li>
        <li><RouterLink to="/examples/custom">07 · Custom Rules</RouterLink></li>
        <li class="nav-section-label nav-section-label--top">Legacy</li>
        <li><RouterLink to="/legacy">ValidationForm.vue</RouterLink></li>
      </ul>
    </nav>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style>
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  min-height: 100vh;
}

body {
  display: block;
  place-items: unset;
  background: #f5f6fa;
  color: #2c3e50;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

#app-shell {
  display: flex;
  min-height: 100vh;
  max-width: unset;
  margin: 0;
  padding: 0;
  text-align: left;
}

.sidebar {
  width: 220px;
  min-width: 220px;
  background: #1e2637;
  color: #cdd4e0;
  display: flex;
  flex-direction: column;
  padding: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid #2d3a50;
}

.sidebar-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.sidebar-subtitle {
  display: block;
  font-size: 11px;
  color: #7a8899;
  margin-top: 2px;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 12px 0;
}

.nav-list li a {
  display: block;
  padding: 8px 16px;
  color: #a8b4c4;
  text-decoration: none;
  font-size: 13px;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
}

.nav-list li a:hover {
  background: #2d3a50;
  color: #ffffff;
}

.nav-list li a.router-link-active {
  background: #263348;
  color: #ffffff;
  border-left-color: #646cff;
}

.nav-section-label {
  padding: 8px 16px 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #4a5568;
}

.nav-section-label--top {
  margin-top: 8px;
  border-top: 1px solid #2d3a50;
  padding-top: 16px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  min-width: 0;
}
</style>
