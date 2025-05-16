<template>
  <table>
    <thead>
      <tr>
        <th v-for="header in headers" :key="header.key">{{ header.title }}</th>
      </tr>
    </thead>
    <tbody v-if="elements.length">
      <tr
        v-for="(el, index) in elements"
        :key="'row-' + index"
        tabindex="0"
        @keydown.enter="rowClick(el)"
        @click="rowClick(el)"
      >
        <td v-for="h in headers" :key="h.key + index">{{ el[h.key] }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
defineProps<{
  headers: { title: string; key: string }[]
  elements: any[]
  rowClick: (el: any) => void
}>()
</script>

<style lang="scss" scoped>
table {
  background-color: white;
  border-radius: 0.5rem;
  padding: 0.5rem;
  & thead {
    background-color: $main-color;
    color: $second-color;
  }
  & td {
    background-color: rgb(238, 238, 238);
    padding: 0.3rem;
  }
  & tbody {
    & tr {
      cursor: pointer;
      &:hover {
        box-shadow: $light-shadow;
        scale: 1.02;
      }
    }
  }
}
</style>
