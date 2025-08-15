import React, { useState, useEffect } from 'react';
import { useAssetStorage } from '../hooks/useAssetStorage';

const AssetManager = () => {
  const {
    status,
    progress,
    currentAsset,
    error,
    totalAssets,
    storedAssets,
    storeAllAssets,
    getStorageStats,
    cleanupIncompleteAssets,
    clearStorage,
    STORAGE_STATUS
  } = useAssetStorage();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storageStarted, setStorageStarted] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  // 监听进度变化
  useEffect(() => {
    console.log('Progress updated:', progress); // 调试日志
  }, [progress]);

  // 监听状态变化
  useEffect(() => {
    console.log('Status updated:', status); // 调试日志
  }, [status]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const storageStats = await getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreAll = async () => {
    try {
      setStorageStarted(true);
      console.log('Starting storage...'); // 调试日志
      await storeAllAssets();
      setStorageStarted(false);
      await loadStats();
    } catch (error) {
      console.error('Failed to store assets:', error);
      setStorageStarted(false);
    }
  };

  const handleCleanup = async () => {
    try {
      await cleanupIncompleteAssets();
      await loadStats();
    } catch (error) {
      console.error('Failed to cleanup:', error);
    }
  };

  const handleClear = async () => {
    try {
      await clearStorage();
      setStats(null);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow" style={{fontSize: '16px', color: 'white'}}>
      <h2 className="text-xl font-bold mb-4">素材管理器</h2>
      
      {/* 状态显示 */}
      <div className="mb-4">
        <p><strong>状态:</strong> {status}</p>
        <p><strong>进度:</strong> {progress}%</p>
        {status === STORAGE_STATUS.STORING && (
          <div>
            {currentAsset && (
              <p>当前: {currentAsset.name} ({(currentAsset.size / 1024 / 1024).toFixed(2)} MB)</p>
            )}
          </div>
        )}
        {error && <p className="text-red-500">错误: {error}</p>}
      </div>

      {/* 统计信息 */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        {loading ? (
          <p>加载中...</p>
        ) : stats ? (
          <>
            <p>总素材数: {stats.totalAssets}</p>
            <p>已完成: {stats.completedAssets}</p>
            <p>未完成: {stats.incompleteAssets}</p>
            <p>总大小: {(stats.totalSize / 1024 / 1024).toFixed(2)} MB</p>
          </>
        ) : (
          <p>暂无数据</p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="space-x-2">
        <button
          onClick={handleStoreAll}
          disabled={status === STORAGE_STATUS.STORING}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {storageStarted && status === STORAGE_STATUS.STORING ? '存储中...' : '存储所有素材'}
        </button>
        
        <button
          onClick={handleCleanup}
          disabled={status === STORAGE_STATUS.STORING}
          className="px-4 py-2 bg-yellow-500 text-white rounded disabled:bg-gray-300"
        >
          清理未完成
        </button>
        
        <button
          onClick={handleClear}
          disabled={status === STORAGE_STATUS.STORING}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          清空存储
        </button>
      </div>

      {/* 提示信息 */}
      {storageStarted && status === STORAGE_STATUS.STORING && (
        <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded">
          <p><strong>提示：</strong></p>
          <p>• 存储过程在后台进行，你可以做其他事情</p>
          <p>• 页面刷新不会中断存储过程</p>
          <p>• 存储完成后会自动更新统计信息</p>
          <p>• 如果页面关闭，下次打开时会显示存储进度</p>
        </div>
      )}

      {/* 调试信息 */}
      <div className="mt-4 p-2 bg-gray-200 rounded text-sm">
        <p>调试信息:</p>
        <p>stats: {JSON.stringify(stats)}</p>
        <p>loading: {loading.toString()}</p>
        <p>status: {status}</p>
        <p>progress: {progress}%</p>
        <p>storageStarted: {storageStarted.toString()}</p>
        <p>currentAsset: {JSON.stringify(currentAsset)}</p>
      </div>
    </div>
  );
};

export default AssetManager;