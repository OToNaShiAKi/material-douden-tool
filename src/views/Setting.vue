<template>
  <section>
    <Pack>配置项</Pack>
    <v-chip-group :max="-1" column color="primary">
      <v-chip
        v-for="(v, i) of fixes"
        close
        outlined
        @click:close="remove(i)"
        close-icon="mdi-delete"
        :value="v.prefix"
        :key="v.prefix"
      >
        {{ v.prefix + v.suffix }}
      </v-chip>
    </v-chip-group>
    <section class="d-flex">
      <v-text-field class="mr-3" v-model="prefix" label="前缀" />
      <v-text-field v-model="suffix" label="后缀" />
    </section>
    <v-btn
      :disabled="!(prefix && suffix)"
      outlined
      small
      color="primary"
      @click="add"
    >
      添加
    </v-btn>
  </section>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import Pack from "../components/Pack.vue";
import { ChangeFixes } from "../store/mutations";

export default {
  name: "Setting",
  components: { Pack },
  data: () => ({ prefix: "", suffix: "" }),
  computed: { ...mapState(["fixes"]) },
  methods: {
    ...mapMutations([ChangeFixes.name]),
    add() {
      this.fixes.push({ prefix: this.prefix, suffix: this.suffix });
      this.ChangeFixes(this.fixes);
      this.prefix = "";
      this.suffix = "";
    },
    remove(index) {
      this.fixes.splice(index, 1);
      this.ChangeFixes(this.fixes);
    },
  },
};
</script>
