import { abiMap } from '@/abi'
import { getAddressInfo, getTransactions } from '@/api'
import { parseTransaction, Cell } from '@/ton/src'
import { callTonApi } from '@/utils/callTonApi'

const state = () => ({
  // count: 1,
  transactions: [],
  wallet: undefined,
  code: '',
  data: '',
  abi: undefined,
})

const mutations = {
  increment(state) {
    // `state` is the local module state
    state.count++
  },

  reset(state) {
    // this.wallet = null;
    state.transactions = []
    state.wallet = undefined
    state.code = ''
    state.data = ''
    state.abi = undefined
    // state.lastActivity = 0
    // state.qrModalVisible = false
    // state.contractExtendedInfo = undefined
  },

  setWallet(state, value) {
    state.wallet = value
  },

  setCodeData(state, { code, data }) {
    state.code = code
    state.data = data

    if (code && data) {
      const codeCell = Cell.fromBoc(Buffer.from(code, 'base64'))[0]
      const hash = codeCell.hash().toString('hex')

      const abi = abiMap[hash]
      state.abi = abi
    } else {
      state.abi = undefined
    }
  },

  setTransactions(state, value) {
    state.transactions = value
  },

  addTransaction(state, value) {
    state.transactions.push(value)
  },

  prependTransaction(state, value) {
    state.transactions.unshift(value)
  },
}
const getters = {
  doubleCount(state) {
    return state.count * 2
  },
}

const actions = {
  async loadData(
    { commit },
    { address, forceUpdate, reset }: { address: string; forceUpdate?: boolean; reset?: boolean }
  ) {
    console.log('loadData')
    if (reset) {
      // commit('reset')
    }
    // if (1 > 0 )return

    const walletInfo = await getAddressInfo(address, forceUpdate)
    commit('setWallet', walletInfo) // wallet.value = walletInfo
    // console.log('got wallet', wallet, wallet, address)
    // if (1 > 0 )return

    if (walletInfo?.state.type === 'uninit') {
      // continue
    } else if (walletInfo?.state.type === 'active') {
      if (walletInfo.state?.code && walletInfo.state?.data) {
        commit('setCodeData', {
          code: walletInfo.state?.code,
          data: walletInfo.state?.data,
        })
        // code.value = walletInfo.state?.code
        // data.value = walletInfo.state?.data
      }
    }

    // emptyHistory.value = wallet.value.lastTx?.lt === '0'

    // lastActivity.value = transactions.value[0]?.time || null
    // hasMore.value = transactions.value.length >= 20
    // isLoading.value = false
  },

  async loadTransactions(
    { state, commit },
    {
      reset,
      append,
      allowMore,
      checkForNew,
    }: { reset?: boolean; append?: boolean; allowMore?: boolean; checkForNew?: boolean } = {}
  ) {
    if (reset) {
      commit('setTransactions', [])
    }

    let lt: string
    let hash: Buffer

    if (!append) {
      lt = state.wallet.lastTx.lt || ''
      hash = Buffer.from(state.wallet.lastTx.hash, 'base64')
      checkForNew = true
    } else {
      const lastTx = state.transactions[state.transactions.length - 1]
      lt = lastTx.prevTransaction.lt.toString()
      hash = lastTx.prevTransaction.hash
    }

    const limit = 50
    // const lastTx = transactions.value[transactions.value.length - 1]
    const plainTxes = await callTonApi(() =>
      getTransactions(state.wallet.address?.toString(), lt, hash, 16, allowMore, checkForNew)
    )
    if (append) {
      plainTxes.shift()
    }

    const addTx = () => {
      const tx = plainTxes.shift()
      if (tx) {
        const parsed = parseTransaction(
          0,
          Cell.fromBoc(Buffer.from(tx.data, 'base64'))[0].beginParse()
        )

        commit('addTransaction', { ...parsed, hash: tx.hash })
        // newTxes.push(parsed)
        // commit('setTransactions', [...newTxes])
      }

      if (plainTxes.length > 0) {
        setTimeout(addTx, 1)
      }
    }
    addTx()
  },

  async refreshTransactions({ state, commit }) {
    const lt = state.wallet.lastTx.lt || ''
    const hash = Buffer.from(state.wallet.lastTx.hash, 'base64')

    const limit = 50
    // const lastTx = transactions.value[transactions.value.length - 1]
    const plainTxes = await callTonApi(() =>
      getTransactions(state.wallet.address?.toString(), lt, hash, 16, false, false)
    )

    if (state.transactions && state.transactions.length > 0) {
      const startTx = state.transactions[0].lt.toString()
      const newTx = plainTxes[0].lt

      if (startTx !== newTx) {
        for (const tx of plainTxes.reverse()) {
          if (state.transactions.find((sttx) => sttx.lt.toString() === tx.lt)) {
            continue
          }

          const parsed = parseTransaction(
            0,
            Cell.fromBoc(Buffer.from(tx.data, 'base64'))[0].beginParse()
          )

          commit('prependTransaction', { ...parsed, hash: tx.hash })
        }
      }
    }
  },
}

const addressModule = {
  namespaced: true,
  state,
  mutations,
  getters,
  actions,
}

export { addressModule }
