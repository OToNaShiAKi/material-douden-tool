<template>
  <section class="card-container">
    <div class="card-body">
      <div class="card-wrap">
        <div contenteditable="true" class="card-text"><slot /></div>
      </div>
      <div class="card-brand">{{ tip }}</div>
    </div>
    <div class="card-logo">
      <img src="/candy.png" class="card-image" />
    </div>
  </section>
</template>

<script>
export default {
  name: "Card",
  props: { tip: String },
};
</script>

<style scoped>
.card-container {
  background-color: #f3969a;
  padding: 10px 10px 0;
  text-align: center;
  width: 600px;
  margin: "auto";
}
.card-body {
  background-color: #fff;
  border-radius: 8px;
}
.card-logo {
  height: 50px;
  padding: 5px 0;
}
.card-image {
  width: 40px;
  height: 40px;
  vertical-align: middle;
  margin: auto;
}
.card-brand {
  padding: 0.5em 0;
  color: #aaa;
}
.card-wrap {
  min-height: 230px;
  padding: 42px 0 20px;
  display: flex;
  align-items: center;
}
.card-text {
  max-width: 520px;
  font-size: 24px;
  color: #333;
  text-rendering: optimizeLegibility;
  margin: auto;
  line-height: 44px;
  white-space: pre-wrap;
  word-break: break-all;
  text-align: left;
  flex: 1;
}
</style>
