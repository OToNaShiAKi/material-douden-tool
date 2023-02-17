<template>
  <section>
    <v-data-table
      no-data-text=""
      :items-per-page="perpage"
      :items="items"
      :headers="headers"
      hide-default-footer
      :page.sync="page"
      @page-count="count = $event"
      dense
    >
      <template v-slot:[`item.actions`]="{ item }">
        <slot :item="item" />
      </template>
    </v-data-table>
    <v-pagination circle v-model="page" class="my-3" :length="count" />
  </section>
</template>

<script>
export default {
  name: "DataTable",
  data: () => ({ page: 1, count: 0 }),
  props: {
    items: { type: Array, required: true },
    headers: { type: Array, required: true },
    perpage: { type: Number, default: 5 },
  },
};
</script>
