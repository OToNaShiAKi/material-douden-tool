<template>
  <section>
    <Pack>选择房间</Pack>
    <v-chip-group
      column
      :multiple="multiple"
      color="primary"
      @change="ChangeSelect"
      :value="select"
    >
      <v-chip
        v-for="(v, i) of rooms"
        close
        outlined
        @click:close="remove(i)"
        close-icon="mdi-delete"
        :value="v.value"
        :key="v.value"
      >
        {{ v.text }}
      </v-chip>
    </v-chip-group>
    <v-switch
      hide-details
      class="ml-1"
      @change="ChangeSelect"
      v-model="multiple"
      inset
      label="多选"
    />
    <section class="d-flex align-center">
      <v-text-field class="mr-3" v-model.trim="roomid" label="房间号" />
      <v-text-field class="mr-3" v-model.trim="name" label="名称" />
      <v-btn
        :disabled="!(roomid && name)"
        outlined
        small
        color="primary"
        @click="add"
      >
        添加
      </v-btn>
    </section>
    <section class="d-flex align-center">
      <v-select class="mr-3" :items="rooms" v-model="id" label="房间" />
      <v-select
        class="mr-3"
        :items="modes[id].colors"
        v-model="modes[id].color"
        label="颜色"
      />
      <v-select
        class="mr-3"
        :items="modes[id].modes"
        v-model="modes[id].mode"
        label="模式"
      />
      <v-btn
        :disabled="!(id && modes[id].color && modes[id].mode)"
        outlined
        small
        color="primary"
        @click="choose"
      >
        提交
      </v-btn>
    </section>
    <v-chip-group column color="primary" @change="change" v-model="medal">
      <v-chip v-for="v of medals" outlined :value="v.value" :key="v.value">
        {{ v.medal_name }}
      </v-chip>
    </v-chip-group>
  </section>
</template>

<script>
import { ipcRenderer } from "electron";
import { mapMutations, mapState } from "vuex";
import Pack from "../../../components/Pack.vue";
import { FormatComment } from "../../../plugins/utils";
import Socket from "../../../plugins/socket";

export default {
  name: "Room",
  components: { Pack },
  data: ({ $store: { state } }) => ({
    multiple: state.select.length > 1,
    roomid: "",
    name: "",
    id: "",
    modes: { "": { colors: [], modes: [] } },
    medals: [],
    medal: null,
  }),
  computed: {
    ...mapState(["rooms"]),
    select: ({ $store: { state }, multiple }) =>
      multiple ? state.select : state.select[0],
  },
  watch: {
    select() {
      const { select = [] } = this.$store.state;
      if (Socket.AutoChangeMedal) {
        let chose = null;
        loop: for (const item of select) {
          for (const medal of this.medals) {
            if (item === medal.roomid) {
              chose = medal.value;
              break loop;
            }
          }
        }
        this.medal = chose;
        this.change(chose);
      }
    },
  },
  async created() {
    const uid = this.$store.state.cookie.match(/DedeUserID=([^;]+);/);
    const [medals, ...modes] = await Promise.all([
      ipcRenderer.invoke("MedalWall", uid[1]),
      ...this.rooms.map(({ value }) =>
        ipcRenderer.invoke("GetUserRoomMode", value)
      ),
    ]);
    for (const item of modes) {
      this.modes[item.roomid] = item;
      FormatComment.CommentLength[item.roomid] = item.length;
    }
    this.medals = medals;
    for (const item of this.medals) {
      if (item.wearing_status) {
        this.medal = item.value;
        break;
      }
    }
  },
  methods: {
    ...mapMutations(["ChangeSelect", "ChangeRooms", "Notify"]),
    async add() {
      const { code = 0 } = await ipcRenderer.invoke("TrackLive", this.roomid);
      if (code !== 0) {
        return this.Notify(`房间${this.roomid}不存在`);
      } else if (this.rooms.find(({ value }) => value == this.roomid)) {
        return this.Notify(`房间${this.roomid}已添加`);
      }
      const result = await ipcRenderer.invoke("GetUserRoomMode", this.roomid);
      this.modes[result.roomid] = result;
      this.rooms.push({ value: this.roomid, text: this.name });
      this.ChangeRooms(this.rooms);
      this.roomid = "";
      this.name = "";
      FormatComment.CommentLength[result.roomid] = result.length;
    },
    remove(index) {
      this.rooms.splice(index, 1);
      this.ChangeRooms(this.rooms);
    },
    async choose() {
      const { mode, color } = this.modes[this.id];
      const result = await ipcRenderer.invoke(
        "SetUserRoomMode",
        this.id,
        "0x" + color,
        mode
      );
      this.Notify(`房间${this.id}设置${result ? "成功" : "失败"}`);
    },
    change(value) {
      this.medal = value;
      ipcRenderer.send("ChangeMedal", value);
    },
  },
};
</script>
