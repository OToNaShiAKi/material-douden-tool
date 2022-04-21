<template>
  <v-container>
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
  </v-container>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "Silent",
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
  methods: {
    async remove({ target: { dataset } }) {
      const { value, id } = this.silents[dataset.key];
      const result = await ipcRenderer.invoke("RemoveSilentUser", id, +value);
      if (result) this.silents.splice(dataset.key, 1);
    },
    async query() {
      this.loading = true;
      const rooms = JSON.parse(localStorage.getItem("rooms"));
      const result = await ipcRenderer.invoke("GetSilentUser", rooms);
      this.silents = result;
      this.loading = false;
    },
  },
};
</script>
