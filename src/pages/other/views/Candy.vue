<template>
  <v-container>
    <v-radio-group row v-model="direction">
      <v-radio label="横排" value="row" />
      <v-radio label="竖排" value="column" />
      <v-radio label="反向横排" value="row-reverse" />
      <v-radio label="反向竖排" value="column-reverse" />
    </v-radio-group>
    <section class="d-flex">
      <section
        id="dom-to-image-merge"
        class="d-flex"
        :class="`flex-${direction}`"
      >
        <Card id="dom-to-image-jp">マシュマロ</Card>
        <Card id="dom-to-image-cn">棉花糖</Card>
      </section>
    </section>
    <section class="my-3">
      <v-btn outlined color="primary" small @click="merge" data-type="cn">
        导出中文
      </v-btn>
      <v-btn
        small
        outlined
        color="primary"
        class="mx-3"
        @click="merge"
        data-type="jp"
      >
        导出日语
      </v-btn>
      <v-btn outlined small color="primary" @click="merge" data-type="merge">
        合并导出
      </v-btn>
    </section>
  </v-container>
</template>

<script>
import { ipcRenderer } from "electron";
import Card from "../../../components/Card.vue";
import HtmlToCanvas from "html2canvas";

const ExportImage = async (Dom) => {
  const canvas = await HtmlToCanvas(Dom);
  const Base64 = canvas
    .toDataURL()
    .replace(/^data:image\/(png|gif|jpeg);base64,/, "");
  ipcRenderer.send("SaveImage", Base64);
};

export default {
  name: "App",
  components: { Card },
  data: () => ({
    direction: "column",
    items: [{ title: "棉花糖", icon: "mdi-candy", to: "/" }],
  }),
  methods: {
    merge({ target }) {
      const type = target.dataset.type || target.parentElement.dataset.type;
      const Dom = document.getElementById(`dom-to-image-${type}`);
      ExportImage(Dom);
    },
  },
};
</script>
