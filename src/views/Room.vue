<template>
  <section class="px-3 pb-3">
    <Pack>选择房间</Pack>
    <v-chip-group column :multiple="multiple" color="primary" v-model="select">
      <v-chip
        v-for="(v, i) of rooms"
        close
        outlined
        @click:close="remove(i)"
        close-icon="mdi-delete"
        :value="v.roomid"
        :key="v.roomid"
      >
        {{ v.name }}
      </v-chip>
    </v-chip-group>
    <v-switch v-model="multiple" inset label="多选" />
    <section class="d-flex">
      <v-text-field class="mr-3" v-model="roomid" label="房间号" />
      <v-text-field v-model="name" label="名称" />
    </section>
    <v-btn
      :disabled="!(roomid && name)"
      outlined
      small
      color="primary"
      class="float-right"
      @click="add"
    >
      添加
    </v-btn>
  </section>
</template>

<script>
import { mapMutations } from "vuex";
import Pack from "../components/Pack.vue";
import { ChangeSelect } from "../store/mutations";

export default {
  name: "Colors",
  components: { Pack },
  data: () => ({
    multiple: false,
    rooms: JSON.parse(localStorage.getItem("rooms")) || [],
    roomid: "",
    name: "",
  }),
  computed: {
    select: {
      get() {
        const select = this.$store.state.select || [];
        return this.multiple ? select : select[0];
      },
      set(value) {
        const select = Array.isArray(value) ? value : value ? [value] : [];
        localStorage.setItem("select", select);
        this.ChangeSelect(select);
      },
    },
  },
  methods: {
    ...mapMutations([ChangeSelect.name]),
    add() {
      this.rooms.push({ roomid: this.roomid, name: this.name });
      this.select = this.multiple ? [...this.select, this.roomid] : this.roomid;
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
