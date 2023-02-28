<template>
  <v-data-table
    no-data-text=""
    :items-per-page="perpage"
    :items="items"
    :headers="headers"
    :page.sync="page"
    :dense="dense"
    hide-default-footer
    :loading="loading"
  >
    <template v-slot:[`item.actions`]="{ item }">
      <slot :item="item" />
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
</template>

<script>
export default {
  name: "DataTable",
  data: () => ({ page: 1 }),
  props: {
    items: { type: Array, required: true },
    headers: { type: Array, required: true },
    perpage: { type: Number, default: 5 },
    dense: { type: Boolean, default: true },
    loading: { type: Boolean, default: false },
  },
};
</script>
