<template>
  <v-container class="fix-input">
    <v-combobox
      v-model.trim="keyword"
      solo
      dense
      no-filter
      clearable
      @keyup.enter="Search"
      :items="items"
      :loading="search"
      prepend-icon="mdi-magnify"
      hint="可通过昵称关键字、UID回车搜索用户"
    >
      <template v-slot:prepend-inner>
        <v-select
          return-object
          dense
          solo
          hide-details
          v-model="select"
          :items="rooms"
        >
          <template v-slot:item="{ item, on, attrs }">
            <v-list-item v-on="on" dense v-bind="attrs">
              <v-list-item-avatar>
                <v-img referrepolicy="no-referrer" :src="item.avatar" />
              </v-list-item-avatar>
              <v-list-item-title>{{ item.text }}</v-list-item-title>
            </v-list-item>
          </template>
          <template v-slot:prepend-inner>
            <v-avatar size="32">
              <v-img :src="select.avatar" />
            </v-avatar>
          </template>
        </v-select>
      </template>
      <template v-slot:append-outer>
        <v-btn
          small
          icon
          color="primary"
          :disabled="
            !(keyword && /^\d+$/.test(keyword.uid)) ||
            !(select && /^\d+$/.test(select.value))
          "
          @click="Add"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </template>
      <template v-slot:item="{ item, on, attrs }">
        <v-list-item v-bind="attrs" v-on="on">
          <v-list-item-avatar>
            <v-img referrepolicy="no-referrer" :src="item.avatar" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
            <v-list-item-subtitle>
              UID:{{ item.uid }} LiveID:{{ item.value }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-combobox>
    <DataTable
      :headers="headers"
      :items="silents"
      :loading="loading"
      :perpage="20"
    >
      <template v-slot="{ item }">
        <v-icon small @click="Remove" :data-key="item.id">mdi-delete</v-icon>
      </template>
    </DataTable>
    <v-btn icon class="float-right" color="primary" @click="Query">
      <v-icon>mdi-refresh</v-icon>
    </v-btn>
  </v-container>
</template>

<script>
import { ipcRenderer } from "electron";
import DataTable from "../../../components/DataTable.vue";

export default {
  components: { DataTable },
  name: "Silent",
  data: () => ({
    silents: [],
    headers: [
      { text: "UID", value: "tuid" },
      { text: "昵称", value: "tname" },
      { text: "直播间", value: "text" },
      { text: "时间", value: "ctime" },
      { text: "执行人", value: "executor" },
      { text: "操作", value: "actions", sortable: false },
    ],
    loading: true,
    rooms: [],
    keyword: "",
    items: [],
    search: false,
    select: "",
  }),
  created() {
    this.Query();
  },
  methods: {
    async Query() {
      this.loading = true;
      let rooms = JSON.parse(localStorage.getItem("rooms"));
      const info = await ipcRenderer.invoke("GetUserRoomInfo", rooms);
      rooms = rooms.filter(
        (item, index) => info[index].admin || info[index].uid === item.uid
      );
      this.rooms = rooms;
      this.silents = await ipcRenderer.invoke("GetSilentUser", rooms);
      this.loading = false;
    },
    async Remove({ target: { dataset } }) {
      const find = this.silents.find((item) => item.id == dataset.key);
      const result = await ipcRenderer.invoke(
        "RemoveSilentUser",
        find.id,
        +find.value
      );
      if (result) this.silents = this.silents.filter((item) => item !== find);
    },
    async Search() {
      this.search = true;
      this.items = await ipcRenderer.invoke("SearchUser", this.keyword);
      this.search = false;
    },
    async Add() {
      const result = await ipcRenderer.invoke(
        "SilentUser",
        this.keyword.uid,
        this.select.value
      );
      if (result) {
        this.loading = true;
        this.silents = await ipcRenderer.invoke("GetSilentUser", this.rooms);
        this.loading = false;
      }
    },
  },
};
</script>
