import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Asset } from './Asset';
import { useAssetStorage } from '../hooks/useAssetStorage';
import LeftIcon from '../icons/LeftIcon';
import useResponsiveFontSize from '../hooks/useResponsiveFontSize';
import { getAssetsByType } from '../assets/assets_config.js';

const AssetTest = ({ onClose }) => {
  const { storeAllAssets, getStorageStats, clearStorage, status, progress, currentAsset } = useAssetStorage();
  const [stats, setStats] = useState(null);
  // 自动刷新：移除开关，始终自动刷新
  const [fileSizeInfo, setFileSizeInfo] = useState(null);
  const [gitInfo] = useState(() => ({
    hash: typeof __BUILD_GIT_HASH__ !== 'undefined' ? __BUILD_GIT_HASH__ : null,
    dateIso: typeof __BUILD_GIT_DATE_ISO__ !== 'undefined' ? __BUILD_GIT_DATE_ISO__ : null,
    message: typeof __BUILD_GIT_MESSAGE__ !== 'undefined' ? __BUILD_GIT_MESSAGE__ : null,
  }));
  const [showLog, setShowLog] = useState(false);

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
      <div style={{ marginBottom: `${fontsize * 2}px` }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: `${fontsize * 0.8}px`,
          fontSize: `${fontsize * 1.3}px`,
          fontWeight: '800',
        }}>
          <span>存储进度</span>
          <span>{displayProgress}%</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: `${fontsize * 1}px`, 
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
            fontSize: `${fontsize * 1.1}px`, 
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
        padding: `${fontsize * 0.8}px`,
        backgroundColor: '#1f2937', 
        borderRadius: '8px'
      }}>
        <label style={{ 
          display: 'block',
          fontSize: `${fontsize * 1.3}px`, 
          fontWeight: '800', 
        }}>
          文件大小信息
        </label>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: `${fontsize * 0.8}px`,
          fontSize: `${fontsize * 1.1}px`
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
        </div>
      </div>
    );
  };

  return (
    <div 
      className="scrollable"
      style={{ 
        padding: `${fontsize * 2}px`, 
        marginTop: `${fontsize * 2.5}px`,
        backgroundColor: '#111827', 
        color: 'white',
        minHeight: '100vh',
        position: 'relative',
        overflowY: 'auto',
        maxHeight: '100vh'
      }}
    >

      <button
          className="absolute items-center z-20"
          onClick={onClose}
          style={{background: 'transparent', border: 'none', padding: 0, marginTop: `${fontsize * 0.5}px`}}
      >
          <LeftIcon size={fontsize * 2} color="white"/>
      </button>

      <label style={{ 
        display: 'block',
        fontSize: `${fontsize * 2}px`,
        fontWeight: 'bold', 
        marginBottom: `${fontsize * 2}px`,
        textAlign: 'center'
      }}>
        动画素材缓存
      </label>

      {/* 更新日志切换按钮 */}
      {(gitInfo.dateIso || gitInfo.hash || gitInfo.message) && (
        <button
          onClick={() => setShowLog(v => !v)}
          style={{
            position: 'absolute',
            top: `${fontsize * 2.5}px`,
            right: `${fontsize * 2}px`,
            zIndex: 6,
            backgroundColor: '#334155',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: `${fontsize * 0.5}px ${fontsize * 1}px`,
            fontSize: `${fontsize * 1}px`,
            cursor: 'pointer'
          }}
        >{showLog ? '隐藏更新日志' : '更新日志'}</button>
      )}

      {/* 更新日志 */}
      {showLog && (gitInfo.dateIso || gitInfo.hash || gitInfo.message) && (
        <div style={{
          padding: `${fontsize * 1}px`,
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          border: '1px solid #374151',
          position: 'absolute',
          top: `${fontsize * 5}px`,
          right: `${fontsize * 2}px`,
          width: `${fontsize * 18}px`,
          zIndex: 5
        }}>
          <div style={{ fontSize: `${fontsize * 1.1}px`, color: '#d1d5db', lineHeight: 1.6 }}>
            {gitInfo.dateIso && (
              <div>• 更新时间：{new Date(gitInfo.dateIso).toLocaleString()}</div>
            )}
            {gitInfo.message && (
              <div>• 更新说明：{gitInfo.message}</div>
            )}
          </div>
        </div>
      )}

      <label style={{color: "gray", fontSize: `${fontsize * 1.2}px`, lineHeight: 1.4, display: 'block'}}>
        解决各种视频音频播放很卡的问题，先点击“存储所有素材”按钮，存储完后点击“刷新网页”按钮，退出页面再开始抽卡
      </label>
      
      {/* 控制面板 */}
      <div style={{ 
        marginTop: `${fontsize * 1.2}px`,
        marginBottom: `${fontsize * 2}px`,
        padding: `${fontsize * 2}px`,
        backgroundColor: '#1f2937', 
        borderRadius: '8px'
      }}>
        
        <div style={{ display: 'flex', gap: `${fontsize * 0.5}px`, marginBottom: `${fontsize * 2}px`, flexWrap: 'wrap' }}>
          <button
            onClick={handleStoreAll}
            disabled={status === 'storing'}
            style={{
              padding: `${fontsize * 0.5}px ${fontsize * 1}px`,
              fontSize: `${fontsize * 1.3}px`,
              lineHeight: 1.5,
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
              padding: `${fontsize * 0.5}px ${fontsize * 1}px`,
              fontSize: `${fontsize * 1.3}px`,
              lineHeight: 1.5,
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
              padding: `${fontsize * 0.5}px ${fontsize * 1}px`,
              fontSize: `${fontsize * 1.3}px`,
              lineHeight: 1.5,
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
              padding: `${fontsize * 0.5}px ${fontsize * 1}px`,
              fontSize: `${fontsize * 1.3}px`,
              lineHeight: 1.5,
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
            padding: `${fontsize * 0.8}px`,
            backgroundColor: '#374151', 
            borderRadius: '4px',
            marginTop: `${fontsize * 1.2}px`,
            marginBottom: `${fontsize * 1.2}px`,
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

      {/* 媒体测试：直接按顺序列出所有视频与音频 */}
      <div style={{ marginBottom: `${fontsize * 0.8}px` }}>
        <label style={{ 
          display: 'block',
          fontSize: `${fontsize * 1.3}px`,
          fontWeight: '600', 
          marginBottom: `${fontsize * 0.8}px`,
        }}>
          视频
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${fontsize * 0.8}px`, maxWidth: `${fontsize * 30}px`, margin: '0 auto' }}>
          {(fileSizeInfo?.assets?.video || []).map(v => {
            const name = v.path.replace(/^.*\//, '');
            return (
              <div key={v.path} style={{ backgroundColor: '#1f2937', padding: `${fontsize * 1.2}px`, borderRadius: 8 }}>
                <div style={{ color: '#d1d5db', marginBottom: `${fontsize * 0.8}px`, fontSize: `${fontsize * 1.1}px` }}>{name}</div>
                <Asset type="video" src={name} controls style={{ width: '100%', height: 'auto' }} />
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: `${fontsize * 2.8}px` }}>
        <label style={{ 
          display: 'block',
          fontSize: `${fontsize * 1.3}px`,
          fontWeight: '600', 
          marginBottom: `${fontsize * 0.8}px`,
        }}>
          音频
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${fontsize * 0.8}px`, maxWidth: `${fontsize * 30}px`, margin: '0 auto' }}>
          {(fileSizeInfo?.assets?.audio || []).map(a => {
            const name = a.path.replace(/^.*\//, '');
            return (
              <div key={a.path} style={{ backgroundColor: '#1f2937', padding: `${fontsize * 1.2}px`, borderRadius: 8 }}>
                <div style={{ color: '#d1d5db', marginBottom: `${fontsize * 0.8}px`, fontSize: `${fontsize * 1.1}px` }}>{name}</div>
                <Asset type="audio" src={name} controls style={{ width: '100%' }}  />
              </div>
            );
          })}
        </div>
      </div>

      

      {/* 调试信息 */}
      <div style={{ 
        backgroundColor: '#1f2937', 
        marginTop: `${fontsize * 2.8}px`,
        padding: `${fontsize * 1.2}px`, 
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

// 之前的复杂选择器已移除，现直接在上方按顺序列表展示。

export default AssetTest;
