import React, { useState, useEffect, useCallback } from 'react';
import { Asset } from './Asset';
import { useAssetStorage } from '../hooks/useAssetStorage';
import LeftIcon from '../icons/LeftIcon';
import useResponsiveFontSize from '../hooks/useResponsiveFontSize';

const AssetTest = ({ onClose }) => {
  const { storeAllAssets, getStorageStats, clearStorage, status, progress, currentAsset } = useAssetStorage();
  const [stats, setStats] = useState(null);
  // 自动刷新：移除开关，始终自动刷新
  const [fileSizeInfo, setFileSizeInfo] = useState(null);

  const fontsize = useResponsiveFontSize({scale: 0.9});

  // 加载统计信息 - 使用 useCallback 避免无限循环
  const loadStats = useCallback(async () => {
    try {
      const storageStats = await getStorageStats();
      setStats(storageStats);
      
      // 获取文件大小信息
      const assetsConfig = await import('../assets/assets_config.js');
      setFileSizeInfo(assetsConfig.assetsConfig);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [getStorageStats]);

  // 存储所有素材
  const handleStoreAll = useCallback(async () => {
    try {
      await storeAllAssets();
      // 存储完成后自动刷新统计信息
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

  // 监听状态变化，自动刷新统计信息
  useEffect(() => {
    if (status === 'completed') {
      loadStats();
    }
  }, [status, loadStats]);

  // 只在组件挂载时加载一次统计信息
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // 渲染进度条
  const renderProgressBar = () => {
    // 非存储状态：按本地已完成/配置总数计算百分比，保证刷新后仍显示本地进度
    const expectedTotal = (fileSizeInfo?.assets?.video?.length || 0)
      + (fileSizeInfo?.assets?.audio?.length || 0)
      + (fileSizeInfo?.assets?.image?.length || 0)
      + (fileSizeInfo?.assets?.sign?.length || 0);
    const completed = stats?.completedAssets || 0;
    const localProgress = expectedTotal > 0 ? Math.round((completed / expectedTotal) * 100) : 0;
    const displayProgress = status === 'storing' ? progress : localProgress;

    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '8px',
          fontSize: '14px'
        }}>
          <span>存储进度</span>
          <span>{displayProgress}%</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '20px', 
          backgroundColor: '#374151', 
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${displayProgress}%`, 
            height: '100%', 
            backgroundColor: '#2563eb',
            transition: 'width 0.3s ease',
            borderRadius: '10px'
          }} />
        </div>
        {status === 'storing' && currentAsset && (
          <p style={{ 
            margin: '8px 0 0 0', 
            fontSize: '14px', 
            color: '#9ca3af' 
          }}>
            当前: {currentAsset.name} ({(currentAsset.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>
    );
  };

  // 渲染文件大小信息
  const renderFileSizeInfo = () => {
    if (!fileSizeInfo) return null;
    
    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return (
      <div style={{ 
        marginBottom: '16px', 
        padding: '16px', 
        backgroundColor: '#1f2937', 
        borderRadius: '8px'
      }}>
        <label style={{ 
          display: 'block',
          fontSize: '18px', 
          fontWeight: '500', 
          marginBottom: '12px'
        }}>
          文件大小信息
        </label>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          fontSize: '14px'
        }}>
          <div>
            <p style={{ margin: '4px 0', color: '#9ca3af' }}>视频文件</p>
            <p style={{ margin: '4px 0' }}>
              数量: {fileSizeInfo.assets.video.length}，总大小: {formatSize(
                fileSizeInfo.assets.video.reduce((sum, file) => sum + (file.size || 0), 0)
              )}
            </p>
          </div>
          <div>
            <p style={{ margin: '4px 0', color: '#9ca3af' }}>音频文件</p>
            <p style={{ margin: '4px 0' }}>
              数量: {fileSizeInfo.assets.audio.length}，总大小: {formatSize(
                fileSizeInfo.assets.audio.reduce((sum, file) => sum + (file.size || 0), 0)
              )}
            </p>
          </div>
          <div>
            <p style={{ margin: '4px 0', color: '#9ca3af' }}>图片文件</p>
            <p style={{ margin: '4px 0' }}>
              数量: {fileSizeInfo.assets.image.length}，总大小: {formatSize(
                fileSizeInfo.assets.image.reduce((sum, file) => sum + (file.size || 0), 0)
              )}
            </p>
          </div>
          <div>
            <p style={{ margin: '4px 0', color: '#9ca3af' }}>头像文件</p>
            <p style={{ margin: '4px 0' }}>
              数量: {fileSizeInfo.assets.sign.length}，总大小: {formatSize(
                fileSizeInfo.assets.sign.reduce((sum, file) => sum + (file.size || 0), 0)
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#111827', 
      color: 'white',
      minHeight: '100vh',
      overflowY: 'auto',
      position: 'relative'
    }}>

      <button
          className="absolute items-center z-20"
          onClick={onClose}
          style={{background: 'transparent', border: 'none', padding: 0, marginTop: `${fontsize * 2}px`, marginLeft: `${fontsize}px`}}
      >
          <LeftIcon size={fontsize * 2} color="white"/>
      </button>

      <label style={{ 
        display: 'block',
        fontSize: '28px', 
        fontWeight: 'bold', 
        marginTop: `${fontsize * 1.2}px`,
        marginBottom: '12px',
        textAlign: 'center'
      }}>
        动画素材缓存
      </label>

      <label style={{color: "gray", fontSize: `${fontsize * 1.1}px`, marginBottom: '12px'}}>
        解决各种视频音频播放很卡的问题，先点击“存储所有素材”按钮，存储完后点击“刷新网页”按钮，退出页面再开始抽卡
      </label>
      
      {/* 控制面板 */}
      <div style={{ 
        marginBottom: '32px', 
        padding: '16px', 
        backgroundColor: '#1f2937', 
        borderRadius: '8px'
      }}>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
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
            onClick={() => window.location.reload()}
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
            刷新网页
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

          <button
            onClick={() => onClose()}
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
            开始抽卡
          </button>

          
        </div>
        
        {/* 进度条 */}
        {renderProgressBar()}

        {/* 统计信息 - 移到进度条下面 */}
        {stats && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#374151', 
            borderRadius: '4px',
            marginTop: '8px',
            marginBottom: '8px'
          }}>
            <p style={{ margin: '4px 0' }}>总素材数: {stats.totalAssets}</p>
            <p style={{ margin: '4px 0' }}>已完成: {stats.completedAssets}</p>
            <p style={{ margin: '4px 0' }}>未完成: {stats.incompleteAssets}</p>
            <p style={{ margin: '4px 0' }}>总大小: {(stats.totalSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        {/* 文件大小信息 - 移到统计信息下面 */}
        {renderFileSizeInfo()}
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
              沈星回金卡
            </label>
            <Asset 
              src="沈星回金卡.mp4" 
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
              黎深金卡
            </label>
            <Asset 
              src="黎深金卡.mp4" 
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
              祁煜金卡
            </label>
            <Asset 
              src="祁煜金卡.mp4" 
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
              秦彻金卡
            </label>
            <Asset 
              src="秦彻金卡.mp4" 
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
              出现金卡音效
            </label>
            <Asset 
              src="金卡展示.mp3" 
              type="audio" 
              controls
              style={{ width: '100%' }}
            />
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
