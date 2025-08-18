import { useState, useCallback, useRef, useEffect } from 'react';

// 存储状态枚举
const STORAGE_STATUS = {
  IDLE: 'idle',
  STORING: 'storing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RESUMING: 'resuming',
  VERIFYING: 'verifying'
};

// 分块大小：512KB（更小的分块，减少中断影响）
const CHUNK_SIZE = 512 * 1024;

export function useAssetStorage() {
  const [status, setStatus] = useState(STORAGE_STATUS.IDLE);
  const [progress, setProgress] = useState(0);
  const [currentAsset, setCurrentAsset] = useState(null);
  const [error, setError] = useState(null);
  const [totalAssets, setTotalAssets] = useState(0);
  const [storedAssets, setStoredAssets] = useState(0);
  
  // 存储进度信息，用于断点续传
  const progressRef = useRef(new Map());
  const abortControllerRef = useRef(null);
  
  // 初始化 IndexedDB
  const initDB = useCallback(async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AssetStorage', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建资产存储
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetStore.createIndex('type', 'type', { unique: false });
          assetStore.createIndex('status', 'status', { unique: false });
          assetStore.createIndex('url', 'url', { unique: false });
        }
        
        // 创建分块存储
        if (!db.objectStoreNames.contains('chunks')) {
          const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
          chunkStore.createIndex('assetId', 'assetId', { unique: false });
          chunkStore.createIndex('chunkIndex', 'chunkIndex', { unique: false });
        }
        
        // 创建进度存储
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'assetId' });
        }
        
        // 创建元数据存储
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }, []);

  // 分块读取文件（支持断点续传）
  const readFileChunk = useCallback((file, start, end) => {
    return new Promise((resolve, reject) => {
      try {
        console.log(`readFileChunk: Reading chunk ${start}-${end} from ${file.name}`); // 调试日志
        
        const reader = new FileReader();
        const chunk = file.slice(start, end);
        
        console.log(`readFileChunk: Chunk size: ${chunk.size}`); // 调试日志
        
        reader.onload = (e) => {
          console.log(`readFileChunk: Chunk ${start}-${end} read successfully`); // 调试日志
          resolve(e.target.result);
        };
        
        reader.onerror = () => {
          console.error(`readFileChunk: Error reading chunk ${start}-${end}:`, reader.error); // 调试日志
          reject(reader.error);
        };
        
        reader.onabort = () => {
          console.log(`readFileChunk: Chunk ${start}-${end} read aborted`); // 调试日志
          reject(new Error('File read aborted'));
        };
        
        console.log(`readFileChunk: Starting to read chunk ${start}-${end}`); // 调试日志
        reader.readAsArrayBuffer(chunk);
        
        // 支持中断
        if (abortControllerRef.current) {
          console.log(`readFileChunk: Abort controller detected, checking signal...`); // 调试日志
          if (abortControllerRef.current.signal.aborted) {
            console.log(`readFileChunk: Aborting read for chunk ${start}-${end}`); // 调试日志
            reader.abort();
          }
        }
      } catch (error) {
        console.error(`readFileChunk: Error in readFileChunk:`, error); // 调试日志
        reject(error);
      }
    });
  }, []);

  // 计算文件哈希
  const calculateHash = useCallback(async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  // 获取存储的资产 - 移到前面，避免依赖问题
  const getAsset = useCallback(async (assetId) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(['assets'], 'readonly');
      const assetStore = transaction.objectStore('assets');
      
      return new Promise((resolve, reject) => {
        const request = assetStore.get(assetId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('Failed to get asset:', err);
      return null;
    }
  }, [initDB]);

  // 通过 URL 获取已存储的资产
  const getAssetByUrl = useCallback(async (url) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(['assets'], 'readonly');
      const assetStore = transaction.objectStore('assets');
      const urlIndex = assetStore.index('url');

      return await new Promise((resolve, reject) => {
        const request = urlIndex.get(url);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('Failed to get asset by url:', err);
      return null;
    }
  }, [initDB]);

  // 验证资产完整性
  const verifyAsset = useCallback(async (assetId) => {
    try {
      setStatus(STORAGE_STATUS.VERIFYING);
      
      const asset = await getAsset(assetId);
      if (!asset || asset.status !== 'completed') {
        return false;
      }
      
      // 检查所有分块是否存在
      const db = await initDB();
      const transaction = db.transaction(['chunks'], 'readonly');
      const chunkStore = transaction.objectStore('chunks');
      
      const chunks = [];
      for (let i = 0; i < asset.totalChunks; i++) {
        const chunk = await new Promise((resolve, reject) => {
          const request = chunkStore.get(`${assetId}_chunk_${i}`);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        if (!chunk) {
          return false;
        }
        chunks.push(chunk);
      }
      
      setStatus(STORAGE_STATUS.COMPLETED);
      return chunks.length === asset.totalChunks;
    } catch (err) {
      setStatus(STORAGE_STATUS.FAILED);
      setError(err.message);
      return false;
    }
  }, [initDB, getAsset]);

  // 存储单个资产（改进版）
  const storeAsset = useCallback(async (file, type = 'video', metadata = {}) => {
    try {
      console.log(`storeAsset: Starting to store ${file.name}`);
      setStatus(STORAGE_STATUS.STORING);
      setError(null);
      setCurrentAsset({ name: file.name, size: file.size });
      
      console.log(`storeAsset: Initializing database...`);
      const db = await initDB();
      console.log(`storeAsset: Database initialized successfully`);
      
      const assetId = `${type}_${file.name}_${file.size}`;
      console.log(`storeAsset: Asset ID: ${assetId}`);
      
      // 检查是否已经完整存储过
      console.log(`storeAsset: Checking existing asset...`);
      const existingAsset = await getAsset(assetId);
      console.log(`storeAsset: Existing asset:`, existingAsset);
      
      if (existingAsset && existingAsset.status === 'completed') {
        // 验证完整性
        console.log(`storeAsset: Asset already exists, verifying...`);
        const isValid = await verifyAsset(assetId);
        if (isValid) {
          console.log(`storeAsset: Asset verified, returning...`);
          setStatus(STORAGE_STATUS.COMPLETED);
          setProgress(100);
          return { id: assetId, status: 'exists' };
        }
      }
      
      // 创建新的中断控制器
      abortControllerRef.current = new AbortController();
      
      // 计算文件哈希
      console.log(`storeAsset: Calculating hash...`);
      const fileHash = await calculateHash(file);
      console.log(`storeAsset: Hash calculated: ${fileHash}`);
      
      // 获取存储进度
      const progress = progressRef.current.get(assetId) || { storedChunks: 0, totalChunks: 0 };
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      console.log(`storeAsset: Total chunks: ${totalChunks}`);
      
      // 更新进度信息
      progress.totalChunks = totalChunks;
      progressRef.current.set(assetId, progress);
      
      // 存储资产元数据（使用单独的事务）
      console.log(`storeAsset: Storing asset metadata...`);
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(['assets'], 'readwrite');
        const assetStore = transaction.objectStore('assets');
        
        const assetData = {
          id: assetId,
          name: file.name,
          type: type,
          size: file.size,
          hash: fileHash,
          metadata: { ...metadata, contentType: file.type },
          status: 'storing',
          createdAt: new Date().toISOString(),
          totalChunks: totalChunks,
          storedChunks: progress.storedChunks,
          url: `/${type === 'image' ? 'images' : type + 's'}/${file.name}`
        };
        
        const request = assetStore.put(assetData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      console.log(`storeAsset: Asset metadata stored`);
      
      // 存储进度信息（使用单独的事务）
      console.log(`storeAsset: Storing progress info...`);
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(['progress'], 'readwrite');
        const progressStore = transaction.objectStore('progress');
        
        const request = progressStore.put({
          assetId: assetId,
          storedChunks: progress.storedChunks,
          totalChunks: totalChunks,
          lastUpdated: new Date().toISOString()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      console.log(`storeAsset: Progress info stored`);
      
      // 分块存储文件内容（每个分块使用单独的事务）
      console.log(`storeAsset: Starting chunk by chunk storage...`);
      for (let i = progress.storedChunks; i < totalChunks; i++) {
        try {
          // 检查是否被中断
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Storage interrupted by user');
          }
          
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          console.log(`storeAsset: Processing chunk ${i + 1}/${totalChunks} (${start}-${end})`);
          
          console.log(`storeAsset: Reading chunk ${i + 1}...`);
          const chunk = await readFileChunk(file, start, end);
          console.log(`storeAsset: Chunk ${i + 1} read successfully, size: ${chunk.byteLength}`);
          
          // 存储分块（使用单独的事务）
          const chunkData = {
            id: `${assetId}_chunk_${i}`,
            assetId: assetId,
            chunkIndex: i,
            data: chunk,
            timestamp: new Date().toISOString()
          };
          
          console.log(`storeAsset: Storing chunk ${i + 1} to IndexedDB...`);
          await new Promise((resolve, reject) => {
            const transaction = db.transaction(['chunks'], 'readwrite');
            const chunkStore = transaction.objectStore('chunks');
            
            const request = chunkStore.put(chunkData);
            request.onsuccess = () => {
              console.log(`storeAsset: Chunk ${i + 1} stored to IndexedDB`);
              resolve();
            };
            request.onerror = () => {
              console.error(`storeAsset: Failed to store chunk ${i + 1}:`, request.error);
              reject(request.error);
            };
          });
          
          // 更新进度
          progress.storedChunks = i + 1;
          progressRef.current.set(assetId, progress);
          
          // 更新数据库中的进度（使用单独的事务）
          console.log(`storeAsset: Updating progress for chunk ${i + 1}...`);
          await new Promise((resolve, reject) => {
            const transaction = db.transaction(['progress'], 'readwrite');
            const progressStore = transaction.objectStore('progress');
            
            const request = progressStore.put({
              assetId: assetId,
              storedChunks: progress.storedChunks,
              totalChunks: totalChunks,
              lastUpdated: new Date().toISOString()
            });
            request.onsuccess = () => {
              console.log(`storeAsset: Progress updated for chunk ${i + 1}`);
              resolve();
            };
            request.onerror = () => {
              console.error(`storeAsset: Failed to update progress for chunk ${i + 1}:`, request.error);
              reject(request.error);
            };
          });
          
          // 更新UI进度
          const currentProgress = Math.round((progress.storedChunks / totalChunks) * 100);
          setProgress(currentProgress);
          
          console.log(`storeAsset: Chunk ${i + 1} completed, progress: ${currentProgress}%`);
          
          // 每存储几个分块后保存一次进度
          if (i % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        } catch (error) {
          console.error(`storeAsset: Error processing chunk ${i + 1}:`, error);
          throw error;
        }
      }
      
      // 存储完成，更新状态（使用单独的事务）
      console.log(`storeAsset: All chunks stored, updating final status...`);
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(['assets'], 'readwrite');
        const assetStore = transaction.objectStore('assets');
        
        const assetData = {
          id: assetId,
          name: file.name,
          type: type,
          size: file.size,
          hash: fileHash,
          metadata: { ...metadata, contentType: file.type },
          status: 'completed',
          createdAt: new Date().toISOString(),
          totalChunks: totalChunks,
          storedChunks: totalChunks,
          completedAt: new Date().toISOString(),
          url: `/${type === 'image' ? 'images' : type + 's'}/${file.name}`
        };
        
        const request = assetStore.put(assetData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      // 清理进度信息（使用单独的事务）
      progressRef.current.delete(assetId);
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(['progress'], 'readwrite');
        const progressStore = transaction.objectStore('progress');
        
        const request = progressStore.delete(assetId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      console.log(`storeAsset: Asset ${file.name} stored successfully`);
      setStatus(STORAGE_STATUS.COMPLETED);
      setProgress(100);
      setCurrentAsset(null);
      setStoredAssets(prev => prev + 1);
      
      return { id: assetId, status: 'completed' };
      
    } catch (err) {
      console.error(`storeAsset: Error storing ${file.name}:`, err);
      setStatus(STORAGE_STATUS.FAILED);
      setError(err.message);
      throw err;
    }
  }, [initDB, calculateHash, readFileChunk, getAsset, verifyAsset]);

  // 批量存储所有素材
  const storeAllAssets = useCallback(async () => {
    try {
      setStatus(STORAGE_STATUS.STORING);
      setError(null);
      setProgress(0);
      
      // 动态导入配置文件
      const assetsConfig = await import('../assets/assets_config.js');
      const config = assetsConfig.assetsConfig;
      
      console.log('Loaded assets config:', config);
      
      // 从配置文件中获取文件列表
      const assets = [
        { type: 'video', files: config.assets.video.map(file => file.path) },
        { type: 'audio', files: config.assets.audio.map(file => file.path) },
        { type: 'image', files: config.assets.image.map(file => file.path) },
        { type: 'sign', files: config.assets.sign.map(file => file.path) }
      ];
      
      let totalCount = 0;
      let storedCount = 0;
      
      for (const assetType of assets) {
        totalCount += assetType.files.length;
      }
      setTotalAssets(totalCount);
      
      console.log(`Starting to store ${totalCount} assets from config...`);
      console.log('Assets to store:', assets);
      
      // 逐个存储
      for (const assetType of assets) {
        for (const filePath of assetType.files) {
          try {
            console.log(`Fetching ${filePath}...`);
            
            // 测试文件是否可访问
            const response = await fetch(filePath);
            console.log(`Response for ${filePath}:`, {
              ok: response.ok,
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries())
            });
            
            if (response.ok) {
              const blob = await response.blob();
              console.log(`Blob for ${filePath}:`, {
                size: blob.size,
                type: blob.type
              });
              
              // 从文件路径中提取文件名
              const fileName = filePath.split('/').pop();
              const file = new File([blob], fileName, { type: response.headers.get('content-type') });
              console.log(`File created for ${fileName}:`, {
                name: file.name,
                size: file.size,
                type: file.type
              });
              
              console.log(`Storing ${fileName}...`);
              
              // 存储单个文件，并监听其进度
              await storeAsset(file, assetType.type);
              
              storedCount++;
              setStoredAssets(storedCount);
              
              // 更新总体进度
              const overallProgress = Math.round((storedCount / totalCount) * 100);
              setProgress(overallProgress);
              
              console.log(`Stored ${fileName}, progress: ${overallProgress}%`);
            } else {
              console.warn(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            console.error(`Failed to store ${filePath}:`, error);
          }
        }
      }
      
      console.log(`Storage completed: ${storedCount}/${totalCount} assets`);
      setStatus(STORAGE_STATUS.COMPLETED);
      setProgress(100);
      return { total: totalCount, stored: storedCount };
      
    } catch (error) {
      console.error('StoreAllAssets failed:', error);
      setStatus(STORAGE_STATUS.FAILED);
      setError(error.message);
      throw error;
    }
  }, [storeAsset]);

  // 恢复中断的存储
  const resumeStorage = useCallback(async () => {
    try {
      setStatus(STORAGE_STATUS.RESUMING);
      
      const db = await initDB();
      const transaction = db.transaction(['progress'], 'readonly');
      const progressStore = transaction.objectStore('progress');
      
      const progress = await new Promise((resolve, reject) => {
        const request = progressStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const incompleteAssets = progress.filter(p => p.storedChunks < p.totalChunks);
      
      if (incompleteAssets.length > 0) {
        console.log(`Found ${incompleteAssets.length} incomplete assets to resume`);
        // 这里可以实现具体的恢复逻辑
        return incompleteAssets;
      }
      
      return [];
    } catch (err) {
      setStatus(STORAGE_STATUS.FAILED);
      setError(err.message);
      return [];
    }
  }, [initDB]);

  // 从 IndexedDB 获取资产数据
  const getAssetData = useCallback(async (assetId) => {
    try {
      const asset = await getAsset(assetId);
      if (!asset || asset.status !== 'completed') {
        return null;
      }
      
      const db = await initDB();
      const transaction = db.transaction(['chunks'], 'readonly');
      const chunkStore = transaction.objectStore('chunks');
      
      const chunks = [];
      for (let i = 0; i < asset.totalChunks; i++) {
        const chunk = await new Promise((resolve, reject) => {
          const request = chunkStore.get(`${assetId}_chunk_${i}`);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        if (chunk) {
          chunks.push(chunk);
        }
      }
      
      // 校验：必须拿到全部分块
      if (chunks.length !== asset.totalChunks) {
        console.warn(`getAssetData: incomplete chunks for ${assetId}. expected ${asset.totalChunks}, got ${chunks.length}`);
        return null;
      }

      // 按顺序重组文件
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
      
      // 合并所有分块
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.data.byteLength, 0);

      // 校验：合并后的大小应与 asset.size 一致
      if (typeof asset.size === 'number' && totalSize !== asset.size) {
        console.warn(`getAssetData: size mismatch for ${assetId}. meta=${asset.size}, merged=${totalSize}`);
        return null;
      }

      const mergedArray = new Uint8Array(totalSize);
      
      let offset = 0;
      for (const chunk of chunks) {
        mergedArray.set(new Uint8Array(chunk.data), offset);
        offset += chunk.data.byteLength;
      }
      
      return new Blob([mergedArray], { type: asset.metadata?.contentType || asset.metadata?.type || 'application/octet-stream' });
    } catch (err) {
      console.error('Failed to get asset data:', err);
      return null;
    }
  }, [initDB, getAsset]);

  // 清理存储
  const clearStorage = useCallback(async () => {
    try {
      const db = await initDB();
      const transaction = db.transaction(['assets', 'chunks', 'progress'], 'readwrite');
      const assetStore = transaction.objectStore('assets');
      const chunkStore = transaction.objectStore('chunks');
      const progressStore = transaction.objectStore('progress');
      
      await Promise.all([
        new Promise((resolve, reject) => {
          const request = assetStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise((resolve, reject) => {
          const request = chunkStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise((resolve, reject) => {
          const request = progressStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      ]);
      
      progressRef.current.clear();
      setStatus(STORAGE_STATUS.IDLE);
      setProgress(0);
      setCurrentAsset(null);
      setError(null);
      setTotalAssets(0);
      setStoredAssets(0);
      
    } catch (err) {
      console.error('Failed to clear storage:', err);
      throw err;
    }
  }, [initDB]);

  // 暂停存储
  const pauseStorage = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus(STORAGE_STATUS.IDLE);
  }, []);

  // 获取存储统计信息
  const getStorageStats = useCallback(async () => {
    try {
      const db = await initDB();
      const transaction = db.transaction(['assets'], 'readonly');
      const assetStore = transaction.objectStore('assets');
      
      const assets = await new Promise((resolve, reject) => {
        const request = assetStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const totalSize = assets.reduce((sum, asset) => sum + (asset.size || 0), 0);
      const completedCount = assets.filter(asset => asset.status === 'completed').length;
      
      return {
        totalAssets: assets.length,
        completedAssets: completedCount,
        totalSize: totalSize,
        incompleteAssets: assets.length - completedCount
      };
    } catch (err) {
      console.error('Failed to get storage stats:', err);
      return null;
    }
  }, [initDB]);

  // 清理中断的存储任务
  const cleanupIncompleteAssets = useCallback(async () => {
    try {
      const db = await initDB();
      const transaction = db.transaction(['assets', 'chunks', 'progress'], 'readwrite');
      const assetStore = transaction.objectStore('assets');
      const chunkStore = transaction.objectStore('chunks');
      const progressStore = transaction.objectStore('progress');
      
      // 获取所有未完成的资产
      const incompleteAssets = await new Promise((resolve, reject) => {
        const request = assetStore.index('status').getAll('storing');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      // 清理未完成的资产和相关的分块、进度
      for (const asset of incompleteAssets) {
        await Promise.all([
          new Promise((resolve, reject) => {
            const request = assetStore.delete(asset.id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          }),
          new Promise((resolve, reject) => {
            const request = progressStore.delete(asset.id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          })
        ]);
        
        // 清理相关的分块
        for (let i = 0; i < asset.totalChunks; i++) {
          await new Promise((resolve, reject) => {
            const request = chunkStore.delete(`${asset.id}_chunk_${i}`);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }
      
      console.log(`Cleaned up ${incompleteAssets.length} incomplete assets`);
    } catch (err) {
      console.error('Failed to cleanup incomplete assets:', err);
    }
  }, [initDB]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    status,
    progress,
    currentAsset,
    error,
    totalAssets,
    storedAssets,
    storeAsset,
    storeAllAssets,
    getAsset,
    getAssetData,
    resumeStorage,
    verifyAsset,
    clearStorage,
    pauseStorage,
    getStorageStats,
    cleanupIncompleteAssets,
    STORAGE_STATUS,
    getAssetByUrl
  };
}
