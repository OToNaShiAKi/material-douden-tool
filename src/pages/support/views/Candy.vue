<template>
  <v-container class="lyric-control">
    <v-file-input
      class="fix-input"
      solo
      prepend-icon="mdi-microsoft-excel"
      :loading="loading"
      dense
      label="上传Excel"
      hint="请确保文件中包含 中文 和 日文 的列标题；无文件时也可直接在图片中输入"
      v-model="file"
    />
    <v-btn-toggle dense v-model="direction" rounded>
      <v-btn small icon value="row">
        <v-icon small>mdi-arrow-right-thin-circle-outline</v-icon>
      </v-btn>
      <v-btn small icon value="row-reverse">
        <v-icon small>mdi-arrow-left-thin-circle-outline</v-icon>
      </v-btn>
      <v-btn small icon value="column">
        <v-icon small>mdi-arrow-down-thin-circle-outline</v-icon>
      </v-btn>
      <v-btn small icon value="column-reverse">
        <v-icon small>mdi-arrow-up-thin-circle-outline</v-icon>
      </v-btn>
    </v-btn-toggle>
    <section class="d-flex mt-3 candy-container">
      <section
        id="dom-to-image-merge"
        class="d-flex"
        :class="`flex-${direction}`"
      >
        <Card
          :size="size"
          :logo="logo && logo.path"
          :colors="colors"
          :fontface="fontface"
          id="dom-to-image-cn"
          tip="棉花糖"
        />
        <Card
          :size="size"
          :logo="logo && logo.path"
          :fontface="fontface"
          :colors="colors"
          id="dom-to-image-jp"
          tip="マシュマロ"
        />
      </section>
    </section>
    <v-btn-toggle color="primary" rounded dense class="mt-3">
      <v-btn icon @click="() => Read('cn')">
        <v-icon>mdi-ideogram-cjk-variant</v-icon>
      </v-btn>
      <v-btn icon @click="() => Read('jp')">
        <v-icon>mdi-translate</v-icon>
      </v-btn>
      <v-btn icon @click="() => Read('merge')">
        <v-icon>mdi-translate-variant</v-icon>
      </v-btn>
    </v-btn-toggle>
    <section class="d-flex flex-wrap">
      <div>
        <v-subheader>自定义颜色</v-subheader>
        <v-btn-toggle rounded dense v-model="color">
          <v-btn small icon value="container">
            <v-icon small>mdi-image-frame</v-icon>
          </v-btn>
          <v-btn small icon value="background">
            <v-icon small>mdi-image-filter-frames</v-icon>
          </v-btn>
          <v-btn small icon value="text">
            <v-icon small>mdi-format-text</v-icon>
          </v-btn>
          <v-btn small icon value="tip">
            <v-icon small>mdi-text-short</v-icon>
          </v-btn>
        </v-btn-toggle>
        <v-color-picker
          class="mt-3 mr-3 rounded-lg"
          v-model="colors[color]"
          mode="hexa"
        />
      </div>
      <div class="flex-grow-1 fix-input">
        <v-subheader>自定义文字</v-subheader>
        <v-select
          :loading="fonts.length <= 0"
          prepend-icon="mdi-format-font"
          dense
          hide-details
          solo
          clearable
          v-model="fontface"
          :items="fonts"
          label="选择字体"
        >
          <template v-slot:item="{ item }">
            <span :style="{ fontFamily: item }">{{ item }}</span>
          </template>
        </v-select>
        <v-range-slider
          prepend-icon="mdi-format-size"
          track-color="primary"
          v-model="size"
          min="12"
          hide-details
          thumb-label
          max="96"
          class="mt-3"
        />
        <v-subheader>自定义图片</v-subheader>
        <v-file-input
          @change="Upload"
          prepend-icon="mdi-tag"
          solo
          dense
          hide-details
          v-model="logo"
          label="上传Logo"
        />
        <v-btn icon color="primary" class="mt-3 float-right" @click="Reset">
          <v-icon small>mdi-restore</v-icon>
        </v-btn>
      </div>
    </section>
  </v-container>
</template>

<script>
import { ipcRenderer } from "electron";
import { Colors } from "../../../util/Format";
import Card from "../../../components/Card.vue";
import { ExportCandy, DomToImage, ReadLogo } from "../../../util/ExportFile";
const Logo = { name: "默认Logo", path: "/candy.png" };

export default {
  name: "Candy",
  components: { Card },
  async created() {
    this.fonts = await ipcRenderer.invoke("GetFont");
  },
  data: () => ({
    direction: "row",
    fonts: [],
    file: null,
    loading: false,
    colors: { ...Colors },
    color: "container",
    logo: Logo,
    size: [16, 24],
    fontface: null,
  }),
  methods: {
    async Read(type) {
      const Dom = document.getElementById(`dom-to-image-${type}`);
      const date = Date.now().toString();
      this.loading = true;
      if (this.file) {
        const result = await ExportCandy(this.file, Dom);
        ipcRenderer.send("SaveFiles", result, date, "base64");
      } else {
        const result = [await DomToImage(Dom)];
        ipcRenderer.send("SaveFiles", result, date, "base64");
      }
      this.loading = false;
    },
    Reset() {
      this.colors = { ...Colors };
      this.logo = Logo;
      this.size = [16, 24];
      this.fontface = null;
    },
    async Upload(file) {
      if (file && file instanceof File) {
        this.logo = { name: file.name, path: await ReadLogo(file) };
      }
    },
  },
};
</script>
