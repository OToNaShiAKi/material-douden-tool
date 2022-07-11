<template>
  <section>
    <Pack>屏蔽词</Pack>
    <v-data-table :items-per-page="5" :items="shields" :headers="headers">
      <template v-slot:item.actions="{ item }">
        <v-icon small @click="remove" :data-key="item.shield">
          mdi-delete
        </v-icon>
      </template>
    </v-data-table>
    <section class="d-flex align-center">
      <v-text-field class="mr-3" v-model="shield" label="屏蔽词" />
      <v-text-field class="mr-3" v-model="handle" label="处理后" />
      <v-btn :disabled="!shield" outlined small color="primary" @click="add">
        添加
      </v-btn>
    </section>
    <p class="caption">被屏蔽弹幕记录保存在安装目录下的forbidden-words.txt中</p>
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
      this.ChangeShields(this.shields);
    },
    remove({ target: { dataset } }) {
      const shields = this.shields.filter(
        (item) => item.shield !== dataset.key
      );
      this.ChangeShields(shields);
    },
  },
};
</script>
