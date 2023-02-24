<template>
  <v-avatar class="honour-avatar" :size="size">
    <v-img :src="avatar">
      <template v-slot:placeholder>
        <v-icon>mdi-account-cancel</v-icon>
      </template>
    </v-img>
  </v-avatar>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "HonourAvatar",
  computed: { ...mapState(["avatar"]) },
  props: { size: { type: Number, default: 48 } },
};
</script>
