// 自动生成的素材配置文件
// 生成时间: 2025-08-18 01:25:39
// 请勿手动修改此文件

export const assetsConfig = {
  version: "1.0.0",
  lastUpdated: "2025-08-18T01:25:39.116342",
  totalFiles: 31,
  totalSize: 43467835,
  totalSizeFormatted: "41.45 MB",
  assets: {
  "video": [
    {
      "path": "videos/秦彻金卡.mp4",
      "size": 3442367,
      "sizeFormatted": "3.28 MB"
    },
    {
      "path": "videos/夏以昼金卡.mp4",
      "size": 5336420,
      "sizeFormatted": "5.09 MB"
    },
    {
      "path": "videos/黎深金卡.mp4",
      "size": 5102756,
      "sizeFormatted": "4.87 MB"
    },
    {
      "path": "videos/祁煜金卡.mp4",
      "size": 2681367,
      "sizeFormatted": "2.56 MB"
    },
    {
      "path": "videos/gold_card.mp4",
      "size": 4451346,
      "sizeFormatted": "4.25 MB"
    },
    {
      "path": "videos/no_gold_card.mp4",
      "size": 4854623,
      "sizeFormatted": "4.63 MB"
    },
    {
      "path": "videos/开屏动画.mp4",
      "size": 14424430,
      "sizeFormatted": "13.76 MB"
    },
    {
      "path": "videos/沈星回金卡.mp4",
      "size": 2303001,
      "sizeFormatted": "2.20 MB"
    }
  ],
  "audio": [
    {
      "path": "audios/展示结算.mp3",
      "size": 26799,
      "sizeFormatted": "26.17 KB"
    },
    {
      "path": "audios/不出金.mp3",
      "size": 111645,
      "sizeFormatted": "109.03 KB"
    },
    {
      "path": "audios/切换音效.mp3",
      "size": 17186,
      "sizeFormatted": "16.78 KB"
    },
    {
      "path": "audios/出金.mp3",
      "size": 115406,
      "sizeFormatted": "112.70 KB"
    },
    {
      "path": "audios/金卡展示.mp3",
      "size": 37666,
      "sizeFormatted": "36.78 KB"
    }
  ],
  "image": [
    {
      "path": "images/绿珥.png",
      "size": 2490,
      "sizeFormatted": "2.43 KB"
    },
    {
      "path": "images/5星.png",
      "size": 11225,
      "sizeFormatted": "10.96 KB"
    },
    {
      "path": "images/icon.png",
      "size": 281435,
      "sizeFormatted": "274.84 KB"
    },
    {
      "path": "images/4星.png",
      "size": 9044,
      "sizeFormatted": "8.83 KB"
    },
    {
      "path": "images/月晖.png",
      "size": 2585,
      "sizeFormatted": "2.52 KB"
    },
    {
      "path": "images/粉珀.png",
      "size": 2381,
      "sizeFormatted": "2.33 KB"
    },
    {
      "path": "images/3星.png",
      "size": 7171,
      "sizeFormatted": "7.00 KB"
    },
    {
      "path": "images/红漪.png",
      "size": 2375,
      "sizeFormatted": "2.32 KB"
    },
    {
      "path": "images/结算背景.jpg",
      "size": 79609,
      "sizeFormatted": "77.74 KB"
    },
    {
      "path": "images/紫辉.png",
      "size": 2335,
      "sizeFormatted": "2.28 KB"
    },
    {
      "path": "images/日冕.png",
      "size": 4714,
      "sizeFormatted": "4.60 KB"
    },
    {
      "path": "images/蓝弧.png",
      "size": 2388,
      "sizeFormatted": "2.33 KB"
    },
    {
      "path": "images/黄璃.png",
      "size": 2328,
      "sizeFormatted": "2.27 KB"
    }
  ],
  "sign": [
    {
      "path": "signs/祁煜.png",
      "size": 26302,
      "sizeFormatted": "25.69 KB"
    },
    {
      "path": "signs/秦彻.png",
      "size": 33016,
      "sizeFormatted": "32.24 KB"
    },
    {
      "path": "signs/夏以昼.png",
      "size": 34825,
      "sizeFormatted": "34.01 KB"
    },
    {
      "path": "signs/黎深.png",
      "size": 26503,
      "sizeFormatted": "25.88 KB"
    },
    {
      "path": "signs/沈星回.png",
      "size": 32097,
      "sizeFormatted": "31.34 KB"
    }
  ]
},
  metadata: {
    description: "自动生成的素材配置文件",
    generatedBy: "scan_assets.py"
  }
};

// 获取指定类型的文件列表
export const getAssetsByType = (type) => {
  return assetsConfig.assets[type] || [];
};

// 获取所有文件列表
export const getAllAssets = () => {
  return assetsConfig.assets;
};

// 获取总文件数
export const getTotalAssetsCount = () => {
  return assetsConfig.totalFiles;
};

// 获取总文件大小（字节）
export const getTotalAssetsSize = () => {
  return assetsConfig.totalSize;
};

// 获取总文件大小（格式化）
export const getTotalAssetsSizeFormatted = () => {
  return assetsConfig.totalSizeFormatted;
};

// 根据文件大小筛选文件
export const getAssetsBySizeRange = (type, minSize = 0, maxSize = Infinity) => {
  const files = assetsConfig.assets[type] || [];
  return files.filter(file => file.size >= minSize && file.size <= maxSize);
};

// 获取指定类型文件的总大小
export const getTypeTotalSize = (type) => {
  const files = assetsConfig.assets[type] || [];
  return files.reduce((total, file) => total + file.size, 0);
};

export default assetsConfig;
