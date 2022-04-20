<template>
  <section>
    <Pack>禁言用户</Pack>
    <v-data-table :loading="loading" :items="silents" :headers="headers">
      <template v-slot:item.actions="{ index }">
        <v-icon small @click="remove" :data-key="index">mdi-delete</v-icon>
      </template>
    </v-data-table>
    <v-btn
      fab
      absolute
      outlined
      small
      right
      fixed
      color="primary"
      @click="query"
    >
      <v-icon>mdi-refresh</v-icon>
    </v-btn>
  </section>
</template>

<script>
import { ipcRenderer } from "electron";
import { mapState } from "vuex";
import Pack from "../../../components/Pack.vue";

export default {
  name: "Silent",
  components: { Pack },
  data: () => ({
    silents: [],
    headers: [
      { text: "被禁用户", value: "tname" },
      { text: "直播间", value: "text" },
      { text: "操作", value: "actions", sortable: false },
    ],
    loading: true,
  }),
  created() {
    this.query();
  },
  computed: { ...mapState(["rooms"]) },
  methods: {
    async remove({ target: { dataset } }) {
      const { value, id } = this.silents[dataset.key];
      const result = await ipcRenderer.invoke("RemoveSilentUser", id, +value);
      if (result) this.silents.splice(dataset.key, 1);
    },
    async query() {
      this.loading = true;
      const result = await ipcRenderer.invoke("GetSilentUser", this.rooms);
      this.silents = result;
      this.loading = false;
    },
  },
};
</script>
