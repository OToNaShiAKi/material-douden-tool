<template>
  <v-container>
    <v-data-table :loading="loading" :items="silents" :headers="headers">
      <template v-slot:item.actions="{ item }">
        <v-icon small @click="remove" :data-key="item.id">mdi-delete</v-icon>
      </template>
    </v-data-table>
    <v-btn fab outlined small right fixed color="primary" @click="query">
      <v-icon>mdi-refresh</v-icon>
    </v-btn>
  </v-container>
</template>

<script>
import { ipcRenderer } from "electron";
import { mapMutations } from "vuex";

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
    ...mapMutations(["Notify"]),
    async remove({ target: { dataset } }) {
      const find = this.silents.find((item) => item.id == dataset.key);
      const result = await ipcRenderer.invoke(
        "RemoveSilentUser",
        find.id,
        +find.value
      );
      if (result) this.silents = this.silents.filter((item) => item !== find);
      else this.Notify(`删除用户失败${find.id}失败`);
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
