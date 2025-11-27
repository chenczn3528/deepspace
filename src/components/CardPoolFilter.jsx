import React, { useEffect, useMemo, useRef, useState } from "react";
import cardData from "../assets/cards.json";
import poolCategories from "../assets/poolCategories.json";

const characters = ["沈星回", "黎深", "祁煜", "秦彻", "夏以昼"];

const cleanPoolName = (name) => {
    if (!name) return "";
    return name.replace(/^\[+/, "").trim();
};

const extractPoolName = (getStr) => {
    if (!getStr) return "";
    const bracketMatch = getStr.match(/[\[【]([^】\]]+)[\]】]/);
    if (bracketMatch) {
        return cleanPoolName(bracketMatch[1].replace(/「|」/g, ""));
    }
    const quoteMatch = getStr.match(/「([^」]+)」/);
    if (quoteMatch) {
        return cleanPoolName(quoteMatch[1]);
    }
    return cleanPoolName(getStr);
};

const buildPoolDataset = () => {
    const poolOrderMap = {};
    const parseTimeToTimestamp = (timeStr) => {
        if (!timeStr) return Number.MAX_SAFE_INTEGER;
        const normalized = timeStr
            .replace(/年|月/g, "/")
            .replace(/日|\./g, "/")
            .replace(/\/+$/g, "")
            .replace(/-+/g, "/");
        const ts = Date.parse(normalized);
        if (!Number.isNaN(ts)) return ts;
        const parts = (timeStr.match(/\d+/g) || []).map(Number);
        if (parts.length >= 3) {
            const [y, m, d] = parts;
            const fallback = new Date(y, (m || 1) - 1, d || 1).getTime();
            if (!Number.isNaN(fallback)) return fallback;
        }
        return Number.MAX_SAFE_INTEGER;
    };

    cardData.forEach((card, index) => {
        if (parseInt(card.star, 10) !== 5) return;
        const pool = extractPoolName(card.get);
        if (!pool || poolOrderMap[pool]) return;
        poolOrderMap[pool] = {
            timestamp: parseTimeToTimestamp(card.time),
            index,
        };
    });

    const infoMap = {};
    const limited = [];
    const permanent = [];
    const event = [];
    const special = [];

    const normalizeEntry = (entry, defaults = {}) => {
        if (!entry) return null;
        if (typeof entry === "string") {
            return {
                name: entry,
                poolType: defaults.poolType || "mixed",
                roleCount: defaults.roleCount ?? 0,
                isPermanent: defaults.isPermanent ?? false,
            };
        }
        return {
            name: entry.name,
            poolType: entry.poolType || defaults.poolType || "mixed",
            roleCount: typeof entry.roleCount === "number" ? entry.roleCount : (defaults.roleCount ?? 0),
            isPermanent: typeof entry.isPermanent === "boolean" ? entry.isPermanent : (defaults.isPermanent ?? false),
        };
    };

    const appendUnique = (target, name) => {
        if (!name) return;
        if (!target.includes(name)) {
            target.push(name);
        }
    };

    const registerEntry = (entry, categoryKey, subKey = null) => {
        const defaults = {
            poolType: subKey === "limited" ? "single" : "mixed",
            roleCount: 0,
            isPermanent: subKey === "permanent",
        };
        const normalized = normalizeEntry(entry, defaults);
        if (!normalized || !normalized.name) return;

        const record = {
            ...normalized,
            categoryKey,
            subCategoryKey: subKey,
        };
        infoMap[normalized.name] = record;

        if (categoryKey === "wishSeries" && subKey === "limited") {
            appendUnique(limited, normalized.name);
        } else if (categoryKey === "wishSeries" && subKey === "permanent") {
            appendUnique(permanent, normalized.name);
        } else if (categoryKey === "eventSeries") {
            appendUnique(event, normalized.name);
        } else if (categoryKey === "specialRewards") {
            appendUnique(special, normalized.name);
        }
    };

    const limitedEntries = poolCategories?.wishSeries?.subcategories?.limited?.pools ?? [];
    const permanentEntries = poolCategories?.wishSeries?.subcategories?.permanent?.pools ?? [];
    const eventEntries = poolCategories?.eventSeries?.pools ?? [];
    const specialEntries = poolCategories?.specialRewards?.pools ?? [];

    limitedEntries.forEach((entry) => registerEntry(entry, "wishSeries", "limited"));
    permanentEntries.forEach((entry) => registerEntry(entry, "wishSeries", "permanent"));
    eventEntries.forEach((entry) => registerEntry(entry, "eventSeries"));
    specialEntries.forEach((entry) => registerEntry(entry, "specialRewards"));

    if (permanent.length === 0) {
        [
            { name: "常驻", poolType: "mixed", roleCount: 1, isPermanent: true },
            { name: "许愿", poolType: "mixed", roleCount: 5, isPermanent: true },
        ].forEach((entry) => registerEntry(entry, "wishSeries", "permanent"));
    }

    return {
        poolInfoMap: infoMap,
        poolOrderMap,
        limitedPools: limited,
        permanentPools: permanent,
        eventPools: event,
        specialPools: special,
    };
};

const getRolePools = (role, data) => {
    const roleCards = data.filter((card) => card.character === role && parseInt(card.star, 10) === 5);
    const rolePools = new Set();
    roleCards.forEach((card) => {
        const pool = extractPoolName(card.get);
        if (pool) {
            rolePools.add(pool);
        }
    });
    return Array.from(rolePools);
};

const arraysEqual = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((value, index) => value === sortedB[index]);
};

const uniqueArray = (arr = []) => Array.from(new Set(arr));

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
    const baseFontsize = Number.isFinite(Number(fontsize)) ? Number(fontsize) : 0;
    const modalMargin = Math.max(baseFontsize * 1.6, 18);
    const innerPadding = Math.max(baseFontsize * 0.8, 16);
    const sectionGap = Math.max(baseFontsize * 0.6, 12);
    const headerMarginTop = Math.max(baseFontsize * 0.4, 14);
    const contentSidePadding = Math.max(baseFontsize * 0.6, 14);
    const buttonGap = Math.max(baseFontsize * 0.3, 8);

    const { poolInfoMap, poolOrderMap, limitedPools, permanentPools } = useMemo(() => buildPoolDataset(), []);

    const comparePoolsByRelease = (a, b) => {
        const metaA = poolOrderMap[a] || { timestamp: Number.MAX_SAFE_INTEGER, index: Number.MAX_SAFE_INTEGER };
        const metaB = poolOrderMap[b] || { timestamp: Number.MAX_SAFE_INTEGER, index: Number.MAX_SAFE_INTEGER };
        if (metaA.timestamp !== metaB.timestamp) {
            return metaA.timestamp - metaB.timestamp;
        }
        return metaA.index - metaB.index;
    };

    const sortPoolsByRelease = (list) => list.slice().sort(comparePoolsByRelease);

    const toggleablePools = useMemo(() => sortPoolsByRelease([...limitedPools]), [limitedPools]);

    const derivedSelectedRoles = useMemo(() => {
        if (Array.isArray(selectedRoleFilters) && selectedRoleFilters.length > 0) {
            return selectedRoleFilters.filter(Boolean);
        }
        if (selectedRole && selectedRole !== "随机") {
            return [selectedRole];
        }
        return [];
    }, [selectedRoleFilters, selectedRole]);

    const [selectedRoles, setSelectedRoles] = useState(derivedSelectedRoles);
    useEffect(() => {
        setSelectedRoles(derivedSelectedRoles);
    }, [derivedSelectedRoles]);

    const [currentAvailablePools, setCurrentAvailablePools] = useState(toggleablePools);

    const [selectedLimitedPools, setSelectedLimitedPools] = useState(() => {
        return sortPoolsByRelease((selectedPools || []).filter((pool) => toggleablePools.includes(pool)));
    });

    const hasSyncedOnOpenRef = useRef(false);

    useEffect(() => {
        if (!poolsLoaded) return;
        if (!showCardPoolFilter) {
            hasSyncedOnOpenRef.current = false;
            return;
        }
        if (hasSyncedOnOpenRef.current) return;
        const incoming = sortPoolsByRelease((selectedPools || []).filter((pool) => toggleablePools.includes(pool)));
        setSelectedLimitedPools(incoming);
        hasSyncedOnOpenRef.current = true;
    }, [showCardPoolFilter, poolsLoaded, selectedPools, toggleablePools]);

    useEffect(() => {
        if (!poolsLoaded) return;
        if (!selectedRoles || selectedRoles.length === 0) {
            setCurrentAvailablePools(toggleablePools);
            return;
        }

        const rolePools = new Set();
        selectedRoles.forEach((role) => {
            getRolePools(role, cardData).forEach((pool) => {
                if (toggleablePools.includes(pool)) {
                    rolePools.add(pool);
                }
            });
        });

        setCurrentAvailablePools(rolePools.size > 0 ? sortPoolsByRelease(Array.from(rolePools)) : []);
    }, [poolsLoaded, selectedRoles, toggleablePools]);

    useEffect(() => {
        setSelectedLimitedPools((prev) => prev.filter((pool) => currentAvailablePools.includes(pool)));
    }, [currentAvailablePools]);

    const handleRoleClick = (role) => {
        const isSelected = selectedRoles.includes(role);
        let newSelectedRoles;
        let newSelectedPools;

        const rolePools = getRolePools(role, cardData)
            .filter((pool) => toggleablePools.includes(pool))
            .filter((pool) => (poolInfoMap[pool]?.poolType || "single") === "single");

        if (isSelected) {
            newSelectedRoles = selectedRoles.filter((r) => r !== role);
            newSelectedPools = selectedLimitedPools.filter((p) => !rolePools.includes(p));
        } else {
            newSelectedRoles = [...selectedRoles, role];
            newSelectedPools = [...selectedLimitedPools, ...rolePools];
        }

        newSelectedPools = sortPoolsByRelease(uniqueArray(newSelectedPools).filter((pool) => toggleablePools.includes(pool)));

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

    const isAllLimitedSelected = currentAvailablePools.length > 0 && currentAvailablePools.every((pool) => selectedLimitedPools.includes(pool));

    const toggleLimitedPool = (pool) => {
        setSelectedLimitedPools((prev) => {
            const next = prev.includes(pool) ? prev.filter((p) => p !== pool) : [...prev, pool];
            return sortPoolsByRelease(uniqueArray(next).filter((item) => toggleablePools.includes(item)));
        });
    };

    const toggleAllPools = (checked) => {
        if (checked) {
            setSelectedLimitedPools([...currentAvailablePools]);
        } else {
            setSelectedLimitedPools([]);
        }
    };

    const commitSelectionChanges = () => {
        if (!poolsLoaded) return;
        const merged = uniqueArray([...permanentPools, ...selectedLimitedPools]);
        if (!arraysEqual(merged, selectedPools || [])) {
            setSelectedPools(merged);
        }
    };

    const displayGroups = useMemo(() => {
        const groups = [];
        const addGroup = (key, title, pools) => {
            if (pools.length > 0) {
                groups.push({ key, title, pools });
            }
        };

        const singleLimited = currentAvailablePools.filter(
            (pool) => limitedPools.includes(pool) && (poolInfoMap[pool]?.poolType || "single") === "single"
        );
        const mixedLimited = currentAvailablePools.filter(
            (pool) => limitedPools.includes(pool) && (poolInfoMap[pool]?.poolType || "single") === "mixed"
        );

        addGroup("limited-single", "单人限定卡池", singleLimited);
        addGroup("limited-mixed", "混池限定卡池", mixedLimited);

        return groups;
    }, [currentAvailablePools, limitedPools, poolInfoMap]);

    const renderPoolButton = (pool) => {
        const isSelected = selectedLimitedPools.includes(pool);
        return (
            <button
                key={pool}
                onClick={() => toggleLimitedPool(pool)}
                style={{
                    backgroundColor: isSelected ? "rgba(239,218,160,0.85)" : "rgba(255,255,255,0.08)",
                    color: isSelected ? "#111" : "#eee",
                    borderRadius: `${Math.max(baseFontsize * 0.25, 6)}px`,
                    padding: `${Math.max(baseFontsize * 0.35, 6)}px ${Math.max(baseFontsize * 0.7, 12)}px`,
                    fontSize: `${Math.max(baseFontsize * 1, 14)}px`,
                    fontWeight: 600,
                    boxShadow: isSelected ? "0 0 12px rgba(255,215,128,0.5)" : "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                    whiteSpace: "nowrap",
                }}
            >
                {pool}
            </button>
        );
    };

    const handleCloseFilter = () => {
        commitSelectionChanges();
        setShowCardPoolFilter(false);
    };

    return (
        showCardPoolFilter && (
            <div
                className="absolute w-full h-full z-50 flex items-center justify-center"
                onClick={handleCloseFilter}
                style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}
            >
                <div
                    className="flex flex-col"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    style={{
                        width: `calc(100% - ${modalMargin * 2}px)`,
                        maxWidth: "640px",
                        height: `calc(100% - ${modalMargin * 2}px)`,
                        maxHeight: "760px",
                        margin: `${modalMargin}px`,
                        backgroundColor: "#1f2230",
                        color: "white",
                        borderRadius: `${Math.max(baseFontsize * 0.5, 16)}px`,
                        boxShadow: "0 20px 80px rgba(0,0,0,0.45)",
                    }}
                >
                    <div className="relative flex flex-col h-full overflow-hidden" style={{ padding: `${innerPadding}px` }}>
                        <label
                            className="flex justify-center items-center mb-4"
                            style={{
                                fontSize: `${Math.max(baseFontsize * 1.5, 18)}px`,
                                fontWeight: 800,
                                marginTop: `${headerMarginTop}px`,
                                letterSpacing: "0.08em",
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
                            }}
                        >
                            <div style={{ marginBottom: `${sectionGap}px` }}>
                                <label style={{ fontSize: `${Math.max(baseFontsize * 0.95, 14)}px`, marginBottom: 6, display: "block" }}>
                                    选择角色：
                                </label>
                                <div className="flex flex-wrap" style={{ gap: `${buttonGap}px` }}>
                                    {characters.map((char) => {
                                        const isSelected = selectedRoles.includes(char);
                                        return (
                                            <button
                                                key={char}
                                                onClick={() => handleRoleClick(char)}
                                                style={{
                                                    fontSize: `${Math.max(baseFontsize, 14)}px`,
                                                    backgroundColor: isSelected ? "rgba(239,218,160,0.85)" : "transparent",
                                                    color: isSelected ? "#111" : "#aaa",
                                                    boxShadow: isSelected ? "0 0 12px gold" : "0 0 8px rgba(0,0,0,0.4)",
                                                    padding: `${Math.max(baseFontsize * 0.4, 8)}px ${Math.max(baseFontsize * 0.8, 14)}px`,
                                                    borderRadius: `${Math.max(baseFontsize * 0.25, 8)}px`,
                                                }}
                                            >
                                                {char}
                                            </button>
                                        );
                                    })}
                                </div>
                                <label style={{ fontSize: `${Math.max(baseFontsize * 0.65, 10)}px`, color: "#999", marginTop: 6, display: "block" }}>
                                    点击角色可以快速选中 / 取消该角色相关的限定卡池。
                                </label>
                            </div>

                            <div style={{ marginBottom: `${sectionGap}px` }}>
                                <div className="flex flex-row gap-3 items-center">
                                    <label style={{ fontSize: `${Math.max(baseFontsize, 14)}px` }}>选择全部限定卡池</label>
                                    <input
                                        type="checkbox"
                                        checked={isAllLimitedSelected}
                                        onChange={(e) => toggleAllPools(e.target.checked)}
                                    />
                                </div>
                                <label style={{ fontSize: `${Math.max(baseFontsize * 0.7, 10)}px`, color: "#9ca3af", marginTop: 4 }}>
                                    不勾选则仅保留常驻卡池（系统会自动包含常驻池）。
                                </label>
                            </div>

                            {displayGroups.map((group) => (
                                <div key={group.key} style={{ marginBottom: `${sectionGap * 0.8}px` }}>
                                    <div style={{ marginBottom: 6 }}>
                                        <label style={{ fontSize: `${Math.max(baseFontsize * 1.05, 14)}px`, fontWeight: 700, color: "#f5dca8" }}>{group.title}</label>
                                        {group.description && (
                                            <div style={{ fontSize: `${Math.max(baseFontsize * 0.7, 10)}px`, color: "#9ca3af", marginTop: 4 }}>
                                                {group.description}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap" style={{ gap: `${buttonGap}px` }}>
                                        {group.pools.map(renderPoolButton)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    );
};

export default CardPoolFilter;
