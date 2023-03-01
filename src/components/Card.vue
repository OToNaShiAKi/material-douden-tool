<template>
  <section
    class="card-container"
    :style="{ backgroundColor: colors.container, fontFamily: fontface }"
  >
    <div class="card-body" :style="{ backgroundColor: colors.background }">
      <div class="card-wrap">
        <div
          contenteditable="true"
          :style="{ color: colors.text, fontSize: size[1] + 'px' }"
          class="card-text"
        >
          <slot />
        </div>
      </div>
      <div
        class="card-brand"
        contenteditable="true"
        :style="{ color: colors.tip, fontSize: size[0] + 'px' }"
      >
        {{ tip }}
      </div>
    </div>
    <div class="card-logo">
      <img :src="logo" class="card-image" />
    </div>
  </section>
</template>

<script>
import { Colors } from '../util/Format';

export default {
  name: "Card",
  props: {
    tip: String,
    colors: { type: Object, default: () => Colors },
    logo: { type: String, default: "/images/candy.png" },
    size: Array,
    fontface: { type: String, default: "Roboto, sans-serif" },
  },
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
  max-width: 100%;
  max-height: 40px;
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
