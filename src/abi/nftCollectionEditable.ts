import { ContractAbi } from '.'

const nftCollectionAbi: ContractAbi = {
  name: 'Standard Tonweb Editable Nft Collection',
  methods: {
    get_nft_content: {
      input: [
        { name: 'index', type: 'int' },
        {
          name: 'individual_nft_content',
          type: 'cell',
          content: [
            { name: 'offchain', type: 'int', length: 8 },
            {
              name: 'contentCell',
              type: 'cell',
              content: [
                {
                  name: 'contentSlice',
                  type: 'slice',
                },
              ],
            },
          ],
        },
      ],
      output: [
        {
          name: 'content',
          type: 'cell',
          content: [
            { name: 'index', type: 'int', length: 8 },
            { name: 'content', type: 'slice' },
            {
              name: 'content',
              type: 'cell',
              content: [
                {
                  name: 'contentSlice',
                  type: 'slice',
                },
              ],
            },
          ],
        },
      ],
    },
  },
}

export { nftCollectionAbi }
