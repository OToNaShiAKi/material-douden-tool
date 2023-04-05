<template>
  <v-avatar class="honour-avatar" :size="size">
    <v-img :src="avatar" content-class="relative">
      <template v-slot:placeholder>
        <v-icon>mdi-account-cancel</v-icon>
      </template>
    </v-img>
    <img
      v-if="sponsor"
      src="/images/badge.png"
      class="badge"
      :style="{ width: badge, height: badge }"
    />
  </v-avatar>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "HonourAvatar",
  computed: { ...mapState(["avatar", "sponsor"]) },
  props: {
    size: { type: Number, default: 48 },
    badge: { type: String, default: "200px" },
  },
};
</script>

<style>
.badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -48%);
  pointer-events: none;
  z-index: 100;
  border-radius: 0px !important;
}
.v-avatar.honour-avatar {
  overflow: visible !important;
}
</style>
