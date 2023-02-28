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
      dense
      @keypress.enter="Search"
      @click:append="Search"
      :error-messages="message"
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
        <v-data-table
          no-data-text=""
          :items-per-page="5"
          :page.sync="page"
          hide-default-footer
          :headers="headers"
          :items="musics"
          :loading="loading"
          @click:row="Select"
        >
          <template v-slot:[`item.actions`]="{ item }">
            <v-icon
              small
              @click.stop="Aegisub"
              v-if="item.origin !== 'local'"
              :data-key="item.id"
            >
              {{
                /\[\d+,\d+\]\(\d+,\d+,\d+\)/.test(item.ylyric)
                  ? "mdi-arrow-decision-auto"
                  : "mdi-arrow-decision"
              }}
            </v-icon>
          </template>
          <template v-slot:[`item.avatar`]="{ value }">
            <v-avatar rounded="rounded" size="32">
              <v-img :src="value" />
            </v-avatar>
          </template>
          <template v-slot:footer="{ props: { pagination } }">
            <v-pagination
              circle
              class="my-3"
              v-model="page"
              :length="pagination.pageCount"
            />
          </template>
        </v-data-table>
        <p class="caption px-3 mb-0">
          <v-icon small>mdi-arrow-decision-auto</v-icon>:包含K轴
          <v-icon small>mdi-arrow-decision</v-icon>:不包含k轴
        </p>
      </v-tab-item>
      <v-tab-item value="lyric" class="lyric-control">
        <v-btn-toggle color="primary" rounded dense class="align-center">
          <v-btn icon class="rounded-r" @click="Reset">
            <v-icon small>mdi-redo-variant</v-icon>
          </v-btn>
          <v-btn
            icon
            class="rounded"
            :disabled="!active"
            @click="() => Track(-1)"
          >
            <v-icon small>mdi-rewind-5</v-icon>
          </v-btn>
          <v-btn icon large class="rounded-circle" @click="Play">
            <v-icon color="primary">
              {{ active ? "mdi-pause" : "mdi-play" }}
            </v-icon>
          </v-btn>
          <v-btn
            icon
            class="rounded"
            :disabled="!active"
            @click="() => Track(1)"
          >
            <v-icon small>mdi-fast-forward-5</v-icon>
          </v-btn>
          <v-btn icon class="rounded-l" @click="Next">
            <v-icon small>mdi-chevron-double-down</v-icon>
          </v-btn>
        </v-btn-toggle>
        <v-btn-toggle
          v-model="language"
          color="primary"
          dense
          mandatory
          class="mt-3 float-right"
        >
          <v-btn icon value="text" small class="rounded">
            <v-icon small>mdi-ideogram-cjk-variant</v-icon>
          </v-btn>
          <v-btn
            v-show="translate"
            icon
            value="translate"
            small
            class="rounded"
          >
            <v-icon small>mdi-translate</v-icon>
          </v-btn>
          <v-btn
            v-show="translate"
            icon
            value="translate&text"
            small
            class="rounded"
          >
            <v-icon small>mdi-translate-variant</v-icon>
          </v-btn>
        </v-btn-toggle>
        <section class="relative">
          <v-virtual-scroll
            height="320"
            item-height="64"
            :items="[{}, {}, ...lyrics, {}, {}]"
            bench="1"
            ref="lyric"
            class="mt-3"
          >
            <template v-slot="{ item, index }">
              <p
                class="rounded px-3 py-2 ma-0"
                :class="{ 'primary--text lyric-content': index === stamp + 2 }"
                :key="item.stamp"
              >
                <span class="text-body-1">{{ item.lyric }}</span>
                <br />
                <span class="text-body-2">{{ item.tlyric }}</span>
              </p>
            </template>
          </v-virtual-scroll>
          <v-btn
            color="primary"
            absolute
            right
            class="step-button"
            icon
            small
            @click="Skip"
          >
            <v-icon small>mdi-debug-step-over</v-icon>
          </v-btn>
        </section>
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script>
import { GetLocalData } from "../../../plugins/indexedDB";
import Pack from "../../../components/Pack.vue";
import { ipcRenderer } from "electron";
import { mapMutations, mapState } from "vuex";
import GoTo from "vuetify/lib/services/goto";
import { SendComment } from "../../../util/SendComment";

export default {
  name: "Music",
  components: { Pack },
  data: ({ $store: { state } }) => ({
    keyword: "",
    headers: [
      { text: "封面", value: "avatar", sortable: false },
      { text: "歌名", value: "name", class: "text-truncate" },
      { text: "歌手", value: "singer" },
      { text: "语言", value: "language", sortable: false },
      { text: "导出", value: "actions", sortable: false },
    ],
    musics: [],
    loading: false,
    tab: "table",
    active: false,
    fix: state.fixes.find(
      ({ prefix, scope }) => prefix === "【♪" && scope !== "同传"
    ),
    message: "",
    language: "translate",
    page: 1,
  }),
  computed: {
    ...mapState(["select", "shields", "stamp"]),
    fixes: ({ $store: { state } }) =>
      state.fixes.filter((v) => v.scope !== "同传"),
    lyrics: ({ $store: { state } }) => state.song.stamps || [],
    translate: ({ $store: { state } }) => state.song.tlyric,
  },
  methods: {
    ...mapMutations(["ChangeSong"]),
    async Search() {
      if (this.keyword.length <= 0) {
        this.message = "关键词不可为空";
        return;
      }
      this.loading = true;
      this.tab = "table";
      this.message = "";
      const result = await Promise.all([
        GetLocalData("music", this.keyword),
        ipcRenderer.invoke("GetMusic", this.keyword),
      ]);
      this.musics = result[0].concat(result[1]);
      this.loading = false;
    },
    Aegisub({ target: { dataset } }) {
      const music = this.musics.find(({ id }) => id == dataset.key);
      ipcRenderer.send("Channel", "ConvertLyric", music, true);
    },
    Select(item) {
      this.tab = "lyric";
      this.ChangeSong({ song: item });
      this.language = item.tlyric ? this.language : "text";
      this.Reset();
    },
    Play() {
      this.active = !this.active;
      if (this.active) this.Send(this.stamp + 1);
      else clearTimeout(this.Send.timer);
    },
    Reset() {
      clearTimeout(this.Send.timer);
      this.Send.timer = null;
      if (this.$refs.lyric) {
        GoTo(0, {
          container: this.$refs.lyric,
          easing: "easeInOutCubic",
        });
      }
      this.ChangeSong({ song: this.$store.state.song });
      this.active = false;
    },
    Send(index) {
      if (/translate/.test(this.language) && this.lyrics[index].tlyric) {
        SendComment(
          this.lyrics[index].tlyric,
          this.select,
          this.fix,
          this.shields
        );
      }
      if (/text/.test(this.language) && this.lyrics[index].lyric) {
        SendComment(
          this.lyrics[index].lyric,
          this.select,
          this.fix,
          this.shields
        );
      }
      this.ChangeSong({ stamp: index });
      this.Send.stamp = Date.now();
      GoTo(index * 64 + 128, {
        container: this.$refs.lyric,
        offset: 96,
        easing: "easeInOutCubic",
      });
      if (index === this.lyrics.length - 1) {
        this.Reset();
        return;
      }
      if (this.active) {
        clearTimeout(this.Send.timer);
        this.Send.timer = setTimeout(() => {
          clearTimeout(this.Send.timer);
          this.Send(index + 1);
        }, this.lyrics[index + 1].stamp - this.lyrics[index].stamp);
      }
    },
    Next() {
      clearTimeout(this.Send.timer);
      this.Send(this.stamp + 1);
    },
    Skip() {
      clearTimeout(this.Send.timer);
      const target = this.$refs.lyric.$el;
      const count = Math.floor(
        (target.scrollTop + target.clientHeight / 2) / 64
      );
      this.active = true;
      this.Send(count - 2);
    },
    Track(multiple) {
      const now = Date.now();
      clearTimeout(this.Send.timer);
      let time =
        this.lyrics[this.stamp + 1].stamp - this.lyrics[this.stamp].stamp;
      time -= now - this.Send.stamp - 500 * multiple;
      this.Send.stamp -= 500 * multiple;
      this.Send.timer = setTimeout(() => {
        clearTimeout(this.Send.timer);
        this.Send(this.stamp + 1);
      }, time);
    },
  },
};
</script>

<style>
.lyric-control .relative::before {
  content: "";
  position: absolute;
  top: 128px;
  left: 0;
  width: 100%;
  height: 64px;
  border-radius: 4px;
}
.lyric-control .relative .step-button {
  top: 50%;
  transform: translateY(-50%);
}
</style>
