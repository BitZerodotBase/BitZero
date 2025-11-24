let tokenAddress, bitstakeAddress, bitdaoAddress, ETH_CHAIN_ID, ETH_PARAMS;
let tokenContract;
let stakingContract;
let daoContract;
let networkSwitcherEl;
let currentConfig;
let validatorRegistryContract;
let validatorRegistryAddress;
let selectedValidator = null;
let selectedValidatorName = 'None';
let isFetchingValidators = false;
let isConnecting = false;
let isTxInProgress = false;
const TX_HISTORY_KEY = 'BitZeroTxHistory';
const activeTimers = {};

const networkConfig = {
    '8453': { // Base Mainnet
        name: 'Base Mainnet',
        chainId: '0x2105',
        tokenAddress: '0x853c1A7587413262A0a7dC2526a8aD62497a56c0',
        bitstakeAddress: '0x84140D993d4BDC23F1A2B18c1220FAC7cab8276e',
        bitdaoAddress: '0x17BEAfbF0dc0419719A88F7F0e20265B5a6676A7',
        validatorRegistryAddress: '0xD986315888dcdF8B5af1B8005623A6D7C9F47aE6',
        params: {
            chainId: '0x2105',
            chainName: 'Base',
            nativeCurrency: { name: 'Base', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://base.drpc.org'],
            blockExplorerUrls: ['https://basescan.org/']
        }
    },
    '84532': { // Base Sepolia
        name: 'Base Sepolia',
        chainId: '0x14A34',
        tokenAddress: '0xD613a95a22f1547652EE93860d0B21C5D5C9fb24',
        bitstakeAddress: '0x335B406ECF54FCCB296d1754a2Aa5413ec535a73',
        bitdaoAddress: '0x1F68eA4e98a870Ef68d590c0209E1114747cC4aa',
        validatorRegistryAddress: '0xA8C6a10763066871f92fE8eA708e445933f7ED3e',
        params: {
            chainId: '0x14A34',
            chainName: 'Base Sepolia',
            nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org/']
        }
    }
};

function setCurrentConfig(networkId) {
    currentConfig = networkConfig[networkId];
    
    if (!currentConfig) {
        console.warn(`Configuration not found for networkId: ${networkId}. Waiting for correct network.`);
        return; 
    }

    if (networkSwitcherEl) networkSwitcherEl.value = networkId;

    tokenAddress = currentConfig.tokenAddress;
    bitstakeAddress = currentConfig.bitstakeAddress;
    bitdaoAddress = currentConfig.bitdaoAddress;
    validatorRegistryAddress = currentConfig.validatorRegistryAddress;
    ETH_CHAIN_ID = currentConfig.chainId;
    ETH_PARAMS = currentConfig.params;

    if (window.web3 && window.web3.eth) {
        const isValidAddress = (addr) => addr && !addr.includes("YOUR_") && addr !== '';

        try {
            tokenContract = isValidAddress(tokenAddress) 
                ? new window.web3.eth.Contract(tokenABI, tokenAddress) 
                : null;
                
            stakingContract = isValidAddress(bitstakeAddress) 
                ? new window.web3.eth.Contract(stakingABI, bitstakeAddress) 
                : null;
                
            daoContract = isValidAddress(bitdaoAddress) 
                ? new window.web3.eth.Contract(daoABI, bitdaoAddress) 
                : null;

            if (isValidAddress(validatorRegistryAddress)) {
                 validatorRegistryContract = new window.web3.eth.Contract(validatorRegistryABI, validatorRegistryAddress);
            } else {
                validatorRegistryContract = null;
            }
            console.log("Contracts loaded successfully for chain:", networkId);
        } catch (err) {
            console.error("Error loading contracts:", err);
        }
    }
}

const amountInputEl = document.getElementById('amountInput');
if (amountInputEl) {
    amountInputEl.addEventListener('input', async function() {
        if (!window.userAccount || !tokenContract) return;
        
        const inputVal = this.value;
        if (!inputVal) return;

        try {
            const inputWei = window.web3.utils.toWei(inputVal.toString(), 'ether');
            const balanceWei = await tokenContract.methods.balanceOf(window.userAccount).call();

            if (BigInt(inputWei) > BigInt(balanceWei)) {
                this.style.borderColor = 'red';
                this.style.color = 'red';
            } else {
                this.style.borderColor = 'var(--border-color)';
                this.style.color = 'var(--text-color)';
            }
        } catch (e) {
            console.debug("Input validation skipped:", e);
        }
    });
}

const tokenABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "allowance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSpender",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

const stakingABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_stakingToken",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_registryAddress",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "validator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "CommissionClaimed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "validator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Delegated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "reward",
				"type": "uint256"
			}
		],
		"name": "RewardClaimed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "validator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "UndelegatedAll",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "claimCommission",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "claimReward",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_validator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			}
		],
		"name": "delegate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "delegators",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "amountStaked",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "rewardDebt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lastUpdated",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "validator",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "emergencyWithdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getDelegation",
		"outputs": [
			{
				"internalType": "address",
				"name": "validator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_validator",
				"type": "address"
			}
		],
		"name": "getPendingCommission",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getStaked",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_validator",
				"type": "address"
			}
		],
		"name": "getTotalDelegated",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "pendingReward",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "rewardRate",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_newRegistry",
				"type": "address"
			}
		],
		"name": "setRegistryAddress",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_newRate",
				"type": "uint256"
			}
		],
		"name": "setRewardRate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "stakingToken",
		"outputs": [
			{
				"internalType": "contract IERC20",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalStaked",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			}
		],
		"name": "undelegate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "undelegateAll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "validatorRegistry",
		"outputs": [
			{
				"internalType": "contract IValidatorRegistry",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "validators",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalDelegated",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "pendingCommission",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const validatorRegistryABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newRate",
				"type": "uint256"
			}
		],
		"name": "CommissionUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "commissionRate",
				"type": "uint256"
			}
		],
		"name": "ValidatorRegistered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "ValidatorRemoved",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_operator",
				"type": "address"
			}
		],
		"name": "autoRemoveValidator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "bitStakeAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "bitZeroNodesAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_operator",
				"type": "address"
			}
		],
		"name": "getValidatorInfo",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "commissionRate",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "exists",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getValidators",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_operator",
				"type": "address"
			}
		],
		"name": "isValidator",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_commissionRate",
				"type": "uint256"
			}
		],
		"name": "registerValidator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_operator",
				"type": "address"
			}
		],
		"name": "removeValidator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_address",
				"type": "address"
			}
		],
		"name": "setBitStakeAddress",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_address",
				"type": "address"
			}
		],
		"name": "setBitZeroNodesAddress",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_operator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_newRate",
				"type": "uint256"
			}
		],
		"name": "updateCommission",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "validatorList",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "validators",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "commissionRate",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "exists",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const daoABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_description",
				"type": "string"
			}
		],
		"name": "createProposal",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_bitStakeAddress",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "proposer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "description",
				"type": "string"
			}
		],
		"name": "ProposalCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_proposalId",
				"type": "uint256"
			},
			{
				"internalType": "enum BitStakeDao.VoteOption",
				"name": "_voteOption",
				"type": "uint8"
			}
		],
		"name": "vote",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "voter",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "enum BitStakeDao.VoteOption",
				"name": "voteOption",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "voteWeight",
				"type": "uint256"
			}
		],
		"name": "Voted",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "bitStake",
		"outputs": [
			{
				"internalType": "contract IBitStake",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_proposalId",
				"type": "uint256"
			}
		],
		"name": "getProposal",
		"outputs": [
			{
				"internalType": "address",
				"name": "proposer",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "yesVotes",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "noVotes",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "abstainVotes",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "noWithVetoVotes",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "executed",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "voteEnd",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_proposalId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_voter",
				"type": "address"
			}
		],
		"name": "hasVoted",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "proposalCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "proposals",
		"outputs": [
			{
				"internalType": "address",
				"name": "proposer",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "yesVotes",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "noVotes",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "abstainVotes",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "noWithVetoVotes",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "voteEnd",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "executed",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "VOTING_PERIOD",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

function openProposalModal() {
    const modal = document.getElementById('proposalModal');
    if(modal) modal.style.display = 'flex';
}

function closeProposalModal() {
    const modal = document.getElementById('proposalModal');
    if(modal) modal.style.display = 'none';
}

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeProposalModal();
    }
});

function disconnectWallet() {
    window.userAccount = null; 
    tokenContract = null;
    stakingContract = null;
    daoContract = null;
    validatorRegistryContract = null;
    selectedValidator = null;
	selectedValidatorName = 'None';
    
    const elValidatorDisplay = document.getElementById('selectedValidatorDisplay');
    const elValidatorList = document.getElementById('validatorList');
    const elConnectBtn = document.getElementById('connect-btn');
    const elStakingSec = document.getElementById('stakingSection');
    const elConnMsg = document.getElementById('connectMessage');
    const elementsToReset = ['Balance', 'totalStaked', 'pendingReward', 'totalBitZeroInChain', 'aprDisplay', 'tvlDisplay'];
    elementsToReset.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = '0.000000';
    });

    const stakeBar = document.getElementById('stakeBar');
    if(stakeBar) stakeBar.style.width = '0%';
    
    const stakePercent = document.getElementById('stakePercentDisplay');
    if(stakePercent) stakePercent.innerText = '0.00%';
    
    const estReward = document.getElementById('estimatedReward');
    if(estReward) estReward.innerHTML = '&nbsp;';
    
    const rewardRate = document.getElementById('rewardRateDisplay');
    if(rewardRate) rewardRate.innerText = 'N/A';
    
    const amtInput = document.getElementById('amountInput');
    if(amtInput) amtInput.value = '';

    if (elValidatorDisplay) elValidatorDisplay.innerText = 'None';
    if (elValidatorList) elValidatorList.innerHTML = '<p class="no-transactions">> Connect wallet to see validators.</p>';
    
    if (elConnectBtn) {
        elConnectBtn.innerText = '[ Connect Wallet ]';
        elConnectBtn.style.color = '#00ffff';
        elConnectBtn.style.borderColor = '#00ffff';
    }

    if (elStakingSec) elStakingSec.style.display = 'none';
    if (elConnMsg) elConnMsg.style.display = 'block';
}

function formatCurrency(num) {
    return parseFloat(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    });
}

function showLoader(message = "Loading...") {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('show');
        const msgEl = document.getElementById('loaderMessage');
        if(msgEl) msgEl.innerText = message;
    }
}
function hideLoader() {
    const loader = document.getElementById('loader');
    if(loader) loader.classList.remove('show');
}
function showSpinner(spinnerId) {
    const el = document.getElementById(spinnerId);
    if(el) el.style.display = 'inline-block';
}
function hideSpinner(spinnerId) {
    const el = document.getElementById(spinnerId);
    if(el) el.style.display = 'none';
}

function enableInteractionButtons() {
    isTxInProgress = false;
    const buttons = document.querySelectorAll('#stakingSection button:not(.static-button)');
    buttons.forEach(button => button.disabled = false);
    const input = document.getElementById('amountInput');
    if(input) input.disabled = false;
}
function disableInteractionButtons() {
    isTxInProgress = true;
    const buttons = document.querySelectorAll('#stakingSection button:not(.static-button)');
    buttons.forEach(button => button.disabled = true);
    const input = document.getElementById('amountInput');
    if(input) input.disabled = true;
}

function showTxNotification(txHash, message = "Transaction successful!", isError = false) {
    const container = document.getElementById('tx-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `tx-toast ${isError ? 'error' : ''}`;

    const explorerUrl = (txHash && ETH_PARAMS) ? `${ETH_PARAMS.blockExplorerUrls[0]}tx/${txHash}` : '#';
    const messageP = document.createElement('p');
    messageP.textContent = message;
    toast.appendChild(messageP);

    if (txHash) {
        const linksDiv = document.createElement('div');
        linksDiv.style.marginTop = '8px';
        linksDiv.style.display = 'flex';
        linksDiv.style.alignItems = 'center';
        linksDiv.style.gap = '10px';
        const shortHash = `${txHash.slice(0, 6)}...${txHash.slice(-6)}`;
        const linkA = document.createElement('a');
        linkA.href = explorerUrl;
        linkA.target = '_blank';
        linkA.textContent = `Hash: ${shortHash}`;
        linksDiv.appendChild(linkA);
        
        const copyButton = document.createElement('button');
        copyButton.textContent = '[ Copy Link ]';
        copyButton.className = 'small-button static-button';
        copyButton.style.fontSize = '0.8em';
        copyButton.style.padding = '2px 6px';
        
        copyButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                navigator.clipboard.writeText(explorerUrl);
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = '[ Copy Link ]';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy tx link:', err);
            }
        };
        linksDiv.appendChild(copyButton);
        toast.appendChild(linksDiv);
    }
    
    container.prepend(toast);
    const toastDuration = isError ? 5000 : 10000; 
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease-out';
        toast.addEventListener('transitionend', () => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        });
    }, toastDuration);
}

function saveTransaction(type, amount, txHash, timestamp) {
    let history = JSON.parse(localStorage.getItem(TX_HISTORY_KEY) || '[]');
    history.unshift({ type, amount, txHash, timestamp });
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(history));
    displayTransactionHistory();
}

function displayTransactionHistory() {
    const historyContainer = document.getElementById('transactionHistory');
    if (!historyContainer) return;

    const history = JSON.parse(localStorage.getItem(TX_HISTORY_KEY) || '[]');
    historyContainer.innerHTML = '';

    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="no-transactions">> No recent logs found.</p>';
        return;
    }

    history.forEach(tx => {
        const txDiv = document.createElement('div');
        txDiv.className = 'tx-item';
        const date = new Date(tx.timestamp).toLocaleString();
        const shortHash = tx.txHash ? `${tx.txHash.slice(0, 6)}...${tx.txHash.slice(-6)}` : 'N/A';
        const explorerUrl = (ETH_PARAMS) ? `${ETH_PARAMS.blockExplorerUrls[0]}tx/${tx.txHash}` : '#';

        let amountDisplay;
        if (!isNaN(parseFloat(tx.amount)) && isFinite(tx.amount)) {
            amountDisplay = `${parseFloat(tx.amount).toFixed(4)} BIT`;
        } else {
            amountDisplay = tx.amount;
        }

        txDiv.innerHTML = `
            <span>> <strong>${tx.type}:</strong> ${amountDisplay}</span>
            <span class="tx-date">${date}</span>
            <a href="${explorerUrl}" target="_blank" class="tx-hash-link">Tx: ${shortHash}</a>
        `;
        historyContainer.appendChild(txDiv);
    });
}

function clearTransactionHistory() {
    if (confirm("Are you sure you want to clear your transaction logs?")) {
        localStorage.removeItem(TX_HISTORY_KEY);
        displayTransactionHistory();
        showTxNotification(null, "Transaction logs cleared.", false);
    }
}

async function switchNetwork(networkId) {
    if (!window.web3 || !window.web3.currentProvider) return showTxNotification(null, "Wallet not found", true);

    const config = networkConfig[networkId];
    if (!config) {
        return showTxNotification(null, `Invalid network configuration for ID: ${networkId}`, true);
    }

    try {
        await window.web3.currentProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: config.chainId }],
        });
    } catch (switchError) {
        if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
            try {
                await window.web3.currentProvider.request({
                    method: 'wallet_addEthereumChain',
                    params: [config.params],
                });
            } catch (addError) {
                console.error('Failed to add network', addError);
                showTxNotification(null, `Failed to add ${config.name} network.`, true);
            }
        } else {
            console.error('Failed to switch network', switchError);
            showTxNotification(null, 'Failed to switch network. Please do it manually in your wallet.', true);
        }
    }
}

window.addEventListener('load', async () => {
    networkSwitcherEl = document.getElementById('networkSwitcher');
    if (networkSwitcherEl) {
        networkSwitcherEl.addEventListener('change', handleNetworkSwitch);
    }
    
    const amountInput = document.getElementById('amountInput');
    if (amountInput) {
        amountInput.addEventListener('input', estimateReward);
    }
    
    displayTransactionHistory();
    setInterval(() => {
        if (window.userAccount && !document.hidden) {
            autoUpdatePendingRewards();
            updateStakingInfo();
        }
    }, 5000);
});

async function handleNetworkSwitch() {
    const newNetworkId = networkSwitcherEl.value;
    if (window.userAccount) {
        await switchNetwork(newNetworkId);
    } else {
        setCurrentConfig(newNetworkId);
    }
}

async function delegateOrApprove() {
  if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected or transaction in progress.", true);
  if (!selectedValidator) {
      showTxNotification(null, "Please select a validator from the list first.", true);
      const valList = document.getElementById('validatorList');
      if(valList) valList.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
  }
  const amountInput = document.getElementById('amountInput');
  const amount = amountInput.value;
  if (!amount || parseFloat(amount) <= 0) {
      amountInput.style.borderColor = 'red';
      return showTxNotification(null, "Please enter a valid amount to delegate.", true);
  }
  amountInput.style.borderColor = 'var(--border-color)';

  disableInteractionButtons();
  showLoader("Checking current delegation status...");

  try {
    const currentDelegation = await stakingContract.methods.getDelegation(window.userAccount).call();
    const hasExistingDelegation = currentDelegation.validator !== '0x0000000000000000000000000000000000000000' && BigInt(currentDelegation.amount) > BigInt(0);

    if (hasExistingDelegation && currentDelegation.validator.toLowerCase() !== selectedValidator.toLowerCase()) {
        throw new Error("You are already delegated to another validator. Please undelegate all tokens first.");
    }

    showLoader("Preparing delegation...");
    const weiAmount = window.web3.utils.toWei(amount, 'ether');
    const allowance = await tokenContract.methods.allowance(window.userAccount, bitstakeAddress).call();

    if (BigInt(allowance) < BigInt(weiAmount)) {
      showLoader("Approval needed. Confirm in your wallet...");
      const approveTx = await tokenContract.methods.approve(bitstakeAddress, weiAmount)
        .send({ from: window.userAccount });
      showTxNotification(approveTx.transactionHash, "Approval successful!");
    }
    
    showLoader(`Delegating ${amount} BIT to ${selectedValidatorName}... Confirm in wallet...`);
    const delegateTx = await stakingContract.methods.delegate(selectedValidator, weiAmount).send({ from: window.userAccount });
    await runSuccessAnimation("Delegation Successful!"); 
    showTxNotification(delegateTx.transactionHash, "Delegation successful!");
    saveTransaction('Delegate', amount, delegateTx.transactionHash, Date.now());
    
    amountInput.value = '';
    document.getElementById('estimatedReward').innerHTML = '&nbsp;';
    await updateStakingInfo();
    await fetchValidators();
  } catch (err) {
    console.error("Delegation failed:", err);
    showTxNotification(null, `Delegation failed: ${err.message || 'Transaction rejected'}`, true);
  } finally {
    hideLoader(); 
    enableInteractionButtons();
  }
}

async function delegateAllTokens() {
  if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected or transaction in progress.", true);
  if (!selectedValidator) {
      showTxNotification(null, "Please select a validator from the list first.", true);
      return;
  }
  disableInteractionButtons();
  showLoader("Checking delegation status...");
  try {
    const currentDelegation = await stakingContract.methods.getDelegation(window.userAccount).call();
    const hasExistingDelegation = currentDelegation.validator !== '0x0000000000000000000000000000000000000000' && BigInt(currentDelegation.amount) > BigInt(0);
    if (hasExistingDelegation && currentDelegation.validator.toLowerCase() !== selectedValidator.toLowerCase()) {
        throw new Error("Already delegated to another validator. Undelegate first.");
    }
    
    showLoader("Preparing 'Delegate All'...");
    const balance = await tokenContract.methods.balanceOf(window.userAccount).call();
    if (BigInt(balance) === BigInt(0)) {
        showTxNotification(null, "No tokens to delegate.", true);
        hideLoader();
        enableInteractionButtons();
        return;
    }
    
    const allowance = await tokenContract.methods.allowance(window.userAccount, stakingContract.options.address).call();
    if (BigInt(allowance) < BigInt(balance)) {
      showLoader("Approval needed...");
      await tokenContract.methods.approve(stakingContract.options.address, balance).send({ from: window.userAccount });
    }
    
    showLoader(`Delegating ALL to ${selectedValidatorName}...`);
    const delegateAllTx = await stakingContract.methods.delegate(selectedValidator, balance).send({ from: window.userAccount });
    
    await runSuccessAnimation("All Tokens Delegated!");
    showTxNotification(delegateAllTx.transactionHash, "All tokens delegated!");
    saveTransaction('Delegate All', window.web3.utils.fromWei(balance, 'ether'), delegateAllTx.transactionHash, Date.now());
    
    document.getElementById('amountInput').value = '';
    await updateStakingInfo();
    await fetchValidators();
  } catch (error) {
    console.error("Delegate all failed:", error);
    showTxNotification(null, `Delegate all failed: ${error.message}`, true);
  } finally {
    hideLoader();
    enableInteractionButtons();
  }
}

async function undelegate() {
  if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected.", true);

  const amountInput = document.getElementById('amountInput');
  const amount = amountInput.value;
  if (!amount || parseFloat(amount) <= 0) {
      amountInput.style.borderColor = 'red';
      return showTxNotification(null, "Enter valid amount.", true);
  }
  
  disableInteractionButtons();
  showLoader("Preparing undelegation...");

  try {
    const weiAmount = window.web3.utils.toWei(amount, 'ether');
    const stakedAmount = await stakingContract.methods.getStaked(window.userAccount).call();
    
    if (BigInt(weiAmount) > BigInt(stakedAmount)) {
      showTxNotification(null, "Cannot undelegate more than staked.", true);
      hideLoader();
      enableInteractionButtons();
      return;
    }

    showLoader(`Undelegating ${amount} BIT...`);
    const undelegateTx = await stakingContract.methods.undelegate(weiAmount).send({ from: window.userAccount });
    await runSuccessAnimation("Undelegation Successful!");
    showTxNotification(undelegateTx.transactionHash, "Undelegation successful!");
    saveTransaction('Undelegate', amount, undelegateTx.transactionHash, Date.now());
    
    amountInput.value = '';
    await updateStakingInfo();
    await fetchValidators();
  } catch (err) {
    console.error("Undelegation failed:", err);
    showTxNotification(null, `Undelegation failed: ${err.message}`, true);
  } finally {
    hideLoader();
    enableInteractionButtons();
  }
}

async function undelegateAllTokens() {
  if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected.", true);

  disableInteractionButtons();
  showLoader("Undelegating ALL...");

  try {
    const stakedAmount = await stakingContract.methods.getStaked(window.userAccount).call();
    if (BigInt(stakedAmount) === BigInt(0)) {
        showTxNotification(null, "No tokens staked.", true);
        hideLoader();
        enableInteractionButtons();
        return;
    }

    const undelegateAllTx = await stakingContract.methods.undelegateAll().send({ from: window.userAccount });
    
    await runSuccessAnimation("All Tokens Undelegated!");
    showTxNotification(undelegateAllTx.transactionHash, "All tokens undelegated!");
    saveTransaction('Undelegate All', window.web3.utils.fromWei(stakedAmount, 'ether'), undelegateAllTx.transactionHash, Date.now());
    
    await updateStakingInfo();
    await fetchValidators();
  } catch (error) {
    console.error("Undelegate all failed:", error);
    showTxNotification(null, `Undelegate all failed: ${error.message}`, true);
  } finally {
    hideLoader();
    enableInteractionButtons();
  }
}

async function claimReward() {
  if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected.", true);

  disableInteractionButtons();
  showLoader("Claiming reward...");

  try {
    const pending = await stakingContract.methods.pendingReward(window.userAccount).call();
    if (BigInt(pending) === BigInt(0)) {
        showTxNotification(null, "No rewards to claim.", true);
        hideLoader();
        enableInteractionButtons();
        return;
    }

    const claimTx = await stakingContract.methods.claimReward().send({ from: window.userAccount });
    await runSuccessAnimation("Reward Claimed!");
    showTxNotification(claimTx.transactionHash, "Reward claimed!");
    saveTransaction('Claim', window.web3.utils.fromWei(pending, 'ether'), claimTx.transactionHash, Date.now());
    await updateStakingInfo();
  } catch (err) {
    console.error("Claim reward failed:", err);
    showTxNotification(null, `Claim failed: ${err.message}`, true);
  } finally {
    hideLoader();
    enableInteractionButtons();
  }
}

async function autoUpdatePendingRewards() {
    if (!window.userAccount || !stakingContract || isTxInProgress) return;

    try {
        const pendingReward = await stakingContract.methods.pendingReward(window.userAccount).call();
        const pendingEth = parseFloat(window.web3.utils.fromWei(pendingReward, 'ether')).toFixed(6);
        
        const elPending = document.getElementById('pendingReward');
        if(elPending) elPending.innerText = pendingEth;
        
        const claimButton = document.getElementById('claimRewardButton');
        if (claimButton) {
            claimButton.disabled = BigInt(pendingReward) === BigInt(0) || isTxInProgress;
        }
    } catch (error) {
    }
}

async function updateStakingInfo() {
  if (!window.userAccount || !tokenContract || !stakingContract) return;

  try {
    showSpinner('balanceSpinner');
    showSpinner('stakedSpinner');
    showSpinner('totalStakedSpinner');
    showSpinner('rewardSpinner');
    showSpinner('aprSpinner');
    showSpinner('tvlSpinner');

    const [tokenBalance, stakedAmount, totalStakedInContract, pendingReward, rewardRate] = await Promise.all([
        tokenContract.methods.balanceOf(window.userAccount).call(),
        stakingContract.methods.getStaked(window.userAccount).call(),
        stakingContract.methods.totalStaked().call(),
        stakingContract.methods.pendingReward(window.userAccount).call(),
        stakingContract.methods.rewardRate().call()
    ]);

    const totalStakedNum = parseFloat(window.web3.utils.fromWei(totalStakedInContract, 'ether'));
    
    document.getElementById('Balance').innerText = formatCurrency(window.web3.utils.fromWei(tokenBalance, 'ether'));
	document.getElementById('totalStaked').innerText = formatCurrency(window.web3.utils.fromWei(stakedAmount, 'ether'));
	document.getElementById('pendingReward').innerText = formatCurrency(window.web3.utils.fromWei(pendingReward, 'ether'));
	document.getElementById('totalBitZeroInChain').innerText = formatCurrency(window.web3.utils.fromWei(totalStakedInContract, 'ether'));
    document.getElementById('tvlDisplay').innerText = totalStakedNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const MAX_BITS = 10000000000;
    const sizeInKB = totalStakedNum / 8192;
    let usagePercentage = (totalStakedNum / MAX_BITS) * 100;
    if (usagePercentage > 100) usagePercentage = 100;
    const degrees = usagePercentage * 3.6;
    
    const elDataSize = document.getElementById('dataSizeDisplay');
    if (elDataSize) {
        if (sizeInKB > 1000) {
            elDataSize.innerText = formatCurrency(sizeInKB / 1024);
            elDataSize.nextElementSibling.innerText = "MB Used";
        } else {
            elDataSize.innerText = formatCurrency(sizeInKB);
            elDataSize.nextElementSibling.innerText = "KB Used";
        }
    }
	const elCircle = document.getElementById('dataCircle');
    if (elCircle) {
        elCircle.style.background = `conic-gradient(var(--retro-purple) ${degrees}deg, rgba(255, 255, 255, 0.05) ${degrees}deg)`;
    }

    const rewardPerDay = BigInt(rewardRate) * BigInt(86400);
    document.getElementById('rewardRateDisplay').innerText = `${parseFloat(window.web3.utils.fromWei(rewardPerDay.toString(), 'ether')).toFixed(4)} BIT/day`;

    let apr = 3000;
    if (totalStakedNum > 0) {
        const rewardRateNum = BigInt(rewardRate);
        const yearlyRewardInWei = rewardRateNum * BigInt(3153600000000000); 
        const yearlyReward = parseFloat(window.web3.utils.fromWei(yearlyRewardInWei.toString(), 'ether'));
        apr = (yearlyReward / totalStakedNum) * 100; 
    }
    document.getElementById('aprDisplay').innerText = apr.toFixed(2);
    updateStakeBar(totalStakedInContract);

  } catch (error) {
    console.error('Failed to fetch staking info:', error);
  } finally {
    hideSpinner('balanceSpinner');
    hideSpinner('stakedSpinner');
    hideSpinner('totalStakedSpinner');
    hideSpinner('rewardSpinner');
    hideSpinner('aprSpinner');
    hideSpinner('tvlSpinner');
  }
}

async function estimateReward() {
  document.getElementById('estimatedReward').innerHTML = "&nbsp;";
}

async function updateStakeBar(totalStakedInContract) {
  if (!tokenContract) return;
  try {
    const totalStaked = totalStakedInContract || await stakingContract.methods.totalStaked().call();
    const totalSupply = await tokenContract.methods.totalSupply().call();
    const percent = BigInt(totalSupply) > 0 ? (Number(BigInt(totalStaked) * BigInt(10000) / BigInt(totalSupply)) / 100) : 0;
    
    document.getElementById("stakeBar").style.width = `${percent.toFixed(2)}%`;
    document.getElementById("stakePercentDisplay").innerText = `${percent.toFixed(2)}%`;
  } catch (error) {
    console.error("Error updating stake bar:", error);
  }
}

async function createProposal() {
    if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected.", true);
    const description = document.getElementById('proposalInput').value;
    if (!description.trim()) return showTxNotification(null, "Desc empty.", true);

    disableInteractionButtons();
    showLoader("Submitting proposal...");

    try {
        const createTx = await daoContract.methods.createProposal(description).send({ from: window.userAccount });
        showTxNotification(createTx.transactionHash, "Proposal created!");
        saveTransaction('Proposal', 'New', createTx.transactionHash, Date.now());
        document.getElementById('proposalInput').value = '';
        await fetchProposals();
    } catch (err) {
        console.error("Proposal failed:", err);
        showTxNotification(null, `Failed: ${err.message}`, true);
    } finally {
        hideLoader();
        enableInteractionButtons();
        closeProposalModal();
    }
}

async function castVote(proposalId, voteOption) {
    if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected.", true);
    disableInteractionButtons();
    showLoader(`Voting on #${proposalId}...`);

    try {
        const voteTx = await daoContract.methods.vote(proposalId, voteOption).send({ from: window.userAccount });
        showTxNotification(voteTx.transactionHash, "Vote cast!");
        saveTransaction('Vote', `Proposal ${proposalId}`, voteTx.transactionHash, Date.now());
        await fetchProposals();
    } catch (err) {
        console.error("Vote failed:", err);
        showTxNotification(null, `Failed: ${err.message}`, true);
    } finally {
        hideLoader();
        enableInteractionButtons();
    }
}

async function fetchProposals() {
    if (!daoContract) return;
    const proposalListDiv = document.getElementById('proposalList');
    proposalListDiv.innerHTML = '<p>> Fetching proposals...</p>';
    
    Object.keys(activeTimers).forEach(key => {
        clearInterval(activeTimers[key]);
        delete activeTimers[key];
    });

    try {
        const count = await daoContract.methods.proposalCount().call();
        if (count == 0) {
            proposalListDiv.innerHTML = '<p class="no-transactions">> No active proposals.</p>';
            return;
        }

        proposalListDiv.innerHTML = '';
        for (let i = count - 1; i >= 0; i--) {
            const proposalData = await daoContract.methods.getProposal(i).call();
            const hasVoted = await daoContract.methods.hasVoted(i, window.userAccount).call();
            const proposal = {
                proposer:       proposalData[0],
                description:    proposalData[1],
                yesVotes:       window.web3.utils.fromWei(proposalData[2], 'ether'),
                noVotes:        window.web3.utils.fromWei(proposalData[3], 'ether'),
                abstainVotes:   window.web3.utils.fromWei(proposalData[4], 'ether'),
                noWithVetoVotes:window.web3.utils.fromWei(proposalData[5], 'ether'),
                executed:       proposalData[6],
                voteEnd:        proposalData[7]
            };

            const proposalDiv = document.createElement('div');
            proposalDiv.className = 'proposal-item';
            const nowSeconds = Math.floor(new Date().getTime() / 1000);
            const isExpired = nowSeconds > parseInt(proposal.voteEnd);
            let buttonsHTML;

            if (proposal.executed) {
                buttonsHTML = '<p class="voted-text">> Proposal executed.</p>';
            } else if (isExpired) {
                buttonsHTML = '<p class="voted-text">> Voting period ended.</p>';
            } else if (hasVoted) {
                buttonsHTML = '<p class="voted-text">> You have voted.</p>';
            } else {
                buttonsHTML = `
                    <div class="button-group action-buttons">
                        <button onclick="castVote(${i}, 0)">Yes</button>
                        <button onclick="castVote(${i}, 1)">No</button>
                        <button onclick="castVote(${i}, 2)">Abs</button>
                        <button onclick="castVote(${i}, 3)">Veto</button>
                    </div>`;
            }

            const statusId = `proposal-status-${i}`;
            proposalDiv.innerHTML = `
                <div class="proposal-header">
                    <strong>Proposal #${i}</strong>
                    <span>[${proposal.proposer.slice(0, 6)}...]</span>
                </div>
                <p class="proposal-desc">${proposal.description}</p>
                <div id="${statusId}" class="proposal-status" style="margin: 5px 0;">> Status: Loading...</div>
                <div class="proposal-votes">
                    <span>Yes: ${parseFloat(proposal.yesVotes).toFixed(2)}</span>
                    <span>No: ${parseFloat(proposal.noVotes).toFixed(2)}</span>
                </div>
                ${buttonsHTML}
            `;
            
            proposalListDiv.appendChild(proposalDiv);
            startProposalCountdown(statusId, proposal.voteEnd, proposal.executed, hasVoted);
        }
		applyProposalFilter();
    } catch (error) {
        console.error("Failed to fetch proposals:", error);
        proposalListDiv.innerHTML = '<p class="error">> Error loading proposals.</p>';
    }
}

function startProposalCountdown(elementId, endTimeUnix, executed, hasVoted) {
    const timerElement = document.getElementById(elementId);
    if (!timerElement) return;
    const endTime = parseInt(endTimeUnix) * 1000;

    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = endTime - now;
        
        if (executed) {
            timerElement.innerHTML = `> Status: <span style="color: #0f0;">Executed</span>`;
            if (activeTimers[elementId]) { clearInterval(activeTimers[elementId]); delete activeTimers[elementId]; }
        } else if (distance < 0) {
            timerElement.innerHTML = `> Status: <span style="color: #f00;">Ended</span>`;
            if (activeTimers[elementId]) { clearInterval(activeTimers[elementId]); delete activeTimers[elementId]; }
        } else {
            const timeLeft = formatTimeLeft(Math.floor(distance / 1000));
            const votedSuffix = hasVoted ? ' <span style="color: #aaa;">(Voted)</span>' : '';
            timerElement.innerHTML = `> Time Left: <span style="color: #ff0;">${timeLeft}</span>${votedSuffix}`;
        }
    };

    updateTimer();
    activeTimers[elementId] = setInterval(updateTimer, 1000);
}

function formatTimeLeft(totalSeconds) {
    if (totalSeconds <= 0) return "0s";
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

async function fetchValidators() {
    if (isFetchingValidators || !validatorRegistryContract) return;
    isFetchingValidators = true;
    const listEl = document.getElementById('validatorList');

    try {
        listEl.innerHTML = '<p class="no-transactions">> Fetching validators...</p>';
        const validatorAddresses = await validatorRegistryContract.methods.getValidators().call();
        
        if (!validatorAddresses || validatorAddresses.length === 0) {
            listEl.innerHTML = '<p class="no-transactions">> No validators found.</p>';
            return;
        }

        listEl.innerHTML = '';
        const displayedValidators = {}; 
        
        let delegationInfo = null;
        try {
            delegationInfo = await stakingContract.methods.getDelegation(window.userAccount).call(); 
        } catch (e) {}

        for (const address of validatorAddresses) {
            const lowerCaseAddress = address.toLowerCase();
            if (displayedValidators[lowerCaseAddress]) continue;
            
            let name = `Validator ${address.slice(0, 6)}...`;
            let totalStaked = "N/A";
            let commissionRate = "N/A";

            try {
                const info = await validatorRegistryContract.methods.getValidatorInfo(address).call();
                if (!info.exists) {
                    displayedValidators[lowerCaseAddress] = true;
                    continue; 
                }
                name = info.name || name; 
                if (info.commissionRate) {
                    commissionRate = `${(parseInt(info.commissionRate) / 100).toFixed(2)}%`;
                }
                
                const totalDelegatedWei = await stakingContract.methods.getTotalDelegated(address).call();
                totalStaked = parseFloat(window.web3.utils.fromWei(totalDelegatedWei, 'ether')).toLocaleString();
            } catch (e) {
                console.warn(`Error val info ${address}:`, e.message);
                continue;
            }

            displayedValidators[lowerCaseAddress] = true; 
            const explorerUrl = (ETH_PARAMS) ? ETH_PARAMS.blockExplorerUrls[0] : '#';
            const validatorUrl = `${explorerUrl}address/${address}`;
            const item = document.createElement('div');
            item.className = 'validator-item'; 
            const isDelegated = delegationInfo && delegationInfo.validator && delegationInfo.validator.toLowerCase() === address.toLowerCase();
            const isSelected = selectedValidator && selectedValidator.toLowerCase() === address.toLowerCase();
            
            if (isDelegated) {
                item.classList.add('selected');
                if (!selectedValidator) {
                    selectValidator(address, name);
                }
            } else if (isSelected) {
                item.classList.add('selected');
            }

            item.innerHTML = `
                <div>
                    <strong>${name}</strong>
                    <a href="${validatorUrl}" target="_blank" class="validator-address-link" title="Explorer">
                        <span class="validator-address">[${address.slice(0, 8)}...]</span>
                    </a>
                </div>
                <div class="validator-stats">
                    <span class="validator-commission">Comm: ${commissionRate}</span>
                    <span class="validator-stake">Staked: ${totalStaked}</span>
                </div>
            `;
            
            item.onclick = (e) => {
                if (!e.target.closest('a')) selectValidator(address, name);
            };
            listEl.appendChild(item);
        }

    } catch (error) {
        console.error("Failed validators:", error);
        listEl.innerHTML = `<p class="no-transactions error">> Error: ${error.message}</p>`;
    } finally {
        isFetchingValidators = false;
    }
}

function selectValidator(address, name) {
    selectedValidator = address;
    selectedValidatorName = name;
    
    const items = document.querySelectorAll('.validator-item');
    items.forEach(item => {
        if (item.innerHTML.includes(address.slice(0,8))) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });

    const elDisplay = document.getElementById('selectedValidatorDisplay');
    if(elDisplay) {
        elDisplay.innerText = `${name} [${address.slice(0, 6)}...]`;
        elDisplay.style.color = '#00ffff';
    }
}

async function registerValidator() {
  if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected.", true);
  if (!validatorRegistryContract) return showTxNotification(null, "Contract error.", true);

  const nameEl = document.getElementById('validator_name');
  const commEl = document.getElementById('validator_commission');
  
  if (!nameEl || !commEl) return;

  const name = nameEl.value;
  const commissionRate = commEl.value;
  
  if (!name.trim()) return showTxNotification(null, "Name empty.", true);

  const rate = parseInt(commissionRate);
  if (isNaN(rate) || rate < 0 || rate > 10000) {
    return showTxNotification(null, "Invalid commission (0-10000).", true);
  } 

  disableInteractionButtons();
  showLoader("Registering validator...");

  try {
    const registerTx = await validatorRegistryContract.methods
      .registerValidator(name, rate)
      .send({ from: window.userAccount });

    showTxNotification(registerTx.transactionHash, "Registered successfully!");
    await fetchValidators(); 
    nameEl.value = '';
    commEl.value = '';

  } catch (err) {
    console.error("Reg failed:", err);
    showTxNotification(null, `Failed: ${err.message}`, true);
  } finally {
    hideLoader();
    enableInteractionButtons();
  }
}

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitzero&vs_currencies=usd';

async function fetchBitPrice() {
    const bitPriceDisplay = document.getElementById('bitPriceDisplay');
    const priceSpinner = document.getElementById('priceSpinner');
    if(priceSpinner) priceSpinner.style.display = 'inline-block';

    try {
        const response = await fetch(COINGECKO_API_URL);
        const data = await response.json();
        const price = data['bitzero'] ? data['bitzero'].usd : null;
        if (bitPriceDisplay) {
            const txt = price !== null ? price.toFixed(4) : 'N/A';
            bitPriceDisplay.textContent = txt;
            bitPriceDisplay.setAttribute('data-text', txt);
        }
    } catch (error) {
        if(bitPriceDisplay) bitPriceDisplay.textContent = 'N/A';
    } finally {
        if(priceSpinner) priceSpinner.style.display = 'none';
    }
}

async function runSuccessAnimation(message) {
  const loader = document.getElementById('loader');
  const spinner = loader.querySelector('.spinner');
  const loaderMessage = document.getElementById('loaderMessage');
  const binaryEl = document.getElementById('binaryAnimation');

  if (!loader || !spinner || !loaderMessage || !binaryEl) return;
  
  loader.classList.add('show');
  spinner.style.display = 'none';
  loaderMessage.innerText = message;
  binaryEl.style.display = 'block';
  binaryEl.innerText = '';
  
  let currentString = '';
  await new Promise(resolve => {
    let i = 0;
    const intervalId = setInterval(() => {
      if (i >= 20) {
        clearInterval(intervalId);
        resolve();
      }
      currentString += Math.round(Math.random());
      binaryEl.innerText = currentString;
      i++;
    }, 50);
  });
  
  await new Promise(resolve => setTimeout(resolve, 800));
  
  loader.classList.remove('show');
  spinner.style.display = 'inline-block';
  loaderMessage.innerText = 'Loading...'; 
  binaryEl.style.display = 'none';
}

function applyProposalFilter() {
    const queryInput = document.getElementById('proposalSearch');
    if (!queryInput) return;
    const query = queryInput.value.toLowerCase();
    const items = document.querySelectorAll('#proposalList .proposal-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? '' : 'none';
    });
}

async function setInputMax() {
    if (!window.userAccount || !tokenContract) return;
    try {
        const balance = await tokenContract.methods.balanceOf(window.userAccount).call();
        const formattedBalance = window.web3.utils.fromWei(balance, 'ether');
        const input = document.getElementById('amountInput');
        if(input) {
            input.value = formattedBalance;
            input.dispatchEvent(new Event('input'));
        }
    } catch (e) {
        console.error("Max error:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchBitPrice();
    setInterval(fetchBitPrice, 60000);
});
