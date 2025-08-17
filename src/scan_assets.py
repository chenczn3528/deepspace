#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
素材文件扫描器
自动扫描public目录下的文件，生成需要缓存的素材列表
"""

import os
from datetime import datetime
import json
from pathlib import Path
from typing import Dict, List, Any

def get_file_size(file_path: Path) -> int:
    """
    获取文件大小（字节）
    
    Args:
        file_path: 文件路径
        
    Returns:
        文件大小（字节）
    """
    try:
        return file_path.stat().st_size
    except Exception:
        return 0

def scan_assets(public_dir: str = "public") -> Dict[str, Any]:
    """
    扫描public目录下的素材文件
    
    Args:
        public_dir: public目录的路径
        
    Returns:
        包含素材信息的字典
    """
    assets = {
        "video": [],
        "audio": [], 
        "image": [],
        "sign": []
    }
    
    # 支持的视频格式
    video_extensions = {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'}
    # 支持的音频格式
    audio_extensions = {'.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'}
    # 支持的图片格式
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'}
    
    try:
        public_path = Path(public_dir).resolve()
        print(f"扫描目录: {public_path}")
        
        if not public_path.exists():
            print(f"错误: 目录 {public_path} 不存在")
            return assets
            
        # 扫描各个子目录
        for item in public_path.iterdir():
            if item.is_dir():
                dir_name = item.name
                print(f"扫描子目录: {dir_name}")
                
                for file_path in item.rglob("*"):
                    if file_path.is_file():
                        file_ext = file_path.suffix.lower()
                        relative_path = file_path.relative_to(public_path)
                        file_size = get_file_size(file_path)
                        
                        # 创建文件信息对象
                        file_info = {
                            "path": str(relative_path),
                            "size": file_size,
                            "sizeFormatted": format_file_size(file_size)
                        }
                        
                        # 根据文件扩展名和目录名分类
                        if file_ext in video_extensions:
                            assets["video"].append(file_info)
                        elif file_ext in audio_extensions:
                            assets["audio"].append(file_info)
                        elif file_ext in image_extensions:
                            if dir_name == "signs":
                                assets["sign"].append(file_info)
                            else:
                                assets["image"].append(file_info)
                                
        # 统计信息
        total_files = sum(len(file_list) for file_list in assets.values())
        total_size = sum(
            sum(file_info["size"] for file_info in file_list) 
            for file_list in assets.values()
        )
        
        print(f"\n扫描完成! 总共找到 {total_files} 个文件:")
        print(f"  视频: {len(assets['video'])} 个")
        print(f"  音频: {len(assets['audio'])} 个") 
        print(f"  图片: {len(assets['image'])} 个")
        print(f"  头像: {len(assets['sign'])} 个")
        print(f"  总大小: {format_file_size(total_size)}")
        
        return assets
        
    except Exception as e:
        print(f"扫描过程中出现错误: {e}")
        return assets

def format_file_size(size_bytes: int) -> str:
    """
    格式化文件大小显示
    
    Args:
        size_bytes: 文件大小（字节）
        
    Returns:
        格式化后的文件大小字符串
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.2f} {size_names[i]}"

def generate_assets_config(assets: Dict[str, List[Dict]], output_file: str = "assets_config.json"):
    """
    生成素材配置文件
    
    Args:
        assets: 素材信息字典
        output_file: 输出文件名
    """
    # 计算总文件数和总大小
    total_files = sum(len(file_list) for file_list in assets.values())
    total_size = sum(
        sum(file_info["size"] for file_info in file_list) 
        for file_list in assets.values()
    )
    
    config = {
        "version": "1.0.0",
        "lastUpdated": "",
        "totalFiles": total_files,
        "totalSize": total_size,
        "totalSizeFormatted": format_file_size(total_size),
        "assets": assets,
        "metadata": {
            "description": "自动生成的素材配置文件",
            "generatedBy": "scan_assets.py"
        }
    }
    
    # 添加时间戳
    config["lastUpdated"] = datetime.now().isoformat()
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        print(f"\n配置文件已生成: {output_file}")
        return True
    except Exception as e:
        print(f"生成配置文件时出现错误: {e}")
        return False

def generate_js_config(assets: Dict[str, List[Dict]], output_file: str = "assets_config.js"):
    """
    生成JavaScript配置文件，可以直接在React组件中使用
    
    Args:
        assets: 素材信息字典
        output_file: 输出文件名
    """
    # 计算总文件数和总大小
    total_files = sum(len(file_list) for file_list in assets.values())
    total_size = sum(
        sum(file_info["size"] for file_info in file_list) 
        for file_list in assets.values()
    )
    
    js_content = f"""// 自动生成的素材配置文件
// 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
// 请勿手动修改此文件

export const assetsConfig = {{
  version: "1.0.0",
  lastUpdated: "{datetime.now().isoformat()}",
  totalFiles: {total_files},
  totalSize: {total_size},
  totalSizeFormatted: "{format_file_size(total_size)}",
  assets: {json.dumps(assets, ensure_ascii=False, indent=2)},
  metadata: {{
    description: "自动生成的素材配置文件",
    generatedBy: "scan_assets.py"
  }}
}};

// 获取指定类型的文件列表
export const getAssetsByType = (type) => {{
  return assetsConfig.assets[type] || [];
}};

// 获取所有文件列表
export const getAllAssets = () => {{
  return assetsConfig.assets;
}};

// 获取总文件数
export const getTotalAssetsCount = () => {{
  return assetsConfig.totalFiles;
}};

// 获取总文件大小（字节）
export const getTotalAssetsSize = () => {{
  return assetsConfig.totalSize;
}};

// 获取总文件大小（格式化）
export const getTotalAssetsSizeFormatted = () => {{
  return assetsConfig.totalSizeFormatted;
}};

// 根据文件大小筛选文件
export const getAssetsBySizeRange = (type, minSize = 0, maxSize = Infinity) => {{
  const files = assetsConfig.assets[type] || [];
  return files.filter(file => file.size >= minSize && file.size <= maxSize);
}};

// 获取指定类型文件的总大小
export const getTypeTotalSize = (type) => {{
  const files = assetsConfig.assets[type] || [];
  return files.reduce((total, file) => total + file.size, 0);
}};

export default assetsConfig;
"""
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"JavaScript配置文件已生成: {output_file}")
        return True
    except Exception as e:
        print(f"生成JavaScript配置文件时出现错误: {e}")
        return False

def main():
    """主函数"""
    print("=== 素材文件扫描器 ===")
    print("正在扫描public目录...")
    
    # 扫描素材文件
    assets = scan_assets()
    
    if not any(assets.values()):
        print("未找到任何素材文件，请检查目录路径")
        return
    
    # 生成JSON配置文件
    generate_assets_config(assets, "./src/assets/assets_config.json")
    
    # 生成JavaScript配置文件
    generate_js_config(assets, "./src/assets/assets_config.js")
    
    print("\n=== 扫描完成 ===")
    print("现在你可以在React组件中使用这些配置文件了!")

if __name__ == "__main__":
    main()
