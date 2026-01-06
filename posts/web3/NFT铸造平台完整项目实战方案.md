---
title: NFT铸造平台完整项目实战方案
date: 2025-10-27
summary: 基于Next.js和Solidity的NFT铸造平台开发全流程指南，包含前端实现、智能合约开发、部署发布的完整步骤。
tags:
  - web3
  - nft
  - nextjs
  - solidity
---

# NFT铸造平台完整项目实战方案

## 1. 项目概述与架构设计

### 1.1 项目目标
开发一个功能完整的NFT铸造平台，支持用户连接钱包、查看NFT集合、铸造新NFT、管理个人NFT资产等核心功能。

### 1.2 技术架构

**前端技术栈：**
- Next.js 16.0.0 (React 19.2.0)
- TypeScript
- Tailwind CSS 4.0.0
- Ethers 6.15.0
- Wagmi 2.18.1
- RainbowKit 2.2.9
- Viem 2.38.3
- Zustand 5.0.8

**后端技术栈：**
- Solidity 0.8.28
- Hardhat 3.0.9
- IPFS (用于存储NFT元数据)
- Alchemy/Infura (区块链节点服务)

### 1.3 系统架构图

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│    前端应用     │────▶│    区块链网络     │◀────│  智能合约 (ERC721) │
│  (Next.js +     │     │  (以太坊/Polygon) │     │  ┌───────────────┐
│   Wagmi +       │     └───────────────────┘     │  │  IPFS 存储    │
│  RainbowKit)    │                               │  └───────────────┘
└─────────────────┘                               └─────────────────┘
```

## 2. 智能合约开发

### 2.1 项目初始化

1. 创建项目目录并初始化Hardhat项目
```bash
mkdir nft-platform-contracts
cd nft-platform-contracts
npm init -y
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers @nomiclabs/hardhat-waffle ethereum-waffle chai @openzeppelin/contracts dotenv
npx hardhat init
```

2. 配置Hardhat环境

```javascript
// hardhat.config.js
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};
```

### 2.2 ERC721智能合约实现

```solidity
// contracts/NFTPlatform.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTPlatform is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // 铸造价格
    uint256 public mintPrice = 0.01 ether;
    
    // 最大铸造数量
    uint256 public maxSupply = 10000;
    
    // 是否暂停铸造
    bool public paused = false;
    
    // 元数据URI前缀
    string private _baseTokenURI;
    
    event NFTMinted(uint256 indexed tokenId, address indexed owner, string tokenURI);
    event MintPriceChanged(uint256 newPrice);
    event PausedChanged(bool isPaused);
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) {
        _baseTokenURI = baseTokenURI;
    }
    
    // 内部函数：获取基础URI
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    // 设置基础URI（仅管理员）
    function setBaseTokenURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    // 更改铸造价格（仅管理员）
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
        emit MintPriceChanged(newPrice);
    }
    
    // 暂停/恢复铸造（仅管理员）
    function setPaused(bool _paused) public onlyOwner {
        paused = _paused;
        emit PausedChanged(_paused);
    }
    
    // 铸造NFT
    function mintNFT(string memory tokenURI) public payable returns (uint256) {
        require(!paused, "Minting is paused");
        require(_tokenIds.current() < maxSupply, "Maximum supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(msg.sender, newTokenId);
        if (bytes(tokenURI).length > 0) {
            _setTokenURI(newTokenId, tokenURI);
        }
        
        emit NFTMinted(newTokenId, msg.sender, tokenURI);
        
        return newTokenId;
    }
    
    // 批量铸造NFT（仅管理员）
    function mintBatchNFT(address recipient, uint256 quantity, string memory baseTokenURI) public onlyOwner returns (uint256[] memory) {
        require(!paused, "Minting is paused");
        require(_tokenIds.current() + quantity <= maxSupply, "Exceeds maximum supply");
        
        uint256[] memory newTokenIds = new uint256[](quantity);
        
        for (uint256 i = 0; i < quantity; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();
            
            _safeMint(recipient, newTokenId);
            if (bytes(baseTokenURI).length > 0) {
                _setTokenURI(newTokenId, string(abi.encodePacked(baseTokenURI, Strings.toString(newTokenId))));
            }
            
            newTokenIds[i] = newTokenId;
            emit NFTMinted(newTokenId, recipient, baseTokenURI);
        }
        
        return newTokenIds;
    }
    
    // 提取合约中的ETH（仅管理员）
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // 获取当前总供应量
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}
```

### 2.3 编写合约测试

```javascript
// test/NFTPlatform.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTPlatform", function () {
  let NFTPlatform;
  let nftPlatform;
  let owner;
  let addr1;
  let addr2;
  const initialMintPrice = ethers.utils.parseEther("0.01");
  const baseURI = "https://ipfs.io/ipfs/collection/";

  beforeEach(async function () {
    NFTPlatform = await ethers.getContractFactory("NFTPlatform");
    [owner, addr1, addr2] = await ethers.getSigners();
    nftPlatform = await NFTPlatform.deploy("MyNFT", "MNFT", baseURI);
    await nftPlatform.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftPlatform.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await nftPlatform.name()).to.equal("MyNFT");
      expect(await nftPlatform.symbol()).to.equal("MNFT");
    });

    it("Should set the correct mint price", async function () {
      expect(await nftPlatform.mintPrice()).to.equal(initialMintPrice);
    });
  });

  describe("Minting", function () {
    it("Should allow minting when not paused", async function () {
      await expect(
        nftPlatform.connect(addr1).mintNFT("token.json", { value: initialMintPrice })
      ).to.emit(nftPlatform, "NFTMinted");

      expect(await nftPlatform.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should not allow minting with insufficient payment", async function () {
      await expect(
        nftPlatform.connect(addr1).mintNFT("token.json", { value: ethers.utils.parseEther("0.001") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should pause and unpause minting", async function () {
      await nftPlatform.setPaused(true);
      await expect(
        nftPlatform.connect(addr1).mintNFT("token.json", { value: initialMintPrice })
      ).to.be.revertedWith("Minting is paused");

      await nftPlatform.setPaused(false);
      await expect(
        nftPlatform.connect(addr1).mintNFT("token.json", { value: initialMintPrice })
      ).to.emit(nftPlatform, "NFTMinted");
    });
  });

  describe("Admin functions", function () {
    it("Should allow owner to set mint price", async function () {
      const newPrice = ethers.utils.parseEther("0.02");
      await nftPlatform.setMintPrice(newPrice);
      expect(await nftPlatform.mintPrice()).to.equal(newPrice);
    });

    it("Should allow owner to withdraw ETH", async function () {
      await nftPlatform.connect(addr1).mintNFT("token.json", { value: initialMintPrice });
      const ownerBalanceBefore = await owner.getBalance();
      await nftPlatform.withdraw();
      const ownerBalanceAfter = await owner.getBalance();
      expect(ownerBalanceAfter.gt(ownerBalanceBefore)).to.be.true;
    });
  });
});
```

### 2.4 部署脚本

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  // 获取要部署的合约
  const NFTPlatform = await hre.ethers.getContractFactory("NFTPlatform");
  
  // 部署参数
  const name = "AwesomeNFTCollection";
  const symbol = "ANFT";
  const baseURI = "https://ipfs.io/ipfs/QmYourCollectionBaseURI/";
  
  // 部署合约
  console.log("Deploying NFTPlatform...");
  const nftPlatform = await NFTPlatform.deploy(name, symbol, baseURI);
  
  // 等待部署完成
  await nftPlatform.deployed();
  
  // 输出合约地址
  console.log("NFTPlatform deployed to:", nftPlatform.address);
  
  // 验证合约（如果有必要）
  // 注意：需要在Etherscan上验证合约时使用
  if (hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await nftPlatform.deployTransaction.wait(5);
    
    try {
      console.log("Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: nftPlatform.address,
        constructorArguments: [name, symbol, baseURI],
      });
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 2.5 编译和部署合约

```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 部署到测试网（Sepolia）
# 注意：确保.env文件中有正确的私钥和Infura API密钥
npx hardhat run scripts/deploy.js --network sepolia
```

## 3. 前端项目开发

### 3.1 项目初始化

1. 创建Next.js项目
```bash
mkdir nft-platform-frontend
cd nft-platform-frontend
npx create-next-app@latest . --typescript --tailwind --eslint
```

2. 安装必要的依赖
```bash
npm install ethers@6.15.0 wagmi@2.18.1 @rainbow-me/rainbowkit@2.2.9 viem@2.38.3 zustand@5.0.8 @tanstack/react-query
```

### 3.2 项目配置

创建配置文件：

```javascript
// src/config.js

export const config = {
  // 合约地址（从部署脚本中获取）
  contractAddresses: {
    sepolia: "0xYourContractAddressOnSepolia",
    mumbai: "0xYourContractAddressOnMumbai",
  },
  // 合约ABI（从编译后的合约中获取）
  contractAbi: [
    /* 此处粘贴合约ABI */
  ],
  // 网络配置
  networks: {
    sepolia: {
      chainId: 11155111,
      name: "Sepolia",
      rpcUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    mumbai: {
      chainId: 80001,
      name: "Mumbai",
      rpcUrl: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
  },
  // IPFS配置
  ipfs: {
    gateway: "https://ipfs.io/ipfs/",
  },
};
```

### 3.3 设置Wagmi和RainbowKit

```typescriptx
// src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, configureChains } from 'wagmi';
import { mainnet, sepolia, polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// 创建QueryClient实例
const queryClient = new QueryClient();

// 配置链和提供者
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, sepolia, polygonMumbai],
  [publicProvider()]
);

// 创建Wagmi配置
const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
});

// 导出Providers组件
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          chains={chains}
          theme={darkTheme({
            accentColor: '#FF4560',
            accentColorForeground: 'white',
            borderRadius: 'small',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

```typescriptx
// src/app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 3.4 创建NFT元数据上传组件

```typescriptx
// src/components/NFTUploader.tsx
'use client';

import React, { useState } from 'react';
import axios from 'axios';

type NFTMetadata = {
  name: string;
  description: string;
  image: string; // IPFS hash
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
};

const NFTUploader: React.FC<{
  onMetadataUploaded: (metadataUri: string) => void;
}> = ({ onMetadataUploaded }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // 处理图片上传到IPFS
  const uploadImageToIPFS = async (file: File): Promise<string> => {
    // 这里使用Pinata API作为示例，实际项目中可以替换为其他IPFS服务
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
        }
      );
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading image to IPFS:', error);
      throw new Error('图片上传失败');
    }
  };

  // 处理元数据上传到IPFS
  const uploadMetadataToIPFS = async (metadata: NFTMetadata): Promise<string> => {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
        }
      );
      return `ipfs://${response.data.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading metadata to IPFS:', error);
      throw new Error('元数据上传失败');
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsUploading(true);

    try {
      if (!image) {
        throw new Error('请上传NFT图片');
      }

      if (!name.trim()) {
        throw new Error('请输入NFT名称');
      }

      // 上传图片到IPFS
      const imageHash = await uploadImageToIPFS(image);
      
      // 创建元数据对象
      const metadata: NFTMetadata = {
        name,
        description,
        image: `ipfs://${imageHash}`,
        attributes: [], // 可以根据需要添加属性
      };

      // 上传元数据到IPFS
      const metadataUri = await uploadMetadataToIPFS(metadata);
      
      // 通知父组件元数据上传成功
      onMetadataUploaded(metadataUri);
      
      // 重置表单
      setName('');
      setDescription('');
      setImage(null);
    } catch (err: any) {
      setError(err.message || '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 处理图片预览
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">上传NFT素材</h2>
      
      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-white mb-2">NFT名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
            placeholder="输入NFT名称"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-white mb-2">NFT描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded h-32"
            placeholder="输入NFT描述"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-white mb-2">NFT图片</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
          />
          {image && (
            <div className="mt-2">
              <img
                src={URL.createObjectURL(image)}
                alt="NFT预览"
                className="max-w-xs max-h-48 object-contain"
              />
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isUploading}
          className={`w-full py-2 px-4 bg-blue-600 text-white rounded ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
        >
          {isUploading ? '上传中...' : '上传并创建NFT'}
        </button>
      </form>
    </div>
  );
};

export default NFTUploader;
```

### 3.5 创建NFT铸造组件

```typescriptx
// src/components/MintNFT.tsx
'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import NFTUploader from './NFTUploader';
import { config } from '../config';

const MintNFT: React.FC = () => {
  const { address } = useAccount();
  const [metadataUri, setMetadataUri] = useState<string>('');
  const [mintPrice, setMintPrice] = useState<string>('0.01');
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // 使用Wagmi v2的useWriteContract钩子
  const { writeContract, data: hash } = useWriteContract();
  
  // 等待交易完成
  const { isLoading: isTransactionPending, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // 处理元数据上传完成
  const handleMetadataUploaded = (uri: string) => {
    setMetadataUri(uri);
  };

  // 处理铸造NFT
  const handleMint = async () => {
    if (!address) {
      setError('请先连接钱包');
      return;
    }

    if (!metadataUri) {
      setError('请先上传NFT素材');
      return;
    }

    setError('');
    setIsMinting(true);

    try {
      // 获取当前链ID
      const chainId = window.ethereum?.chainId;
      if (!chainId) {
        throw new Error('无法获取当前链信息');
      }

      // 根据链ID获取合约地址
      const contractAddress = config.contractAddresses[chainId];
      if (!contractAddress) {
        throw new Error('当前网络未部署合约');
      }

      // 调用合约铸造NFT
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: config.contractAbi,
        functionName: 'mintNFT',
        args: [metadataUri],
        value: parseEther(mintPrice),
      });
    } catch (err: any) {
      setError(err.message || '铸造失败');
      setIsMinting(false);
    }
  };

  // 监听交易状态变化
  React.useEffect(() => {
    if (isTransactionSuccess) {
      setSuccess('NFT铸造成功！');
      setIsMinting(false);
      setMetadataUri('');
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(''), 3000);
    } else if (!isTransactionPending && hash) {
      setIsMinting(false);
    }
  }, [isTransactionSuccess, isTransactionPending, hash]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-white mb-8">NFT铸造平台</h1>
      
      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>
      )}
      
      {success && (
        <div className="bg-green-500 text-white p-3 rounded mb-4">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <NFTUploader onMetadataUploaded={handleMetadataUploaded} />
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-4">铸造NFT</h2>
          
          {metadataUri ? (
            <div className="mb-4 p-4 bg-gray-700 rounded">
              <p className="text-white">元数据已准备就绪</p>
              <p className="text-gray-400 text-sm break-all">{metadataUri}</p>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-gray-700 rounded text-gray-400">
              请先上传NFT素材
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-white mb-2">铸造价格 (ETH)</label>
            <input
              type="text"
              value={mintPrice}
              onChange={(e) => setMintPrice(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
              disabled
            />
          </div>
          
          <button
            onClick={handleMint}
            disabled={!metadataUri || isMinting || isTransactionPending}
            className={`w-full py-3 px-4 bg-blue-600 text-white rounded font-medium ${(!metadataUri || isMinting || isTransactionPending) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            {isMinting || isTransactionPending ? '铸造中...' : '铸造NFT'}
          </button>
          
          {hash && (
            <div className="mt-4 text-sm text-gray-400">
              <p>交易哈希: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{hash}</a></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MintNFT;
```

### 3.6 创建NFT展示组件

```typescriptx
// src/components/NFTGallery.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { config } from '../config';
import axios from 'axios';

type NFTMetadata = {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
};

type NFTItem = {
  tokenId: number;
  owner: string;
  metadata?: NFTMetadata;
};

const NFTGallery: React.FC = () => {
  const { address } = useAccount();
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 获取合约总供应量
  const { data: totalSupply } = useContractRead({
    address: config.contractAddresses.sepolia as `0x${string}`,
    abi: config.contractAbi,
    functionName: 'totalSupply',
  });

  // 获取NFT数据
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!totalSupply || Number(totalSupply) === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const nftPromises = [];
        
        // 获取每个NFT的信息
        for (let i = 1; i <= Number(totalSupply); i++) {
          nftPromises.push(fetchNFTData(i));
        }
        
        const results = await Promise.all(nftPromises);
        const validNFTs = results.filter(nft => nft !== null) as NFTItem[];
        
        // 如果用户已连接钱包，只显示用户的NFT
        const userNFTs = address 
          ? validNFTs.filter(nft => nft.owner.toLowerCase() === address.toLowerCase())
          : validNFTs;
        
        setNfts(userNFTs);
      } catch (err) {
        setError('获取NFT数据失败');
        console.error('Error fetching NFTs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [totalSupply, address]);

  // 获取单个NFT数据
  const fetchNFTData = async (tokenId: number): Promise<NFTItem | null> => {
    try {
      // 创建ethers实例获取所有者和URI
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        config.contractAddresses.sepolia,
        config.contractAbi,
        provider
      );
      
      const owner = await contract.ownerOf(tokenId);
      const tokenURI = await contract.tokenURI(tokenId);
      
      // 从IPFS获取元数据
      let metadata: NFTMetadata | undefined;
      if (tokenURI) {
        const ipfsUrl = tokenURI.replace('ipfs://', config.ipfs.gateway);
        const response = await axios.get(ipfsUrl);
        metadata = response.data;
      }
      
      return {
        tokenId,
        owner,
        metadata,
      };
    } catch (err) {
      console.error(`Error fetching NFT ${tokenId}:`, err);
      return null;
    }
  };

  // 渲染NFT卡片
  const renderNFTCard = (nft: NFTItem) => {
    if (!nft.metadata) return null;
    
    const imageUrl = nft.metadata.image.replace('ipfs://', config.ipfs.gateway);
    
    return (
      <div key={nft.tokenId} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <div className="relative h-64 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={nft.metadata.name} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-xl font-bold text-white mb-2">{nft.metadata.name}</h3>
          <p className="text-gray-400 text-sm mb-4">{nft.metadata.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">#ID: {nft.tokenId}</span>
            <span className="text-emerald-500 text-sm truncate max-w-[150px]">Owner: {nft.owner.substring(0, 6)}...{nft.owner.substring(nft.owner.length - 4)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold text-white mb-6">我的NFT收藏</h2>
      
      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>
      )}
      
      {loading ? (
        <div className="text-center text-white py-8">加载NFT中...</div>
      ) : nfts.length === 0 ? (
        <div className="text-center text-white py-8">暂无NFT{address ? '，快去铸造你的第一个NFT吧！' : '，请先连接钱包查看你的NFT。'}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {nfts.map(renderNFTCard)}
        </div>
      )}
    </div>
  );
};

export default NFTGallery;
```

### 3.7 创建主页面

```typescriptx
// src/app/page.tsx
'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import MintNFT from '../components/MintNFT';
import NFTGallery from '../components/NFTGallery';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 py-4 px-6 flex justify-between items-center">
        <div className="text-xl font-bold text-blue-500">NFT铸造平台</div>
        <ConnectButton showBalance={true} />
      </nav>
      
      <main className="container mx-auto py-8">
        <MintNFT />
        <NFTGallery />
      </main>
      
      <footer className="bg-gray-800 py-6 mt-12">
        <div className="container mx-auto text-center text-gray-400">
          <p>© 2025 NFT铸造平台 - 基于Next.js和Solidity构建</p>
        </div>
      </footer>
    </div>
  );
}
```

## 4. 部署流程

### 4.1 部署智能合约到主网

```bash
# 部署到以太坊主网
npx hardhat run scripts/deploy.js --network mainnet

# 部署到Polygon主网
npx hardhat run scripts/deploy.js --network polygon
```

### 4.2 部署前端应用

1. 配置环境变量

创建 `.env.production` 文件：
```
NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET=0xYourContractAddressOnMainnet
NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON=0xYourContractAddressOnPolygon
```

2. 构建和部署到Vercel

```bash
# 构建项目
npm run build

# 安装Vercel CLI（如果尚未安装）
npm install -g vercel

# 部署到Vercel
vercel --prod
```

或者可以通过Vercel官方网站进行部署：
1. 登录Vercel账户
2. 导入GitHub仓库
3. 配置环境变量
4. 点击部署

## 5. 项目测试与优化

### 5.1 前端测试

1. 安装测试工具
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

2. 编写基本组件测试

```typescriptx
// src/components/NFTUploader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import NFTUploader from './NFTUploader';

// Mock axios
jest.mock('axios');

describe('NFTUploader Component', () => {
  test('renders correctly', () => {
    render(<NFTUploader onMetadataUploaded={() => {}} />);
    expect(screen.getByText('上传NFT素材')).toBeInTheDocument();
  });

  // Add more tests for component behavior
});
```

### 5.2 性能优化

1. 使用Next.js Image组件优化图片加载
```typescriptx
// 修改NFT展示中的图片加载
import Image from 'next/image';

// 在组件中替换img标签
<Image 
  src={imageUrl} 
  alt={nft.metadata.name} 
  fill 
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={index < 2}
/>
```

2. 使用SWR或React Query进行数据缓存

```typescriptx
// 已在项目中使用了React Query
```

3. 延迟加载非关键组件

```typescriptx
// 修改NFTGallery组件为懒加载
const NFTGallery = dynamic(() => import('../components/NFTGallery'), { ssr: false });
```

## 6. 安全最佳实践

### 6.1 智能合约安全

1. **使用OpenZeppelin库**：利用经过审计的标准合约实现
2. **暂停机制**：实现紧急暂停功能，应对潜在漏洞
3. **重入攻击防护**：使用ReentrancyGuard或检查-效果-交互模式
4. **溢出保护**：使用Solidity 0.8.0+内置溢出检查
5. **权限控制**：严格的管理员权限控制

### 6.2 前端安全

1. **钱包连接验证**：所有交易前检查钱包连接状态
2. **交易参数确认**：向用户展示所有交易参数
3. **避免存储私钥**：永远不在前端存储私钥或助记词
4. **CORS设置**：配置适当的CORS头
5. **HTTPS**：强制使用HTTPS协议

## 7. 常见问题与解决方案

### 7.1 智能合约问题

1. **部署失败**：检查gas价格和网络状态
2. **合约交互错误**：确认ABI和地址匹配，检查函数参数
3. **Gas成本过高**：优化合约代码，批量处理操作

### 7.2 前端问题

1. **钱包连接问题**：确保MetaMask等钱包正确安装和配置
2. **网络切换**：提示用户切换到正确的网络
3. **元数据显示问题**：检查IPFS链接是否可访问

## 8. 项目扩展建议

### 8.1 功能扩展

1. **NFT市场**：添加NFT交易和拍卖功能
2. **批量铸造**：支持批量上传和铸造多个NFT
3. **NFT组合**：创建NFT集合和系列
4. **社区功能**：添加评论、点赞和分享功能

### 8.2 技术扩展

1. **Layer 2支持**：添加Optimism、Arbitrum等L2网络支持
2. **跨链功能**：实现跨链NFT桥接
3. **链下渲染**：使用链下渲染生成复杂NFT
4. **DAO集成**：添加治理功能，让NFT持有者参与平台决策

## 9. 总结

本项目实战方案提供了开发NFT铸造平台的完整步骤，从智能合约开发到前端实现，再到部署和优化。通过使用最新的Web3技术栈，我们构建了一个功能完整、安全可靠的NFT铸造平台。

项目采用模块化设计，便于后续功能扩展和维护。同时，我们也注重用户体验和安全性，确保用户能够便捷安全地创建和管理他们的NFT资产。

通过遵循本方案，开发团队可以快速构建自己的NFT铸造平台，并根据实际需求进行定制和扩展。

## 10. 资源与参考

### 10.1 文档资源

- [Ethereum官方文档](https://ethereum.org/zh/developers/docs/)
- [OpenZeppelin文档](https://docs.openzeppelin.com/)
- [Next.js文档](https://nextjs.org/docs)
- [Wagmi文档](https://wagmi.sh/)
- [RainbowKit文档](https://www.rainbowkit.com/)

### 10.2 开发工具

- [Remix IDE](https://remix.ethereum.org/)
- [Hardhat](https://hardhat.org/)
- [Alchemy](https://www.alchemy.com/)
- [Infura](https://infura.io/)
- [Pinata](https://pinata.cloud/)
- [OpenSea](https://opensea.io/)