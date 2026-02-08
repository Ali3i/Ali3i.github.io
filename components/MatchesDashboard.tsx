"use client";

import { useCallback, useEffect, useState } from "react";
import MatchCard, { type MatchCardProps } from "./MatchCard";

interface ApiResponse {
  matches: MatchCardProps[];
  date: string;
}

const LEAGUES = [
  { id: "all", label: "جميع الدوريات" },
  { id: "rsl", label: "دوري روشن" },
  { id: "epl", label: "الإنجليزي" },
  { id: "laliga", label: "الإسباني" },
  { id: "bundesliga", label: "الألماني" },
  { id: "seriea", label: "الإيطالي" },
  { id: "ligue1", label: "الفرنسي" },
  { id: "epl-eg", label: "المصري" },
];

const REFRESH_INTERVAL = 30_000; // 30 seconds

function formatDateParam(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MatchesDashboard() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [matches, setMatches] = useState<MatchCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        date: formatDateParam(selectedDate),
        ...(selectedLeague !== "all" && { league: selectedLeague }),
      });

      const res = await fetch(`/api/matches?${params}`);
      if (!res.ok) throw new Error("فشل في تحميل المباريات");

      const data: ApiResponse = await res.json();
      setMatches(data.matches);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedLeague]);

  // Initial fetch & auto-refresh for live matches
  useEffect(() => {
    setLoading(true);
    fetchMatches();

    const interval = setInterval(fetchMatches, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const shiftDate = (days: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  const displayedMatches = showFavoritesOnly
    ? matches.filter((m) => {
        if (typeof window === "undefined") return false;
        const stored = localStorage.getItem("fav-matches");
        return stored ? JSON.parse(stored).includes(m.id) : false;
      })
    : matches;

  const liveCount = matches.filter(
    (m) => m.status === "live" || m.status === "halftime"
  ).length;

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#1a2535] bg-[#0a0e14]/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4">
          {/* Title row */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold md:text-2xl">
                مباريات اليوم
              </h1>
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-600/20 px-3 py-1 text-xs font-medium text-red-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  {liveCount} مباشر
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Favorites filter */}
              <button
                onClick={() => setShowFavoritesOnly((p) => !p)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  showFavoritesOnly
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-[#1a2535] text-gray-400 hover:text-white"
                }`}
              >
                {showFavoritesOnly ? "★ المفضلة" : "☆ المفضلة"}
              </button>

              {/* View toggle */}
              <button
                onClick={() =>
                  setViewMode((p) => (p === "grid" ? "list" : "grid"))
                }
                className="rounded-lg bg-[#1a2535] px-3 py-2 text-xs text-gray-400 transition-colors hover:text-white"
                aria-label="تبديل العرض"
              >
                {viewMode === "grid" ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Date selector */}
          <div className="mb-3 flex items-center justify-center gap-3">
            <button
              onClick={() => shiftDate(-1)}
              className="rounded-lg bg-[#1a2535] px-3 py-2 text-sm transition-colors hover:bg-[#243447]"
              aria-label="اليوم السابق"
            >
              ←
            </button>
            <div className="min-w-[200px] text-center">
              <span className="text-sm font-medium">
                {formatDateLabel(selectedDate)}
              </span>
            </div>
            <button
              onClick={() => shiftDate(1)}
              className="rounded-lg bg-[#1a2535] px-3 py-2 text-sm transition-colors hover:bg-[#243447]"
              aria-label="اليوم التالي"
            >
              →
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="rounded-lg bg-brand/20 px-3 py-2 text-xs font-medium text-brand transition-colors hover:bg-brand/30"
            >
              اليوم
            </button>
          </div>

          {/* League filter */}
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {LEAGUES.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLeague(l.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  selectedLeague === l.id
                    ? "bg-brand text-white"
                    : "bg-[#1a2535] text-gray-400 hover:text-white"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Status bar */}
        {lastUpdated && (
          <p className="mb-4 text-center text-xs text-gray-500">
            آخر تحديث:{" "}
            {lastUpdated.toLocaleTimeString("ar-SA", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
            {" · "}
            يتم التحديث تلقائياً كل 30 ثانية
          </p>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            <p className="mt-4 text-sm text-gray-400">جاري تحميل المباريات...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="mx-auto max-w-md rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-8 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                fetchMatches();
              }}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && displayedMatches.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-gray-400">
              {showFavoritesOnly
                ? "لا توجد مباريات في المفضلة"
                : "لا توجد مباريات في هذا اليوم"}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              جرّب تغيير التاريخ أو الدوري
            </p>
          </div>
        )}

        {/* Match cards */}
        {!loading && !error && displayedMatches.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-4"
            }
          >
            {displayedMatches.map((match) => (
              <MatchCard key={match.id} {...match} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
