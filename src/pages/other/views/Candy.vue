<template>
  <v-container>
    <v-file-input
      label="上传Excel"
      hint="请确保文件中包含 中文 和 日文 的列标题；无文件时也可直接在图片中输入"
      persistent-hint
      :loading="loading"
      v-model="file"
    />
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
        <Card
          :size="size"
          :logo="logo && logo.path"
          :colors="colors"
          id="dom-to-image-cn"
          tip="棉花糖"
        />
        <Card
          :size="size"
          :logo="logo && logo.path"
          :colors="colors"
          id="dom-to-image-jp"
          tip="マシュマロ"
        />
      </section>
    </section>
    <section class="mt-3" @click="read">
      <v-btn outlined color="primary" small data-type="cn"> 导出中文 </v-btn>
      <v-btn small outlined color="primary" class="mx-3" data-type="jp">
        导出日语
      </v-btn>
      <v-btn outlined small color="primary" data-type="merge"> 合并导出 </v-btn>
    </section>
    <section class="d-flex flex-wrap">
      <div>
        <v-subheader>自定义颜色</v-subheader>
        <v-radio-group row v-model="color">
          <v-radio label="背景" value="container" />
          <v-radio label="内框" value="background" />
          <v-radio label="文字" value="text" />
          <v-radio label="提示" value="tip" />
        </v-radio-group>
        <v-color-picker v-model="colors[color]" mode="hexa" />
      </div>
      <div class="flex-grow-1">
        <v-subheader>自定义文字</v-subheader>
        <v-file-input label="上传字体文件" @change="font" />
        <v-range-slider
          label="字号"
          track-color="primary"
          v-model="size"
          min="12"
          thumb-label
          max="96"
        />
        <v-subheader>自定义图片</v-subheader>
        <v-file-input v-model="logo" label="上传Logo" />
        <v-btn
          outlined
          color="primary"
          small
          class="float-right"
          @click="reset"
        >
          重置
        </v-btn>
      </div>
    </section>
  </v-container>
</template>

<script>
import { ipcRenderer } from "electron";
import Card from "../../../components/Card.vue";
import HtmlToCanvas from "html2canvas";
import { read, utils } from "xlsx";
import { Colors } from "../../../plugins/utils";

const DomToImage = async (Dom) =>
  (await HtmlToCanvas(Dom))
    .toDataURL()
    .replace(/^data:image\/(png|gif|jpeg);base64,/, "");

const Logo = { name: "默认Logo", path: "/candy.png" };
const FontStyle = { size: [16, 24], face: null };

export default {
  name: "Candy",
  components: { Card },
  data: () => ({
    direction: "row",
    items: [{ title: "棉花糖", icon: "mdi-candy", to: "/" }],
    file: null,
    loading: false,
    colors: { ...Colors },
    color: "container",
    logo: Logo,
    size: FontStyle.size,
  }),
  methods: {
    async read({ target: { dataset, parentElement } }) {
      const type = dataset.type || parentElement.dataset.type;
      const Dom = document.getElementById(`dom-to-image-${type}`);
      const date = Date.now().toString();
      if (type) {
        const result = [];
        if (this.file) {
          const reader = new FileReader();
          const chinese = document.querySelector("#dom-to-image-cn .card-text");
          const japanese = document.querySelector(
            "#dom-to-image-jp .card-text"
          );
          reader.addEventListener("load", async ({ target }) => {
            const { Sheets } = read(target.result, { type: "buffer" });
            for (const key in Sheets) {
              const json = utils.sheet_to_json(Sheets[key]);
              for (const item of json) {
                chinese.innerText = item["中文"];
                japanese.innerText = item["日文"];
                result.push(await DomToImage(Dom));
              }
            }
            chinese.innerText = "";
            japanese.innerText = "";
            ipcRenderer.send("SaveFiles", result, date, "base64");
            this.loading = false;
          });
          reader.readAsArrayBuffer(this.file);
          this.loading = true;
        } else {
          result.push(await DomToImage(Dom));
          ipcRenderer.send("SaveFiles", result, date, "base64");
        }
      }
    },
    font(file) {
      if (FontStyle.face) {
        document.fonts.delete(FontStyle.face);
        FontStyle.face = null;
      }
      if (file) {
        const reader = new FileReader();
        reader.addEventListener("load", async ({ target }) => {
          FontStyle.face = new FontFace("CandyCustom", `url(${target.result})`);
          await FontStyle.face.load();
          document.fonts.add(FontStyle.face);
        });
        reader.readAsDataURL(file);
      }
    },
    reset() {
      this.colors = { ...Colors };
      this.logo = Logo;
      this.size = FontStyle.size;
      if (FontStyle.face) {
        document.fonts.delete(FontStyle.face);
        FontStyle.face = null;
      }
    },
  },
};
</script>
