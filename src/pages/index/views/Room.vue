<template>
  <section>
    <Pack>配置房间</Pack>
    <v-combobox
      class="fix-input"
      v-model.trim="keyword"
      solo
      dense
      no-filter
      @keyup.enter="Search"
      :loading="loading"
      :items="items"
      hint="左侧按钮开启联动；通过LiveID、UID、昵称关键字回车搜索"
      prepend-inner-icon="mdi-magnify"
    >
      <template v-slot:prepend>
        <v-btn
          :color="multiple ? 'primary' : undefined"
          class="align-self-center"
          small
          @click="ChangeMultiple"
          icon
        >
          <v-icon small>{{ multiple ? "mdi-check-all" : "mdi-check" }}</v-icon>
        </v-btn>
      </template>
      <template v-slot:append-outer>
        <v-btn
          small
          icon
          color="primary"
          :disabled="keyword && !/^\d+$/.test(keyword.value)"
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
            <v-list-item-title v-html="item.name || item.text" />
            <v-list-item-subtitle>
              UID:{{ item.uid }} LiveID:{{ item.value }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action class="flex-row align-center">
            <v-img
              v-if="item.live_status"
              class="mr-1 primary rounded-circle living-border"
              width="18"
              src="//s1.hdslb.com/bfs/static/jinkela/space/assets/live.gif"
            />
            <v-list-item-action-text>
              Fans:{{ item.follower }}
            </v-list-item-action-text>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-combobox>
    <v-chip-group
      color="primary"
      column
      :value="select"
      :multiple="multiple"
      @change="ChangeSelect"
    >
      <v-chip
        @click:close="() => Remove(v)"
        pill
        v-for="v of rooms"
        close
        :key="v.value"
        :value="v.value"
      >
        <v-avatar left>
          <v-img :src="v.avatar" />
        </v-avatar>
        {{ v.text }}
      </v-chip>
    </v-chip-group>
    <v-subheader>弹幕配置</v-subheader>
    <section class="fix-input d-flex align-center">
      <v-select
        hide-details
        solo
        dense
        class="mr-3"
        :items="rooms"
        v-model="roomid"
        return-object
      />
      <v-select
        hide-details
        solo
        dense
        class="mr-3"
        :items="roomid.colors"
        v-model="roomid.color"
      />
      <v-select
        hide-details
        solo
        dense
        class="mr-3"
        :items="roomid.modes"
        v-model="roomid.mode"
      />
      <v-btn small :disabled="!roomid" icon color="primary" @click="Upload">
        <v-icon>mdi-progress-upload</v-icon>
      </v-btn>
    </section>
    <v-subheader>粉丝牌</v-subheader>
    <v-chip-group @change="ChangeMedal" color="primary" column v-model="medal">
      <v-chip
        label
        class="rounded-l-xl medal-image"
        pill
        small
        v-for="v of medals"
        :key="v.value"
        :value="v.value"
      >
        <v-avatar size="24" left>
          <v-img :src="v.avatar" />
        </v-avatar>
        <span class="medal-title mx-2">{{ v.medal_name }}</span>
        <span :style="{ color: v.color }" class="rounded-circle medal-border">
          {{ v.level }}
        </span>
      </v-chip>
    </v-chip-group>
  </section>
</template>

<script>
import { ipcRenderer } from "electron";
import Pack from "../../../components/Pack.vue";
import { mapMutations, mapState } from "vuex";
import { CommentLength } from "../../../util/client";
import Socket from "../../../plugins/socket";

export default {
  name: "Room",
  components: { Pack },
  data: ({ $store: { state } }) => ({
    multiple: state.select.length > 1,
    keyword: "",
    items: [],
    loading: false,
    headers: [],
    roomid: "",
    medals: [],
    medal: null,
  }),
  computed: {
    ...mapState(["rooms"]),
    select: ({ $store: { state }, multiple }) =>
      multiple ? state.select : state.select[0],
  },
  async created() {
    const uid = this.$store.state.cookie.match(/DedeUserID=([^;]+);/);
    this.medals = await ipcRenderer.invoke("GetMedalWall", uid[1]);
    for (const item of this.medals) {
      if (item.wearing_status) {
        this.medal = item.value;
        break;
      }
    }
    this.items = await ipcRenderer.invoke("GetFollowLive");
    const modes = await Promise.all(
      this.rooms.map(({ value }) =>
        ipcRenderer.invoke("GetUserRoomMode", value)
      )
    );
    for (const index in modes) {
      this.rooms[index].color = modes[index].color;
      this.rooms[index].colors = modes[index].colors;
      this.rooms[index].mode = modes[index].mode;
      this.rooms[index].modes = modes[index].modes;
      CommentLength[modes[index].roomid] = modes[index].length;
    }
  },
  watch: {
    select() {
      const { select = [] } = this.$store.state;
      if (Socket.AutoChangeMedal) {
        let selected = null;
        for (const v of select) {
          const { uid } = this.rooms.find(({ value }) => value === v);
          const item = this.medals.find(({ target_id }) => target_id === uid);
          selected = item && item.value;
        }
        this.ChangeMedal(selected);
      }
    },
  },
  methods: {
    ...mapMutations(["ChangeSelect", "ChangeConfig", "Notify"]),
    async Search() {
      this.loading = true;
      this.items = await ipcRenderer.invoke("SearchLive", this.keyword);
      this.loading = false;
    },
    async Add() {
      let find = this.rooms.find((item) => item.value === this.keyword.value);
      if (find) {
        find.text = this.keyword.text;
        find.avatar = this.keyword.avatar;
      } else {
        find = {
          value: this.keyword.value,
          text: this.keyword.text,
          uid: this.keyword.uid,
          avatar: this.keyword.avatar,
        };
        this.rooms.push(find);
      }
      const result = await ipcRenderer.invoke("GetUserRoomMode", this.roomid);
      CommentLength[result.roomid] = result.length;
      find.modes = result.modes;
      find.mode = result.mode;
      find.colors = result.colors;
      find.color = result.color;
      this.ChangeConfig({ key: "rooms", config: this.rooms });
    },
    ChangeMultiple() {
      this.multiple = !this.multiple;
      this.ChangeSelect(this.multiple ? [this.select[0]] : [this.select]);
    },
    Remove(item) {
      const rooms = this.rooms.filter((v) => v !== item);
      this.ChangeConfig({ key: "rooms", config: rooms });
      this.keyword = null;
    },
    async Upload() {
      const { mode, color, value, text } = this.roomid;
      const result = await ipcRenderer.invoke(
        "SetUserRoomMode",
        value,
        "0x" + color,
        mode
      );
      this.Notify(`房间 ${text} 设置${result ? "成功" : "失败"}`);
    },
    ChangeMedal(value) {
      this.medal = value;
      ipcRenderer.send("ChangeMedal", value);
    },
  },
};
</script>

<style>
em.keyword {
  font-style: normal !important;
  color: var(--v-primary-base);
}
.v-autocomplete__content {
  margin-top: 28px;
}
.living-border {
  border-width: 3px;
  border-color: var(--v-primary-base);
  border-style: solid;
}
.medal-border {
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
}
.medal-title {
  width: 36px;
}
.medal-image.v-chip--pill .v-avatar {
  width: 24px !important;
  height: 24px !important;
}
</style>