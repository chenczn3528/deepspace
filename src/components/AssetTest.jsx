import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { Asset } from './Asset';
import { useAssetStorage } from '../hooks/useAssetStorage';
import LeftIcon from '../icons/LeftIcon';
import useResponsiveFontSize from '../hooks/useResponsiveFontSize';
import { getAssetsByType } from '../assets/assets_config.js';

const AssetTest = ({ onClose, baseSize: initialBaseSize }) => {
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

  // const fontsize = useResponsiveFontSize({scale: 0.9});

  // ======================================= 获取容器尺寸（16:9下）
  const [baseSize, setBaseSize] = useState(() => initialBaseSize ?? null);
  const divRef = useRef(null); // 获取当前绑定的容器的尺寸

  useLayoutEffect(() => {
      const updateSize = () => {
          if (divRef.current) {
              const width = divRef.current.clientWidth;
              const height = divRef.current.clientHeight;

              if (height > 0) {
                  const newBaseSize = (width / 375) * 0.85;
                  setBaseSize(newBaseSize);
                  return true;
              }
          }
          return false;
      };

      // 初始化时轮询直到能获取有效高度
      const tryInitSize = () => {
          const success = updateSize();
          if (!success) {
              // 如果失败，延迟一帧继续尝试
              requestAnimationFrame(tryInitSize);
          }
      };
      tryInitSize(); // 启动初始化
      window.addEventListener('resize', updateSize); // 响应窗口变化

      return () => {window.removeEventListener('resize', updateSize);};
  }, []);

  // 加载统计信息 - 使用 useCallback 避免无限循环
  const loadStats = useCallback(async () => {
    try {
      const assetsConfigModule = await import('../assets/assets_config.js');
      const config = assetsConfigModule.assetsConfig;
      setFileSizeInfo(config);

      const storageStats = await getStorageStats();
      const expectedTotalAssets =
        config?.totalFiles ??
        ((config?.assets?.video?.length || 0) +
          (config?.assets?.audio?.length || 0) +
          (config?.assets?.image?.length || 0) +
          (config?.assets?.sign?.length || 0));
      const expectedTotalSize =
        config?.totalSize ??
        Object.values(config?.assets || {}).reduce(
          (total, files) =>
            total + files.reduce((sum, file) => sum + (file.size || 0), 0),
          0
        );

      const completedAssets = storageStats?.completedAssets || 0;
      const totalAssets = expectedTotalAssets || storageStats?.totalAssets || 0;
      const totalSize = expectedTotalSize || storageStats?.totalSize || 0;
      const incompleteAssets = Math.max(totalAssets - completedAssets, 0);

      setStats({
        totalAssets,
        completedAssets,
        incompleteAssets,
        totalSize,
      });
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
      <div style={{ marginBottom: `${baseSize * 18}px` }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: `${baseSize * 10}px`,
          fontSize: `${baseSize * 20}px`,
          fontWeight: '800',
        }}>
          <span>存储进度</span>
          <span>{displayProgress}%</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: `${baseSize * 18}px`, 
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
            fontSize: `${baseSize * 18}px`, 
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
        padding: `${baseSize * 10}px`,
        backgroundColor: '#1f2937', 
        borderRadius: '8px'
      }}>
        <label style={{ 
          display: 'block',
          fontSize: `${baseSize * 20}px`, 
          fontWeight: '800', 
        }}>
          文件大小信息
        </label>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          fontSize: `${baseSize * 18}px`
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

  if (baseSize === null) {
    return (
      <div
        ref={divRef}
        style={{
          minHeight: '100vh',
          backgroundColor: '#111827',
        }}
      />
    );
  }

  return (
    <div
      ref={divRef}
      style={{
        padding: `${baseSize * 20}px`,
        paddingTop: `${baseSize * 72}px`,
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
          style={{background: 'transparent', border: 'none', padding: 0, marginTop: `${baseSize * 12}px`}}
      >
          <LeftIcon size={baseSize * 32} color="white"/>
      </button>

      <label style={{ 
        display: 'block',
        fontSize: `${baseSize * 24}px`,
        fontWeight: 'bold', 
        marginTop: `${baseSize * 12}px`,
        marginBottom: `${baseSize * 10}px`,
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
            top: `${baseSize * 82}px`,
            right: `${baseSize * 20}px`,
            zIndex: 6,
            backgroundColor: '#334155',
            fontSize: `${baseSize * 14}px`,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: `${baseSize * 8}px ${baseSize * 12}px`,
            cursor: 'pointer'
          }}
        >{showLog ? '隐藏更新日志' : '更新日志'}</button>
      )}

      {/* 更新日志 */}
      {showLog && (gitInfo.dateIso || gitInfo.hash || gitInfo.message) && (
        <div style={{ 
          margin: `${baseSize * 60}px`,
          padding: `${baseSize * 18}px`,
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          border: '1px solid #374151',
          position: 'absolute',
          top: `${baseSize * 48}px`,
          right: `${baseSize * 5}px`,
          width: `${baseSize * 240}px`,
          zIndex: 5
        }}>
          <div style={{ fontSize: `${baseSize * 14}px`, color: '#d1d5db', lineHeight: 1.6 }}>
            {gitInfo.dateIso && (
              <div>• 更新时间：{new Date(gitInfo.dateIso).toLocaleString()}</div>
            )}
            {gitInfo.message && (
              <div>• 更新说明：{gitInfo.message}</div>
            )}
          </div>
        </div>
      )}

      <label style={{color: "gray", fontSize: `${baseSize * 18}px`}}>
        解决各种视频音频播放很卡的问题，先点击
        <span style={{color: '#2563eb', fontWeight: '600'}}>"存储所有素材"</span>
        按钮，存储完后点击
        <span style={{color: '#059669', fontWeight: '600'}}>"刷新网页"</span>
        按钮，退出页面再点击
        <span style={{color: '#059669', fontWeight: '600'}}>"开始抽卡"</span>按钮
      </label>
      
      {/* 控制面板 */}
      <div style={{ 
        marginTop: `${baseSize * 12}px`,
        marginBottom: `${baseSize * 12}px`,
        padding: `${baseSize * 12}px`,
        backgroundColor: '#1f2937', 
        borderRadius: '8px'
      }}>
        
        <div style={{ display: 'flex', gap: `${baseSize * 12}px`, marginBottom: `${baseSize * 18}px`, flexWrap: 'wrap' }}>
          <button
            onClick={handleStoreAll}
            disabled={status === 'storing'}
            style={{
              padding: `${baseSize * 12}px ${baseSize * 18}px`,
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
              padding: `${baseSize * 12}px ${baseSize * 18}px`,
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
              padding: `${baseSize * 12}px ${baseSize * 18}px`,
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
              padding: `${baseSize * 12}px ${baseSize * 18}px`,
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
            padding: `${baseSize * 18}px`,
            backgroundColor: '#374151', 
            borderRadius: '4px',
            marginTop: `${baseSize * 18}px`,
            marginBottom: `${baseSize * 18}px`,
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
      <div style={{ marginBottom: '32px' }}>
        <label style={{ 
          display: 'block',
          fontSize: `${baseSize * 18}px`,
          fontWeight: '600', 
          marginBottom: `${baseSize * 12}px`,
        }}>
          视频
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${baseSize * 12}px`, maxWidth: `${baseSize * 600}px`, margin: '0 auto' }}>
          {(fileSizeInfo?.assets?.video || []).map(v => {
            const name = v.path.replace(/^.*\//, '');
            return (
              <div key={v.path} style={{ backgroundColor: '#1f2937', padding: `${baseSize * 12}px`, borderRadius: 8 }}>
                <div style={{ color: '#d1d5db', marginBottom: `${baseSize * 8}px`, fontSize: `${baseSize * 14}px` }}>{name}</div>
                <Asset type="video" src={name} controls style={{ width: '100%', height: 'auto' }} />
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ 
          display: 'block',
          fontSize: `${baseSize * 18}px`,
          fontWeight: '600', 
          marginBottom: `${baseSize * 12}px`,
        }}>
          音频
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${baseSize * 12}px`, maxWidth: `${baseSize * 500}px`, margin: '0 auto' }}>
          {(fileSizeInfo?.assets?.audio || []).map(a => {
            const name = a.path.replace(/^.*\//, '');
            return (
              <div key={a.path} style={{ backgroundColor: '#1f2937', padding: `${baseSize * 12}px`, borderRadius: 8 }}>
                <div style={{ color: '#d1d5db', marginBottom: `${baseSize * 8}px`, fontSize: `${baseSize * 14}px` }}>{name}</div>
                <Asset type="audio" src={name} controls style={{ width: '100%' }}  />
              </div>
            );
          })}
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

// 之前的复杂选择器已移除，现直接在上方按顺序列表展示。

export default AssetTest;
