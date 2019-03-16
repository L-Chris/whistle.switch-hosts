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
            prepend-icon="search"
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
import { findHost, getCurrentHost, changeHost } from './services'
export default {
  data() {
    return {
      hosts: [],
      selectedHost: {},
      inputValue: '',
      messageVisible: false,
      messageContent: '',
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
    async handleClick(item) {
      const host = await changeHost(item)
      this.messageVisible = true
      this.messageContent = `已切换成：${host.name}`
      this.selectedHost = host
      this.inputValue = ''
    },
    async asyncData() {
      const [hosts, currentHost] = await Promise.all([findHost(), getCurrentHost()])
      this.hosts = hosts
      this.selectedHost = currentHost
    }
  },
  created() {
    this.asyncData()
  }
}
</script>

<style lang="scss">
.app {
  .v-text-field {
    padding-left: 10px;
  }
}
</style>

<style lang="scss" scoped>
.app{
}
</style>
