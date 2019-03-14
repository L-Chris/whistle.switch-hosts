<template>
  <div class="app">
    <div>
      <VList>
        <template v-for="_ in hosts">
          <VListTile :key="_.name" @click="handleClick">
            <VListTileContent v-html="_.name"/>
          </VListTile>
          <VDivider :key="_.id"/>
        </template>
      </VList>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      hosts: [
        { id: 0, name: 'student-apphd-exam' },
        { id: 1, name: 'parent-apphd-exam' }
      ]
    }
  },
  methods: {
    handleClick() {}
  }
}
</script>

<style lang="scss" scoped>
.app{
  padding: 40px 60px;
}
</style>
