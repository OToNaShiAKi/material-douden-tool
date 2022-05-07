<template>
  <v-container>
    <v-file-input
      label="上传Excel"
      hint="请确保文件中包含 中文 和 日文 的列标题"
      persistent-hint
      :loading="loading"
      v-model="file"
    />
    <section class="my-3" @click="read">
      <v-btn outlined color="primary" small data-type="cn"> 导出中文 </v-btn>
      <v-btn small outlined color="primary" class="mx-3" data-type="jp">
        导出日语
      </v-btn>
      <v-btn outlined small color="primary" data-type="merge"> 合并导出 </v-btn>
    </section>
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
        <Card id="dom-to-image-cn" tip="棉花糖" />
        <Card id="dom-to-image-jp" tip="マシュマロ" />
      </section>
    </section>
    <section class="my-3" @click="merge">
      <v-btn outlined color="primary" small data-type="cn"> 导出中文 </v-btn>
      <v-btn small outlined color="primary" class="mx-3" data-type="jp">
        导出日语
      </v-btn>
      <v-btn outlined small color="primary" data-type="merge"> 合并导出 </v-btn>
    </section>
  </v-container>
</template>

<script>
import { ipcRenderer } from "electron";
import Card from "../../../components/Card.vue";
import HtmlToCanvas from "html2canvas";
import { read, utils } from "xlsx";

export default {
  name: "Candy",
  components: { Card },
  data: () => ({
    direction: "column",
    items: [{ title: "棉花糖", icon: "mdi-candy", to: "/" }],
    file: null,
    loading: false,
  }),
  methods: {
    async merge({ target }) {
      const type = target.dataset.type || target.parentElement.dataset.type;
      if (type) {
        const Dom = document.getElementById(`dom-to-image-${type}`);
        const canvas = await HtmlToCanvas(Dom);
        const Base64 = canvas
          .toDataURL()
          .replace(/^data:image\/(png|gif|jpeg);base64,/, "");
        ipcRenderer.send("SaveFiles", Base64, `${Date.now()}.png`, "base64");
      }
    },
    read({ target: { dataset, parentElement } }) {
      const reader = new FileReader();
      const type = dataset.type || parentElement.dataset.type;
      const chinese = document.querySelector("#dom-to-image-cn .card-text");
      const japanese = document.querySelector("#dom-to-image-jp .card-text");
      if (type) {
        const Dom = document.getElementById(`dom-to-image-${type}`);
        reader.addEventListener("load", async ({ target }) => {
          const { Sheets } = read(target.result, { type: "buffer" });
          const result = [];
          for (const key in Sheets) {
            const json = utils.sheet_to_json(Sheets[key]);
            for (const item of json) {
              chinese.innerText = item["中文"];
              japanese.innerText = item["日文"];
              const Base64 = (await HtmlToCanvas(Dom))
                .toDataURL()
                .replace(/^data:image\/(png|gif|jpeg);base64,/, "");
              result.push(Base64);
            }
          }
          ipcRenderer.send(
            "SaveFiles",
            result,
            Date.now().toString(),
            "base64"
          );
          chinese.innerText = "";
          japanese.innerText = "";
          this.loading = false;
        });
        reader.readAsArrayBuffer(this.file);
        this.loading = true;
      }
    },
  },
};
</script>
