<template>
  <v-subheader class="justify-space-between">
    <span><slot /></span>
    <v-btn icon @click="pack">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
  </v-subheader>
</template>

<script>
export default {
  name: "Pack",
  methods: {
    pack() {
      this.$router.replace("/");
    },
  },
};
</script>
