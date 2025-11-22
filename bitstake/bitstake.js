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
        console.error(`No configuration found for networkId: ${networkId}`);
        currentConfig = networkConfig['8453'];
        if (networkSwitcherEl) networkSwitcherEl.value = '8453';
    }

    tokenAddress = currentConfig.tokenAddress;
    bitstakeAddress = currentConfig.bitstakeAddress;
    bitdaoAddress = currentConfig.bitdaoAddress;
    validatorRegistryAddress = currentConfig.validatorRegistryAddress;
    ETH_CHAIN_ID = currentConfig.chainId;
    ETH_PARAMS = currentConfig.params;
    if (window.ethereum) {
        if (!window.web3 || !window.web3.eth) {
            console.log("Re-initializing Web3 library...");
            window.web3 = new Web3(window.ethereum);
        }
    }

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
    } else {
        console.warn("Web3 environment not ready yet. Waiting for wallet connection.");
    }
}

document.getElementById('amountInput').addEventListener('input', async function() {
    if (!window.userAccount || !tokenContract) return;
    
    const inputVal = parseFloat(this.value);
    const balanceWei = await tokenContract.methods.balanceOf(window.userAccount).call();
    const balanceEth = parseFloat(window.web3.utils.fromWei(balanceWei, 'ether'));

    if (inputVal > balanceEth) {
        this.style.borderColor = 'red';
        this.style.color = 'red';
    } else {
        this.style.borderColor = 'var(--border-color)';
        this.style.color = 'var(--text-color)';
    }
});

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
    document.getElementById('proposalModal').style.display = 'flex';
}

function closeProposalModal() {
    document.getElementById('proposalModal').style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeProposalModal();
    }
}

function disconnectWallet() {
    window.web3 = null;
    window.userAccount = null;
    tokenContract = null;
    stakingContract = null;
    daoContract = null;
    validatorRegistryContract = null;
    selectedValidator = null;
	selectedValidatorName = 'None';
    const elValidatorDisplay = document.getElementById('selectedValidatorDisplay');
    const elValidatorList = document.getElementById('validatorList');
    const elWalletAddr = document.getElementById('walletAddressDisplay');
    const elConnectBtn = document.getElementById('connect-btn');
    const elWalletInfo = document.getElementById('walletInfoDisplay');
    const elStakingSec = document.getElementById('stakingSection');
    const elConnMsg = document.getElementById('connectMessage');
    document.getElementById('Balance').innerText = '0.000000';
    document.getElementById('totalStaked').innerText = '0.000000';
    document.getElementById('pendingReward').innerText = '0.000000';
    document.getElementById('totalBitZeroInChain').innerText = '0.000000';
    document.getElementById('stakeBar').style.width = '0%';
    document.getElementById('stakePercentDisplay').innerText = '0.00%';
    document.getElementById('estimatedReward').innerHTML = '&nbsp;';
    document.getElementById('rewardRateDisplay').innerText = 'N/A';
    document.getElementById('aprDisplay').innerText = '0.00';
    document.getElementById('tvlDisplay').innerText = '0.00';
    document.getElementById('amountInput').value = '';

    if (elValidatorDisplay) elValidatorDisplay.innerText = 'None';
    if (elValidatorList) elValidatorList.innerHTML = '<p class="no-transactions">> Connect wallet to see validators.</p>';
    if (elWalletAddr) elWalletAddr.innerText = '...';
    
    if (elConnectBtn) {
        elConnectBtn.innerText = '[ Connect Wallet ]';
        elConnectBtn.style.color = '#00ffff';
        elConnectBtn.style.borderColor = '#00ffff';
        elConnectBtn.style.display = 'inline-block';
    }

    if (elWalletInfo) elWalletInfo.style.display = 'none';
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
                copyButton.textContent = 'Failed';
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

async function copyWalletAddress() {
    if (!window.userAccount) return;
    try {
        await navigator.clipboard.writeText(window.userAccount);
        showTxNotification(null, "Wallet address copied!", false);
    } catch (err) {
        console.error('Failed to copy address:', err);
    }
}

async function switchNetwork(networkId) {
    if (!window.ethereum) return showTxNotification(null, "Wallet not found", true);

    const config = networkConfig[networkId];
    if (!config) {
        return showTxNotification(null, `Invalid network configuration for ID: ${networkId}`, true);
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: config.chainId }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
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
    
    setCurrentConfig(networkSwitcherEl ? networkSwitcherEl.value : '8453');

    const amountInput = document.getElementById('amountInput');
    if (amountInput) {
        amountInput.addEventListener('input', estimateReward);
    }
    
    displayTransactionHistory();
    setInterval(autoUpdatePendingRewards, 1000);
    setInterval(updateStakingInfo, 3000);
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
      document.getElementById('validatorList').scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        throw new Error("You are already delegated to another validator. Please undelegate all tokens first before delegating to a new one.");
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
    hideLoader(); 
  } finally {
    enableInteractionButtons();
  }
}

async function delegateAllTokens() {
  if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected or transaction in progress.", true);
  if (!selectedValidator) {
      showTxNotification(null, "Please select a validator from the list first.", true);
      document.getElementById('validatorList').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
  }
  disableInteractionButtons();
  showLoader("Checking current delegation status...");
  try {
    const currentDelegation = await stakingContract.methods.getDelegation(window.userAccount).call();
    const hasExistingDelegation = currentDelegation.validator !== '0x0000000000000000000000000000000000000000' && BigInt(currentDelegation.amount) > BigInt(0);
    if (hasExistingDelegation && currentDelegation.validator.toLowerCase() !== selectedValidator.toLowerCase()) {
        throw new Error("You are already delegated to another validator. Please undelegate all tokens first before delegating to a new one.");
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
      showLoader("Approval needed. Confirm in wallet...");
      const approveTx = await tokenContract.methods.approve(stakingContract.options.address, balance)
        .send({ from: window.userAccount });
      showTxNotification(approveTx.transactionHash, "Approval successful!");
    }
    showLoader(`Delegating all (${window.web3.utils.fromWei(balance, 'ether')} BIT) to ${selectedValidatorName}...`);
    const delegateAllTx = await stakingContract.methods.delegate(selectedValidator, balance).send({ from: window.userAccount });
    await runSuccessAnimation("All Tokens Delegated!");
    showTxNotification(delegateAllTx.transactionHash, "All tokens delegated!");
    saveTransaction('Delegate All', window.web3.utils.fromWei(balance, 'ether'), delegateAllTx.transactionHash, Date.now());
    document.getElementById('amountInput').value = '';
    document.getElementById('estimatedReward').innerHTML = '&nbsp;';
    await updateStakingInfo();
    await fetchValidators();
  } catch (error) {
    console.error("Delegate all failed:", error);
    showTxNotification(null, `Delegate all failed: ${error.message || 'Transaction rejected'}`, true);
    hideLoader();
  } finally {
    enableInteractionButtons();
  }
}

async function undelegate() {
  if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected or transaction in progress.", true);

  const amountInput = document.getElementById('amountInput');
  const amount = amountInput.value;
  if (!amount || parseFloat(amount) <= 0) {
      amountInput.style.borderColor = 'red';
      return showTxNotification(null, "Please enter a valid amount to undelegate.", true);
  }
  amountInput.style.borderColor = 'var(--border-color)';
  disableInteractionButtons();
  showLoader("Preparing undelegation...");

  try {
    const weiAmount = window.web3.utils.toWei(amount, 'ether');
    const stakedAmount = await stakingContract.methods.getStaked(window.userAccount).call();
    if (BigInt(weiAmount) > BigInt(stakedAmount)) {
      showTxNotification(null, "You cannot undelegate more than you have staked.", true);
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
    document.getElementById('estimatedReward').innerHTML = '&nbsp;';
    await updateStakingInfo();
    await fetchValidators();
  } catch (err) {
    console.error("Undelegation failed:", err);
    showTxNotification(null, `Undelegation failed: ${err.message || 'Transaction rejected'}`, true);
    hideLoader();
  } finally {
    enableInteractionButtons();
  }
}

async function undelegateAllTokens() {
  if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected or transaction in progress.", true);

  disableInteractionButtons();
  showLoader("Preparing 'Undelegate All'...");

  try {
    const stakedAmount = await stakingContract.methods.getStaked(window.userAccount).call();
    if (BigInt(stakedAmount) === BigInt(0)) {
        showTxNotification(null, "No tokens to undelegate.", true);
        hideLoader();
        enableInteractionButtons();
        return;
    }

    showLoader(`Undelegating all (${window.web3.utils.fromWei(stakedAmount, 'ether')} BIT)...`);
    const undelegateAllTx = await stakingContract.methods.undelegateAll().send({ from: window.userAccount });
    await updateStakingInfo();
    await fetchValidators();
    await runSuccessAnimation("All Tokens Undelegated!");
    showTxNotification(undelegateAllTx.transactionHash, "All tokens undelegated!");
    saveTransaction('Undelegate All', window.web3.utils.fromWei(stakedAmount, 'ether'), undelegateAllTx.transactionHash, Date.now());
    document.getElementById('amountInput').value = '';
    document.getElementById('estimatedReward').innerHTML = '&nbsp;';
  } catch (error) {
    console.error("Undelegate all failed:", error);
    showTxNotification(null, `Undelegate all failed: ${error.message || 'Transaction rejected'}`, true);
    hideLoader();
  } finally {
    enableInteractionButtons();
  }
}

async function claimReward() {
  if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected or transaction in progress.", true);

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

    showLoader("Confirm claim in wallet...");
    const claimTx = await stakingContract.methods.claimReward().send({ from: window.userAccount });
    await runSuccessAnimation("Reward Claimed!");
    showTxNotification(claimTx.transactionHash, "Reward claimed!");
    saveTransaction('Claim', window.web3.utils.fromWei(pending, 'ether'), claimTx.transactionHash, Date.now());
    await updateStakingInfo();
  } catch (err) {
    console.error("Claim reward failed:", err);
    showTxNotification(null, `Claim failed: ${err.message || 'Transaction rejected'}`, true);
    hideLoader();
  } finally {
    enableInteractionButtons();
  }
}

async function addToken() {
  if (!window.ethereum) return showTxNotification(null, 'No wallet detected.', true);
  
  const selectedNetworkId = networkSwitcherEl ? networkSwitcherEl.value : '8453';
  const config = networkConfig[selectedNetworkId];

  if (!config || !config.tokenAddress) {
      console.error("No token address found for selected network:", selectedNetworkId);
      showTxNotification(null, 'Cannot add token: Configuration error.', true);
      return;
  }

  const tokenSymbol = 'BIT';
  const tokenDecimals = 18;
  const tokenImage = 'https://avatars.githubusercontent.com/u/236363013?v=4';

  try {
    await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: config.tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImage,
        },
      },
    });
  } catch (error) {
    console.error('Failed to add token:', error);
    showTxNotification(null, `Failed to add token: ${error.message}`, true);
  }
}

async function autoUpdatePendingRewards() {
    if (!window.userAccount || !stakingContract || isTxInProgress) {
        return; 
    }

    try {
        const pendingReward = await stakingContract.methods.pendingReward(window.userAccount).call();
        document.getElementById('pendingReward').innerText = parseFloat(window.web3.utils.fromWei(pendingReward, 'ether')).toFixed(6);
        const claimButton = document.getElementById('claimRewardButton');
        if (claimButton) {
            claimButton.disabled = BigInt(pendingReward) === BigInt(0) || isTxInProgress;
        }

    } catch (error) {
    }
}

async function updateStakingInfo() {
  if (!window.userAccount) {
      console.log("DEBUG: User account not connected yet.");
      return;
  }
  if (!window.web3) {
      console.log("DEBUG: Web3 not initialized.");
      return;
  }
  if (!tokenContract || !stakingContract) {
      console.error("DEBUG: Contracts not loaded. Reloading config...");
      const chainId = await window.web3.eth.getChainId();
      setCurrentConfig(chainId.toString());
      if (!tokenContract || !stakingContract) {
         console.error("DEBUG: Failed to load contracts. Check Network Config addresses.");
         return;
      }
  }

  try {
    showSpinner('balanceSpinner');
    showSpinner('stakedSpinner');
    showSpinner('totalStakedSpinner');
    showSpinner('rewardSpinner');
    showSpinner('aprSpinner');
    showSpinner('tvlSpinner');
    const tokenBalance = await tokenContract.methods.balanceOf(window.userAccount).call();
    const stakedAmount = await stakingContract.methods.getStaked(window.userAccount).call();
    const totalStakedInContract = await stakingContract.methods.totalStaked().call();
    const pendingReward = await stakingContract.methods.pendingReward(window.userAccount).call();
    const rewardRate = await stakingContract.methods.rewardRate().call();
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
    updateStakeBar();

  } catch (error) {
    console.error('DEBUG: Failed to fetch staking info:', error);
    showTxNotification(null, "Error fetching data: " + error.message, true);
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

async function updateStakeBar() {
  if (!tokenContract || !stakingContract) return;
  try {
    const totalStaked = await stakingContract.methods.totalStaked().call();
    const totalSupply = await tokenContract.methods.totalSupply().call();
    const percent = BigInt(totalSupply) > 0 ? (Number(BigInt(totalStaked) * BigInt(10000) / BigInt(totalSupply)) / 100) : 0;
    const formattedPercent = percent.toFixed(2);

    document.getElementById("stakeBar").style.width = `${formattedPercent}%`;
    document.getElementById("stakePercentDisplay").innerText = `${formattedPercent}%`;
  } catch (error) {
    console.error("Error updating stake bar:", error);
  }
}

async function createProposal() {
    if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected or transaction in progress.", true);
    const description = document.getElementById('proposalInput').value;
    if (!description.trim()) return showTxNotification(null, "Proposal description cannot be empty.", true);

    disableInteractionButtons();
    showLoader("Submitting proposal...");

    try {
        const createTx = await daoContract.methods.createProposal(description).send({ from: window.userAccount });
        showTxNotification(createTx.transactionHash, "Proposal created successfully!");
        saveTransaction('Proposal', 'New', createTx.transactionHash, Date.now());
        document.getElementById('proposalInput').value = '';
        await fetchProposals();
    } catch (err) {
        console.error("Proposal creation failed:", err);
        showTxNotification(null, `Proposal failed: ${err.message || 'Transaction rejected'}`, true);
    } finally {
        hideLoader();
        enableInteractionButtons();
        closeProposalModal();
    }
}

async function castVote(proposalId, voteOption) {
    if (!window.userAccount || isTxInProgress) return showTxNotification(null, "Wallet not connected or transaction in progress.", true);
    disableInteractionButtons();
    showLoader(`Casting vote for proposal #${proposalId}...`);

    try {
        const voteTx = await daoContract.methods.vote(proposalId, voteOption).send({ from: window.userAccount });
        showTxNotification(voteTx.transactionHash, "Vote cast successfully!");
        saveTransaction('Vote', `Proposal ${proposalId}`, voteTx.transactionHash, Date.now());
        await fetchProposals();
    } catch (err) {
        console.error("Vote failed:", err);
        showTxNotification(null, `Vote failed: ${err.message || 'Transaction rejected'}`, true);
    } finally {
        hideLoader();
        enableInteractionButtons();
    }
}

async function fetchProposals() {
    if (!daoContract) return;
    const proposalListDiv = document.getElementById('proposalList');
    proposalListDiv.innerHTML = '<p>> Fetching proposals...</p>';

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
            
            let buttonsHTML = '';
            let statusElementId = `proposal-status-${i}`;
            let statusDiv = `<div id="${statusElementId}" class="proposal-status" style="font-size: 0.9em; margin: 5px 0 10px 0;">> Status: Loading...</div>`;
            const nowSeconds = Math.floor(new Date().getTime() / 1000);
            const isExpired = nowSeconds > parseInt(proposal.voteEnd);

            if (proposal.executed) {
                buttonsHTML = '<p class="voted-text">> Proposal executed.</p>';
            } else if (isExpired) {
                buttonsHTML = '<p class="voted-text">> Voting period has ended.</p>';
            } else if (hasVoted) {
                buttonsHTML = '<p class="voted-text">> You have voted.</p>';
            } else {
                buttonsHTML = `
                    <div class="button-group action-buttons">
                        <button onclick="castVote(${i}, 0)">Yes</button>
                        <button onclick="castVote(${i}, 1)">No</button>
                        <button onclick="castVote(${i}, 2)">Abstain</button>
                        <button onclick="castVote(${i}, 3)">No w/ Veto</button>
                    </div>`;
            }
            const descP = document.createElement('p');
            descP.className = 'proposal-desc';
            descP.textContent = proposal.description; 
            proposalDiv.innerHTML = `
                <div class="proposal-header">
                    <strong>Proposal #${i}</strong>
                <span>[Proposer: ${proposal.proposer.slice(0, 10)}...]</span>
            </div>
            
            ${statusDiv} <div class="proposal-votes">
                <span>Yes: ${parseFloat(proposal.yesVotes).toFixed(2)} BIT</span>
                <span>No: ${parseFloat(proposal.noVotes).toFixed(2)} BIT</span>
            </div>
             <div class="proposal-votes">
                <span>Abstain: ${parseFloat(proposal.abstainVotes).toFixed(2)} BIT</span>
                <span>Veto: ${parseFloat(proposal.noWithVetoVotes).toFixed(2)} BIT</span>
            </div>
            ${buttonsHTML}
            `;
            proposalDiv.insertBefore(descP, proposalDiv.children[2]);
            proposalListDiv.appendChild(proposalDiv);
            startProposalCountdown(statusElementId, proposal.voteEnd, proposal.executed, hasVoted);
        }
		applyProposalFilter();
    } catch (error) {
        console.error("Failed to fetch proposals:", error);
        proposalListDiv.innerHTML = '<p class="error">> Error loading proposals.</p>';
    }
}

const activeTimers = {};

function formatTimeLeft(totalSeconds) {
    if (totalSeconds <= 0) {
        return "0s";
    }

    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
}

function startProposalCountdown(elementId, endTimeUnix, executed, hasVoted) {
    const timerElement = document.getElementById(elementId);
    if (!timerElement) return;
    if (activeTimers[elementId]) {
        clearInterval(activeTimers[elementId]);
    }

    const endTime = parseInt(endTimeUnix) * 1000;

    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = endTime - now;
        
        if (executed) {
            timerElement.innerHTML = `> Status: <span style="color: #0f0;">Executed</span>`;
            clearInterval(activeTimers[elementId]);
            delete activeTimers[elementId];
        } else if (distance < 0) {
            timerElement.innerHTML = `> Status: <span style="color: #f00;">Ended</span>`;
            clearInterval(activeTimers[elementId]);
            delete activeTimers[elementId];
        } else if (hasVoted) {
            const timeLeft = formatTimeLeft(Math.floor(distance / 1000));
            timerElement.innerHTML = `> Time Left: <span style="color: #ff0;">${timeLeft}</span> <span style="color: #aaa;">(Voted)</span>`;
        } else {
            const timeLeft = formatTimeLeft(Math.floor(distance / 1000));
            timerElement.innerHTML = `> Time Left: <span style="color: #ff0;">${timeLeft}</span>`;
        }
    };

    updateTimer();
    activeTimers[elementId] = setInterval(updateTimer, 1000);
}

async function fetchValidators() {
    if (isFetchingValidators) return;
    if (!validatorRegistryContract) return;
    isFetchingValidators = true;
    const listEl = document.getElementById('validatorList');

    try {
        listEl.innerHTML = '<p class="no-transactions">> Fetching validator list...</p>';

        const validatorAddresses = await validatorRegistryContract.methods.getValidators().call();
        
        if (!validatorAddresses || validatorAddresses.length === 0) {
            listEl.innerHTML = '<p class="no-transactions">> No validators found on this network.</p>';
            return;
        }

        listEl.innerHTML = '';
        const displayedValidators = {}; 
        
        let delegationInfo = null;
        try {
            delegationInfo = await stakingContract.methods.getDelegation(window.userAccount).call(); 
        } catch (e) {
            console.warn("Could not fetch user's current delegation.", e.message);
        }

        for (const address of validatorAddresses) {
            const lowerCaseAddress = address.toLowerCase();

            if (displayedValidators[lowerCaseAddress]) {
                continue;
            }
            
            let name = `Validator ${address.slice(0, 6)}...${address.slice(-4)}`;
            let totalStaked = "N/A";
            let exists = false;
            let commissionRate = "N/A";

            try {
                const info = await validatorRegistryContract.methods.getValidatorInfo(address).call();
                name = info.name || name; 
                exists = info.exists;
                if (info.commissionRate) {
                    const rate = parseInt(info.commissionRate);
                    const percentage = (rate / 100).toFixed(2); 
                    commissionRate = `${percentage}%`;
                }

                if (!exists) {
                     displayedValidators[lowerCaseAddress] = true;
                    continue; 
                }
                
                const totalDelegatedWei = await stakingContract.methods.getTotalDelegated(address).call();
                totalStaked = parseFloat(window.web3.utils.fromWei(totalDelegatedWei, 'ether')).toLocaleString();

            } catch (e) {
                console.warn(`Could not get details for validator ${address}.`, e.message);
                continue;
            }

            displayedValidators[lowerCaseAddress] = true; 
     
            const explorerUrl = (ETH_PARAMS) ? ETH_PARAMS.blockExplorerUrls[0] : '#';
            const validatorUrl = `${explorerUrl}address/${address}`;

            const item = document.createElement('div');
            item.className = 'validator-item'; 
            item.innerHTML = `
                <div>
                    <strong>${name}</strong>
                    <a href="${validatorUrl}" target="_blank" class="validator-address-link" title="View the address in explorer">
                        <span class="validator-address">[${address.slice(0, 10)}...]</span>
                    </a>
                </div>
                <div class="validator-stats">
                    <span class="validator-commission" title="Commission Rate">Commission: ${commissionRate}</span>
                    <span class="validator-stake">Staked: ${totalStaked} BIT</span>
                </div>
            `;
            
            item.onclick = (e) => {
                if (e.target.closest('a')) {
                    e.stopPropagation();
                    return;
                }
                selectValidator(address, name);
            };
            
            if (delegationInfo && delegationInfo.validator && delegationInfo.validator.toLowerCase() === address.toLowerCase()) {
                item.classList.add('selected');
                selectedValidator = address;
                selectedValidatorName = name;
                document.getElementById('selectedValidatorDisplay').innerText = `${name} [${address.slice(0, 6)}...]`;
            } else if (selectedValidator && selectedValidator.toLowerCase() === address.toLowerCase()) {
                item.classList.add('selected');
            }
            listEl.appendChild(item);
        }

    } catch (error) {
        console.error("Failed to fetch validators:", error);
        listEl.innerHTML = `<p class="no-transactions error">> Error loading validators: ${error.message}</p>`;
    } finally {
        isFetchingValidators = false;
    }
}

function selectValidator(address, name) {
    selectedValidator = address;
    selectedValidatorName = name;
    const explorerUrl = (ETH_PARAMS) ? ETH_PARAMS.blockExplorerUrls[0] : '#';
    const validatorUrl = `${explorerUrl}address/${address}`;
    document.getElementById('selectedValidatorDisplay').innerHTML = `
        ${name} 
        <a href="${validatorUrl}" target="_blank" title="View the address in explorer">
            [${address.slice(0, 6)}...]
        </a>
    `;
    
    const items = document.querySelectorAll('.validator-item');
    items.forEach(item => {
        if (item.innerHTML.includes(address)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    showTxNotification(null, `Selected validator: ${name}`, false);
}

async function registerValidator() {
  if (!window.userAccount || isTxInProgress) {
    return showTxNotification(null, "Wallet not connected or transaction in progress.", true);
  }
  if (!validatorRegistryContract) {
    return showTxNotification(null, "Validator Registry contract not loaded.", true);
  }

  const name = document.getElementById('validator_name').value;
  const commissionRate = document.getElementById('validator_commission').value;
  
  if (!name.trim()) {
    return showTxNotification(null, "Validator name cannot be empty.", true);
  } 
  const rate = parseInt(commissionRate);
  if (isNaN(rate) || rate < 0 || rate > 10000) {
    return showTxNotification(null, "Commission rate must be a number between 0 and 10000.", true);
  } 

  disableInteractionButtons();
  showLoader("Registering validator...");

  try {
    const registerTx = await validatorRegistryContract.methods
      .registerValidator(name, rate)
      .send({ from: window.userAccount });

    showTxNotification(registerTx.transactionHash, "Validator registered successfully!");
    await fetchValidators(); 
    document.getElementById('validator_name').value = '';
    document.getElementById('validator_commission').value = '';

  } catch (err) {
    console.error("Validator registration failed:", err);
    showTxNotification(null, `Registration failed: ${err.message || 'Transaction rejected. Are you the owner?'}`, true);
  } finally {
    hideLoader();
    enableInteractionButtons();
  }
}

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitzero&vs_currencies=usd';
const GLITCH_INTERVAL = 5000;
const GLITCH_DURATION = 500;

async function fetchBitPrice() {
    const bitPriceDisplay = document.getElementById('bitPriceDisplay');
    const priceSpinner = document.getElementById('priceSpinner');
    if(priceSpinner) priceSpinner.style.display = 'inline-block';

    try {
        const response = await fetch(COINGECKO_API_URL);
        const data = await response.json();
        const price = data['bitzero'] ? data['bitzero'].usd : null;
        if (price !== null) {
            const formattedPrice = price.toFixed(4);
            bitPriceDisplay.textContent = formattedPrice;
            bitPriceDisplay.setAttribute('data-text', formattedPrice);
        } else {
            bitPriceDisplay.textContent = 'N/A';
            bitPriceDisplay.setAttribute('data-text', 'N/A');
        }
    } catch (error) {
        console.warn('Error fetching BIT price (Token might not be listed on CG yet):', error);
        bitPriceDisplay.textContent = 'N/A';
        bitPriceDisplay.setAttribute('data-text', 'N/A');
    } finally {
        if(priceSpinner) priceSpinner.style.display = 'none';
    }
}

function activatePriceGlitch() {
    const bitPriceElement = document.getElementById('bitPriceDisplay');
    if (bitPriceElement && !bitPriceElement.classList.contains('active')) {
        bitPriceElement.classList.add('active');
        setTimeout(() => {
            bitPriceElement.classList.remove('active');
        }, GLITCH_DURATION);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchBitPrice();
    setInterval(fetchBitPrice, 60000);
    setInterval(activatePriceGlitch, GLITCH_INTERVAL); 
});

async function runSuccessAnimation(message) {
  const loader = document.getElementById('loader');
  const spinner = loader.querySelector('.spinner');
  const loaderMessage = document.getElementById('loaderMessage');
  const binaryEl = document.getElementById('binaryAnimation');

  if (!loader || !spinner || !loaderMessage || !binaryEl) {
      return;
  }
  loader.classList.add('show');
  spinner.style.display = 'none';
  loaderMessage.innerText = message;
  binaryEl.style.display = 'block';
  binaryEl.innerText = '';
  const targetLength = 30;
  let currentString = '';
  await new Promise(resolve => {
    let i = 0;
    const intervalId = setInterval(() => {
      if (i >= targetLength) {
        clearInterval(intervalId);
        resolve();
        return;
      }
      currentString += Math.round(Math.random());
      binaryEl.innerText = currentString;
      i++;
    }, 100);
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
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
        if (text.includes(query)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

async function setInputMax() {
    if (!window.userAccount || !tokenContract) return;
    try {
        const balance = await tokenContract.methods.balanceOf(window.userAccount).call();
        const formattedBalance = window.web3.utils.fromWei(balance, 'ether');
        document.getElementById('amountInput').value = formattedBalance;
        document.getElementById('amountInput').dispatchEvent(new Event('input'));
    } catch (e) {
        console.error("Error setting max balance:", e);
    }
}