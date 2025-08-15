import React, { useState, useEffect, useCallback } from 'react';
import { Asset } from './Asset';
import { useAssetStorage } from '../hooks/useAssetStorage';

const AssetTest = () => {
  const { storeAllAssets, getStorageStats, clearStorage, status, progress } = useAssetStorage();
  const [stats, setStats] = useState(null);
  const [currentAsset, setCurrentAsset] = useState(null);

  // 加载统计信息 - 使用 useCallback 避免无限循环
  const loadStats = useCallback(async () => {
    try {
      const storageStats = await getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [getStorageStats]);

  // 存储所有素材
  const handleStoreAll = useCallback(async () => {
    try {
      await storeAllAssets();
      await loadStats();
    } catch (error) {
      console.error('Failed to store assets:', error);
    }
  }, [storeAllAssets, loadStats]);

  // 清空存储
  const handleClear = useCallback(async () => {
    try {
      await clearStorage();
      setStats(null);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }, [clearStorage]);

  // 只在组件挂载时加载一次统计信息
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#111827', 
      color: 'white',
      minHeight: '100vh',
      overflowY: 'auto'
    }}>
      <label style={{ 
        display: 'block',
        fontSize: '30px', 
        fontWeight: 'bold', 
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        素材加载测试页面
      </label>
      
      {/* 控制面板 */}
      <div style={{ 
        marginBottom: '32px', 
        padding: '16px', 
        backgroundColor: '#1f2937', 
        borderRadius: '8px'
      }}>
        <label style={{ 
          display: 'block',
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '16px'
        }}>
          控制面板
        </label>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <button
            onClick={handleStoreAll}
            disabled={status === 'storing'}
            style={{
              padding: '8px 16px',
              backgroundColor: status === 'storing' ? '#6b7280' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: status === 'storing' ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (status !== 'storing') {
                e.target.style.backgroundColor = '#1d4ed8';
              }
            }}
            onMouseLeave={(e) => {
              if (status !== 'storing') {
                e.target.style.backgroundColor = '#2563eb';
              }
            }}
          >
            {status === 'storing' ? '存储中...' : '存储所有素材'}
          </button>
          
          <button
            onClick={loadStats}
            style={{
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
          >
            刷新统计
          </button>
          
          <button
            onClick={handleClear}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            清空存储
          </button>
        </div>
        
        {/* 状态显示 */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: '4px 0' }}>状态: {status}</p>
          {status === 'storing' && (
            <div>
              <p style={{ margin: '4px 0' }}>进度: {progress}%</p>
              {currentAsset && (
                <p style={{ margin: '4px 0' }}>
                  当前: {currentAsset.name} ({(currentAsset.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* 统计信息 */}
        {stats && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#374151', 
            borderRadius: '4px'
          }}>
            <p style={{ margin: '4px 0' }}>总素材数: {stats.totalAssets}</p>
            <p style={{ margin: '4px 0' }}>已完成: {stats.completedAssets}</p>
            <p style={{ margin: '4px 0' }}>未完成: {stats.incompleteAssets}</p>
            <p style={{ margin: '4px 0' }}>总大小: {(stats.totalSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}
      </div>

      {/* 视频测试 */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '24px', 
          fontWeight: '600', 
          marginBottom: '16px'
        }}>
          视频测试
        </label>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px'
        }}>
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '500', 
              marginBottom: '8px'
            }}>
              金卡视频
            </label>
            <Asset 
              src="gold_card.mp4" 
              type="video" 
              controls
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '500', 
              marginBottom: '8px'
            }}>
              非金卡视频
            </label>
            <Asset 
              src="no_gold_card.mp4" 
              type="video" 
              controls
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '500', 
              marginBottom: '8px'
            }}>
              开屏动画
            </label>
            <Asset 
              src="开屏动画.mp4" 
              type="video" 
              controls
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '500', 
              marginBottom: '8px'
            }}>
              夏以昼金卡
            </label>
            <Asset 
              src="夏以昼金卡.mp4" 
              type="video" 
              controls
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>
      </div>

      {/* 音频测试 */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '24px', 
          fontWeight: '600', 
          marginBottom: '16px'
        }}>
          音频测试
        </label>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px'
        }}>
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '500', 
              marginBottom: '8px'
            }}>
              出金音效
            </label>
            <Asset 
              src="出金.mp3" 
              type="audio" 
              controls
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '500', 
              marginBottom: '8px'
            }}>
              不出金音效
            </label>
            <Asset 
              src="不出金.mp3" 
              type="audio" 
              controls
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '500', 
              marginBottom: '8px'
            }}>
              切换音效
            </label>
            <Asset 
              src="切换音效.mp3" 
              type="audio" 
              controls
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '500', 
              marginBottom: '8px'
            }}>
              展示结算
            </label>
            <Asset 
              src="展示结算.mp3" 
              type="audio" 
              controls
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '500', 
              marginBottom: '8px'
            }}>
              时空引力
            </label>
            <Asset 
              src="时空引力.mp3" 
              type="audio" 
              controls
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* 图片测试 */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '24px', 
          fontWeight: '600', 
          marginBottom: '16px'
        }}>
          图片测试
        </label>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px'
        }}>
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '500', 
              marginBottom: '8px'
            }}>
              结算背景
            </label>
            <Asset 
              src="结算背景.jpg" 
              type="image" 
              alt="结算背景"
              style={{ width: '100%', height: 'auto', maxHeight: '300px' }}
            />
          </div>
          
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '500', 
              marginBottom: '8px'
            }}>
              角色头像
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px'
            }}>
              <Asset 
                src="夏以昼.png" 
                type="image" 
                alt="夏以昼"
                style={{ width: '100%', height: 'auto' }}
              />
              <Asset 
                src="沈星回.png" 
                type="image" 
                alt="沈星回"
                style={{ width: '100%', height: 'auto' }}
              />
              <Asset 
                src="祁煜.png" 
                type="image" 
                alt="祁煜"
                style={{ width: '100%', height: 'auto' }}
              />
              <Asset 
                src="秦彻.png" 
                type="image" 
                alt="秦彻"
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 调试信息 */}
      <div style={{ 
        backgroundColor: '#1f2937', 
        padding: '16px', 
        borderRadius: '8px',
        marginBottom: '32px'
      }}>
        <label style={{ 
          display: 'block',
          fontSize: '18px', 
          fontWeight: '500', 
          marginBottom: '8px'
        }}>
          调试信息
        </label>
        <div style={{ fontSize: '14px', color: '#d1d5db' }}>
          <p style={{ margin: '4px 0' }}>当前状态: {status}</p>
          <p style={{ margin: '4px 0' }}>进度: {progress}%</p>
          <p style={{ margin: '4px 0' }}>统计信息: {JSON.stringify(stats, null, 2)}</p>
        </div>
      </div>
    </div>
  );
};

export default AssetTest;
