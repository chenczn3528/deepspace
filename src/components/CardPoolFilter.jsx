import React, { useEffect, useMemo, useState } from "react";
import cardData from "../assets/cards.json";

const cleanPoolName = (name) => {
    if (!name) return "";
    return name.replace(/^\[+/, "").trim();
};

// 提取池子名称的工具函数（处理get字段中的格式）
const extractPoolName = (getStr) => {
    if (!getStr) return "";
    // 处理格式：限时许愿[[「时与世的边缘」]] 或 限时许愿「当宇宙陷落」
    const bracketMatch = getStr.match(/[\[【]([^】\]]+)[\]】]/);
    if (bracketMatch) {
        return cleanPoolName(bracketMatch[1].replace(/「|」/g, ""));
    }
    // 处理格式：限时许愿「当宇宙陷落」
    const quoteMatch = getStr.match(/「([^」]+)」/);
    if (quoteMatch) {
        return cleanPoolName(quoteMatch[1]);
    }
    // 如果没有特殊格式，返回原字符串（如"常驻"）
    return cleanPoolName(getStr);
};

// 获取可用池子列表
const isExcludedPool = (name) => name === "许愿";

const getAvailablePools = (cardData) => {
    const poolCountMap = {};

    cardData.forEach((card) => {
        if (parseInt(card.star) === 5) {
            const pool = extractPoolName(card.get);
            if (pool && pool !== "常驻" && !isExcludedPool(pool)) {
                if (!poolCountMap[pool]) {
                    poolCountMap[pool] = 0;
                }
                poolCountMap[pool]++;
            }
        }
    });

    const allPools = Object.keys(poolCountMap).filter((pool) => poolCountMap[pool] > 0);
    const permanentPools = ["常驻"];
    const availablePools = allPools.filter((pool) => pool !== "常驻" && !isExcludedPool(pool));

    return { availablePools, permanentPools };
};

// 获取角色对应的卡池
const getRolePools = (role, cardData) => {
    const roleCards = cardData.filter(
        card => card.character === role && parseInt(card.star) === 5
    );
    const rolePools = new Set();
    roleCards.forEach(card => {
        const pool = extractPoolName(card.get);
        if (pool && pool !== "常驻") {
            rolePools.add(pool);
        }
    });
    return Array.from(rolePools);
};

const CardPoolFilter = ({
    fontsize,
    showCardPoolFilter,
    setShowCardPoolFilter,
    selectedPools,
    setSelectedPools,
    poolsLoaded,
    selectedRoleFilters,
    setSelectedRoleFilters,
    updateSelectedRole,
    handleSelectedRoleChange,
    selectedRole,
}) => {

    const characters = ["沈星回", "黎深", "祁煜", "秦彻", "夏以昼"];

    const { availablePools, permanentPools } = useMemo(() => getAvailablePools(cardData), []);

    const [currentAvailablePools, setCurrentAvailablePools] = useState(availablePools);

    const derivedSelectedRoles = useMemo(() => {
        if (Array.isArray(selectedRoleFilters) && selectedRoleFilters.length > 0) {
            return selectedRoleFilters.filter(Boolean);
        }
        if (selectedRole && selectedRole !== "随机") {
            return [selectedRole];
        }
        return [];
    }, [selectedRoleFilters, selectedRole]);

    // 选中的角色列表
    const [selectedRoles, setSelectedRoles] = useState(derivedSelectedRoles);

    useEffect(() => {
        setSelectedRoles(derivedSelectedRoles);
    }, [derivedSelectedRoles]);

    // 初始化时根据 selectedPools 过滤出 limited 池
    const [selectedLimitedPools, setSelectedLimitedPools] = useState(() => {
        if (!selectedPools || selectedPools.length === 0) return [];
        return selectedPools.filter(p => availablePools.includes(p));
    });

    const baseFontsize = Number.isFinite(Number(fontsize)) ? Number(fontsize) : 0;
    const modalMargin = Math.max(baseFontsize * 2, 24);
    const innerPadding = Math.max(baseFontsize, 20);
    const sectionGap = Math.max(baseFontsize * 0.8, 16);
    const headerMarginTop = Math.max(baseFontsize * 0.6, 18);
    const contentSidePadding = Math.max(baseFontsize * 0.8, 18);
    const buttonGap = Math.max(baseFontsize * 0.4, 10);

    // 等 poolsLoaded 后再同步一次（只第一次）
    useEffect(() => {
        if (!poolsLoaded) return;
        if (!selectedPools || selectedPools.length === 0) return;
        setSelectedLimitedPools(
            selectedPools.filter(p => currentAvailablePools.includes(p))
        );
    }, [poolsLoaded]);

    // 根据选中的角色更新可用池子列表
    useEffect(() => {
        if (!poolsLoaded) return;
        if (!selectedRoles || selectedRoles.length === 0) {
            setCurrentAvailablePools(availablePools);
            return;
        }

        const rolePools = new Set();
        selectedRoles.forEach(role => {
            getRolePools(role, cardData).forEach(pool => {
                if (availablePools.includes(pool)) {
                    rolePools.add(pool);
                }
            });
        });

        setCurrentAvailablePools(rolePools.size > 0 ? Array.from(rolePools) : []);
    }, [poolsLoaded, selectedRoles, availablePools]);

    useEffect(() => {
        setSelectedLimitedPools(prev =>
            prev.filter(pool => currentAvailablePools.includes(pool))
        );
    }, [currentAvailablePools]);

    // 点击角色时，切换角色选中状态并更新卡池
    const handleRoleClick = (role) => {
        const isSelected = selectedRoles.includes(role);
        let newSelectedRoles;
        let newSelectedPools;

        if (isSelected) {
            // 取消选中：移除该角色
            newSelectedRoles = selectedRoles.filter(r => r !== role);
            // 移除该角色的所有卡池
            const rolePools = getRolePools(role, cardData);
            newSelectedPools = selectedLimitedPools.filter(p => !rolePools.includes(p));
        } else {
            // 选中：添加该角色
            newSelectedRoles = [...selectedRoles, role];
            // 添加该角色的所有卡池
            const rolePools = getRolePools(role, cardData);
            newSelectedPools = [...new Set([...selectedLimitedPools, ...rolePools])];
        }

        setSelectedRoles(newSelectedRoles);
        setSelectedLimitedPools(newSelectedPools);

        if (newSelectedRoles.length === 0) {
            if (handleSelectedRoleChange) {
                handleSelectedRoleChange("随机");
            } else {
                updateSelectedRole && updateSelectedRole("随机");
                setSelectedRoleFilters && setSelectedRoleFilters([]);
            }
        } else if (newSelectedRoles.length === 1) {
            if (handleSelectedRoleChange) {
                handleSelectedRoleChange(newSelectedRoles[0]);
            } else {
                updateSelectedRole && updateSelectedRole(newSelectedRoles[0]);
                setSelectedRoleFilters && setSelectedRoleFilters(newSelectedRoles);
            }
        } else {
            updateSelectedRole && updateSelectedRole("随机");
            setSelectedRoleFilters && setSelectedRoleFilters(newSelectedRoles);
        }
    };

    // 是否全选
    const isAllLimitedSelected = currentAvailablePools.length > 0 && currentAvailablePools.every((pool) =>
        selectedLimitedPools.includes(pool)
    );

    // 切换选中池
    const toggleLimitedPool = (pool) => {
        setSelectedLimitedPools(prev => {
            const newSelected = prev.includes(pool)
                ? prev.filter(p => p !== pool)
                : [...prev, pool];
            return Array.from(new Set(newSelected));
        });
    };

    // 全选/取消全选
    const toggleAllPools = () => {
        if (isAllLimitedSelected) {
            setSelectedLimitedPools([]);
        } else {
            setSelectedLimitedPools([...currentAvailablePools]);
        }
    };

    // 将 selectedLimitedPools + permanentPools 合并写入父级 selectedPools
    useEffect(() => {
        if (!poolsLoaded) return;

        const newSelectedPools = [...selectedLimitedPools, ...permanentPools];
        if (JSON.stringify(newSelectedPools.sort()) !== JSON.stringify((selectedPools || []).sort())) {
            setSelectedPools(newSelectedPools);
        }
    }, [selectedLimitedPools, permanentPools, poolsLoaded]);

    return (
        showCardPoolFilter && (
            <div
                className="absolute w-full h-full z-50 flex items-center justify-center"
                onClick={() => {
                    setShowCardPoolFilter(false);
                }}
                style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
            >
                <div
                    className="flex flex-col"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    style={{
                        width: `calc(100% - ${modalMargin * 2}px)`,
                        maxWidth: `500px`,
                        height: `calc(100% - ${modalMargin * 2}px)`,
                        maxHeight: `800px`,
                        margin: `${modalMargin}px`,
                        backgroundColor: "#2a2d39",
                        fontSize: `${fontsize * 1.2}px`,
                        color: "white",
                        borderRadius: `${fontsize * 0.5}px`,
                    }}
                >
                    <div
                        className="relative flex flex-col h-full overflow-hidden"
                        style={{
                            padding: `${innerPadding}px`,
                            rowGap: `${sectionGap}px`,
                        }}
                    >
                        <label
                            className="flex justify-center items-center mb-4"
                            style={{
                                fontSize: `${fontsize * 2}px`,
                                fontWeight: "800",
                                marginTop: `${headerMarginTop}px`,
                            }}
                        >
                            筛选卡池
                        </label>

                        <div
                            className="flex-1 overflow-y-auto"
                            style={{
                                paddingLeft: `${contentSidePadding}px`,
                                paddingRight: `${contentSidePadding}px`,
                                paddingBottom: `${innerPadding}px`,
                                overflowY: "auto",
                            }}
                        >
                            {/* 角色选择 */}
                            <div style={{ marginBottom: `${sectionGap * 1.2}px` }}>
                                <label style={{ fontSize: `${fontsize * 1.2}px`, marginBottom: `${fontsize * 0.5}px`, display: 'block' }}>选择角色：</label>
                                <div className="flex flex-row flex-wrap" style={{ gap: `${buttonGap}px` }}>
                                    {characters.map((char) => {
                                        const isSelected = selectedRoles.includes(char);
                                        return (
                                            <button
                                                key={char}
                                                onClick={() => handleRoleClick(char)}
                                                style={{
                                                    fontSize: `${fontsize * 1.2}px`,
                                                    backgroundColor: isSelected ? "rgba(239,218,160,0.8)" : "transparent",
                                                    color: isSelected ? "#111" : "#aaa",
                                                    boxShadow: isSelected ? "0 0 10px gold, 0 0 20px gold" : "0 0 10px #111214, 0 0 20px #111214",
                                                    padding: `${fontsize * 0.5}px ${fontsize * 1}px`,
                                                    borderRadius: `${fontsize * 0.2}px`,
                                                }}
                                            >
                                                {char}
                                            </button>
                                        );
                                    })}
                                </div>
                                <label style={{ fontSize: `${fontsize * 0.9}px`, color: "#aaa", marginTop: `${fontsize * 0.5}px`, display: 'block' }}>
                                    点击角色可选中/取消选中该角色的所有卡池
                                </label>
                            </div>

                            {/* 全选按钮 */}
                            <div className="flex flex-col" style={{ marginBottom: `${sectionGap}px` }}>
                                <div className="flex flex-row gap-2 items-center">
                                    <label style={{ fontSize: `${fontsize * 1.2}px` }}>选择全部限定卡池</label>
                                    <input
                                        type="checkbox"
                                        checked={isAllLimitedSelected}
                                        onChange={toggleAllPools}
                                    />
                                </div>
                                <label style={{ fontSize: `${fontsize * 1}px`, color: "#aaa" }}>
                                    （不勾选则仅有常驻世界卡）
                                </label>
                            </div>

                            {/* 卡池选择 */}
                            <div className="flex flex-col" style={{ rowGap: `${sectionGap}px` }}>
                                {currentAvailablePools.length > 0 ? (
                                    <div className="flex flex-col" style={{ rowGap: `${sectionGap * 0.6}px` }}>
                                        <label
                                            style={{
                                                fontSize: `${fontsize * 1.3}px`,
                                                color: "#efd6a0",
                                                fontWeight: 700,
                                            }}
                                        >
                                            限定池
                                        </label>
                                        <div
                                            className="flex flex-wrap"
                                            style={{
                                                gap: `${buttonGap}px`,
                                                paddingLeft: `${buttonGap}px`,
                                                paddingRight: `${buttonGap}px`,
                                                paddingTop: `${buttonGap}px`,
                                                paddingBottom: `${buttonGap}px`,
                                            }}
                                        >
                                            {currentAvailablePools.map((pool) => {
                                                const isSelected = selectedLimitedPools.includes(pool);
                                                return (
                                                    <button
                                                        key={pool}
                                                        onClick={() => toggleLimitedPool(pool)}
                                                        style={{
                                                            backgroundColor: isSelected ? "rgba(239,218,160,0.8)" : "transparent",
                                                            color: isSelected ? "#111" : "#aaa",
                                                            boxShadow: isSelected ? "0 0 5px gold, 0 0 10px gold" : "0 0 5px #111214, 0 0 10px #111214",
                                                            fontSize: `${fontsize * 1.1}px`,
                                                            padding: `${fontsize * 0.5}px ${fontsize * 1}px`,
                                                            borderRadius: `${fontsize * 0.2}px`,
                                                        }}
                                                    >
                                                        {pool}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <label style={{ fontSize: `${fontsize * 1}px`, color: "#aaa" }}>
                                        当前没有可用的限定池
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    );
};

export default CardPoolFilter;
