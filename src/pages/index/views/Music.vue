<template>
  <section>
    <Pack>歌词获取</Pack>
    <v-text-field
      append-icon="mdi-magnify"
      class="fix-input"
      hint="自动过滤无词无轴"
      label="关键词"
      v-model.trim="keyword"
      solo
      :error-messages="message"
      dense
    >
      <template v-slot:prepend-inner>
        <v-select
          return-object
          v-model="fix"
          :items="fixes"
          dense
          solo
          hide-details
        />
      </template>
    </v-text-field>
    <v-tabs-items v-model="tab">
      <v-tab-item value="table">
        <DataTable :headers="headers" :items="musics" :loading="loading">
          <template v-slot="{ item }">
            <v-icon small @click.stop="aegisub" :data-key="item.id">
              mdi-auto-fix
            </v-icon>
          </template>
        </DataTable>
      </v-tab-item>
      <v-tab-item value="lyric" class="d-flex flex-column align-center">
        <v-btn-toggle
          color="primary"
          id="lyric-control"
          rounded
          dense
          class="align-center"
        >
          <v-btn icon>
            <v-icon small>mdi-redo-variant</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon small>mdi-rewind-5</v-icon>
          </v-btn>
          <v-btn icon large class="rounded-circle">
            <v-icon color="primary">{{
              active ? "mdi-pause" : "mdi-play"
            }}</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon small>mdi-fast-forward-5</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon>mdi-chevron-double-down</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script>
import DataTable from "../../../components/DataTable.vue";
import Pack from "../../../components/Pack.vue";

export default {
  name: "Music",
  components: { Pack, DataTable },
  data: ({ $store: { state } }) => ({
    keyword: "",
    headers: [
      { text: "歌名", value: "name" },
      { text: "歌手", value: "singer" },
      { text: "语言", value: "language", sortable: false },
      { text: "导出", value: "action", sortable: false },
    ],
    musics: [],
    loading: false,
    tab: "lyric",
    active: false,
    fix: state.fixes.find(
      ({ prefix, scope }) => prefix === "【♪" && scope !== "同传"
    ),
    message: "",
    language: undefined,
  }),
  computed: {
    fixes: ({ $store: { state } }) =>
      state.fixes.filter((v) => v.scope !== "同传"),
  },
};
</script>
