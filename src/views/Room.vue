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
        :disabled="!cookie"
        outlined
        @click:close="remove(i)"
        close-icon="mdi-delete"
        :value="v.roomid"
        :key="v.roomid"
      >
        {{ v.name }}
      </v-chip>
    </v-chip-group>
    <v-switch @change="ChangeSelect" v-model="multiple" inset label="多选" />
    <section class="d-flex align-center">
      <v-text-field class="mr-3" v-model="roomid" label="房间号" />
      <v-text-field class="mr-3" v-model="name" label="名称" />
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
  </section>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import Pack from "../components/Pack.vue";
import { ChangeSelect } from "../store/mutations";

export default {
  name: "Colors",
  components: { Pack },
  data: ({ $store: { state } }) => ({
    multiple: state.select.length > 1,
    rooms: JSON.parse(localStorage.getItem("rooms")) || [],
    roomid: "",
    name: "",
  }),
  computed: {
    ...mapState(["cookie"]),
    select() {
      const select = this.$store.state.select || [];
      return this.multiple ? select : select[0];
    },
  },
  methods: {
    ...mapMutations([ChangeSelect.name]),
    add() {
      this.rooms.push({ roomid: this.roomid, name: this.name });
      this.ChangeSelect(
        this.multiple ? [...this.select, this.roomid] : [this.roomid]
      );
      this.roomid = "";
      this.name = "";
      localStorage.setItem("rooms", JSON.stringify(this.rooms));
    },
    remove(index) {
      this.rooms.splice(index, 1);
      localStorage.setItem("rooms", JSON.stringify(this.rooms));
    },
  },
};
</script>
