<template>
  <section>
    <Pack>屏蔽词</Pack>
    <v-data-table :items="shields" :headers="headers">
      <template v-slot:item.actions="{ index }">
        <v-icon small @click="remove" :data-key="index"> mdi-delete </v-icon>
      </template>
    </v-data-table>
    <section class="d-flex align-center">
      <v-text-field class="mr-3" v-model="shield" label="屏蔽词" />
      <v-text-field class="mr-3" v-model="handle" label="处理后" />
      <v-btn
        :disabled="!(shield && handle)"
        outlined
        small
        color="primary"
        @click="add"
      >
        添加
      </v-btn>
    </section>
  </section>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import Pack from "../../../components/Pack.vue";

export default {
  name: "Shield",
  components: { Pack },
  data: () => ({
    headers: [
      { text: "屏蔽词", value: "shield" },
      { text: "处理后", value: "handle" },
      { text: "操作", value: "actions", sortable: false },
    ],
    shield: "",
    handle: "",
  }),
  computed: { ...mapState(["shields"]) },
  methods: {
    ...mapMutations(["ChangeShields"]),
    add() {
      this.shields.push({
        shield: this.shield,
        handle: this.handle,
      });
      this.shield = "";
      this.handle = "";
      this.ChangeShields(this.shields);
    },
    remove(index) {
      this.shields.splice(index, 1);
      this.ChangeShields(this.shields);
    },
  },
};
</script>
