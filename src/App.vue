<template>
  <VApp class="app">
    <VContent>
      <VContainer fluid>
        <VCard>
          <VToolbar>
            <VToolbarTitle>当前环境：{{ selectedHost.name }}</VToolbarTitle>
          </VToolbar>
          <VTextField
            v-model="inputValue"
            label="请输入环境名称"
          ></VTextField>
          <VList>
            <template v-for="(_, i) in filteredHosts">
              <VListTile :key="_.name" @click="handleClick(_)">
                <VListTileContent v-html="_.name"/>
              </VListTile>
              <VDivider v-if="i !== filteredHosts.length - 1" :key="_.id"/>
            </template>
          </VList>
        </VCard>
        <VSnackbar
          v-model="messageVisible"
          :timeout="1500"
          top
        >{{ messageContent }}</VSnackbar>
      </VContainer>
    </VContent>
  </VApp>
</template>

<script>
export default {
  data() {
    return {
      inputValue: '',
      hosts: [
        { id: 0, name: 'student-apphd-exam' },
        { id: 1, name: 'parent-apphd-exam' }
      ],
      messageVisible: false,
      messageContent: '',
      selectedHost: {}
    }
  },
  computed: {
    hostNames() {
      return this.hosts.map(_ => _.name)
    },
    filteredHosts() {
      return this.hosts.filter(_ => _.name.includes(this.inputValue || ''))
    }
  },
  methods: {
    handleClick(item) {
      this.messageVisible = true
      this.messageContent = `已切换成：${item.name}`
      this.selectedHost = item
      this.inputValue = ''
    }
  }
}
</script>

<style lang="scss" scoped>
.app{
}
</style>
