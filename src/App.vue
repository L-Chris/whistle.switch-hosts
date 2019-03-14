<template>
  <VApp class="app">
    <VContent>
      <VContainer fluid>
        <VAutocomplete
          v-model="hostName"
          :items="hostNames"
          label="请输入环境名称"
        /></VAutocomplete>
        <VList>
          <template v-for="_ in filteredHosts">
            <VListTile :key="_.name" @click="handleClick(_)">
              <VListTileContent v-html="_.name"/>
            </VListTile>
            <VDivider :key="_.id"/>
          </template>
        </VList>
      </VContainer>
    </VContent>
  </VApp>
</template>

<script>
export default {
  data() {
    return {
      hostName: '',
      hosts: [
        { id: 0, name: 'student-apphd-exam' },
        { id: 1, name: 'parent-apphd-exam' }
      ]
    }
  },
  computed: {
    hostNames() {
      return this.hosts.map(_ => _.name)
    },
    filteredHosts() {
      return this.hosts.filter(_ => _.name.includes(this.hostName))
    }
  },
  methods: {
    handleClick(item) {
      console.log(item)
    }
  }
}
</script>

<style lang="scss" scoped>
.app{
}
</style>
