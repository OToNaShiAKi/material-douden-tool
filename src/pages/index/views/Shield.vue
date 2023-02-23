<template>
  <section>
    <Pack>屏蔽词</Pack>
    <DataTable :items="shields" :headers="headers">
      <template v-slot="{ item }">
        <v-icon small @click="Remove" :data-key="item.shield">
          mdi-delete
        </v-icon>
      </template>
    </DataTable>
    <section class="fix-input d-flex align-center">
      <v-text-field
        hide-details
        solo
        dense
        class="mr-3"
        v-model="shield"
        label="屏蔽词"
      />
      <v-text-field
        hide-details
        solo
        dense
        class="mr-3"
        v-model="handle"
        label="处理词"
      />
      <v-btn small :disabled="!shield" icon color="primary" @click="Add">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </section>
    <p class="caption mt-3 px-3 mb-0">
      被屏蔽弹幕记录保存在安装目录下的forbidden-words.txt中
    </p>
  </section>
</template>

<script>
import Pack from "../../../components/Pack.vue";
import DataTable from "../../../components/DataTable.vue";
import { mapMutations, mapState } from "vuex";

export default {
  name: "Shield",
  components: { Pack, DataTable },
  data: () => ({
    headers: [
      { text: "屏蔽词", value: "shield" },
      { text: "处理词", value: "handle" },
      { text: "操作", value: "actions", sortable: false },
    ],
    shield: "",
    handle: "",
  }),
  computed: { ...mapState(["shields"]) },
  methods: {
    ...mapMutations(["ChangeConfig"]),
    Add() {
      const find = this.shields.find((item) => item.shield === this.shield);
      if (!find) {
        this.shields.push({
          shield: this.shield,
          handle: this.handle,
        });
      } else {
        find.handle = this.handle;
      }
      this.shield = "";
      this.handle = "";
      this.ChangeConfig({ key: "shields", config: this.shields });
    },
    Remove({ target: { dataset } }) {
      const shields = this.shields.filter(
        (item) => item.shield !== dataset.key
      );
      this.ChangeConfig({ key: "shields", config: shields });
    },
  },
};
</script>
