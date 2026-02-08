"use client";

import { useState } from "react";

export interface MatchCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "halftime" | "finished";
  kickoff: string;
  minute: number | null;
  league: string;
  commentator: string | null;
  twitterVerified: boolean;
  homeLogoUrl: string;
  awayLogoUrl: string;
}

const STATUS_LABELS: Record<MatchCardProps["status"], string> = {
  scheduled: "لم تبدأ",
  live: "مباشر",
  halftime: "استراحة",
  finished: "انتهت",
};

const STATUS_COLORS: Record<MatchCardProps["status"], string> = {
  scheduled: "bg-gray-600 text-gray-200",
  live: "bg-red-600 text-white animate-pulse",
  halftime: "bg-yellow-600 text-white",
  finished: "bg-gray-500 text-gray-200",
};

function TeamLogo({ url, name }: { url: string; name: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="h-10 w-10 rounded-full object-contain"
      />
    );
  }
  // Fallback: first letter avatar
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-lg font-bold text-brand">
      {name.charAt(0)}
    </div>
  );
}

export default function MatchCard(props: MatchCardProps) {
  const {
    id,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    status,
    kickoff,
    minute,
    league,
    commentator,
    twitterVerified,
    homeLogoUrl,
    awayLogoUrl,
  } = props;

  const [isFavorite, setIsFavorite] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("fav-matches");
    return stored ? JSON.parse(stored).includes(id) : false;
  });

  const [notifyEnabled, setNotifyEnabled] = useState(false);

  const toggleFavorite = () => {
    setIsFavorite((prev: boolean) => {
      const stored = localStorage.getItem("fav-matches");
      const favs: string[] = stored ? JSON.parse(stored) : [];
      const next = prev ? favs.filter((f) => f !== id) : [...favs, id];
      localStorage.setItem("fav-matches", JSON.stringify(next));
      return !prev;
    });
  };

  const toggleNotification = async () => {
    if (!notifyEnabled && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
    }
    setNotifyEnabled((prev) => !prev);
  };

  const kickoffTime = new Date(kickoff).toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isActive = status === "live" || status === "halftime";

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg hover:shadow-brand/5 ${
        isActive
          ? "border-red-500/30 bg-[#0e1319]/95"
          : "border-[#1a2535] bg-[#0e1319]/80"
      }`}
    >
      {/* League & Status bar */}
      <div className="flex items-center justify-between border-b border-[#1a2535] px-4 py-2">
        <span className="text-xs text-gray-400">{league}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
        >
          {STATUS_LABELS[status]}
          {minute !== null && status !== "finished" && ` ${minute}'`}
        </span>
      </div>

      {/* Main content */}
      <div className="px-4 py-5">
        {/* Teams & Score */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Home team */}
          <div className="flex flex-col items-center gap-2 text-center">
            <TeamLogo url={homeLogoUrl} name={homeTeam} />
            <span className="text-sm font-semibold text-white">{homeTeam}</span>
          </div>

          {/* Score / Time */}
          <div className="flex flex-col items-center gap-1">
            {status === "scheduled" ? (
              <span className="text-xl font-bold text-brand">{kickoffTime}</span>
            ) : (
              <div className="flex items-center gap-2 text-2xl font-bold">
                <span className="text-white">{homeScore ?? 0}</span>
                <span className="text-gray-500">-</span>
                <span className="text-white">{awayScore ?? 0}</span>
              </div>
            )}
            {isActive && (
              <span className="mt-1 text-xs text-red-400">
                ⏱ الدقيقة {minute}&apos;
              </span>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-2 text-center">
            <TeamLogo url={awayLogoUrl} name={awayTeam} />
            <span className="text-sm font-semibold text-white">{awayTeam}</span>
          </div>
        </div>

        {/* Commentator */}
        {commentator && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#1a2535]/50 px-3 py-2 text-sm">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span className="text-gray-300">المعلق: {commentator}</span>
            {twitterVerified && (
              <svg
                className="h-4 w-4 text-blue-400"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between border-t border-[#1a2535] px-4 py-2">
        <button
          onClick={toggleFavorite}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-white/5"
          aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        >
          <svg
            className={`h-4 w-4 transition-colors ${
              isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-500"
            }`}
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className={isFavorite ? "text-yellow-400" : "text-gray-500"}>
            {isFavorite ? "مفضلة" : "تفضيل"}
          </span>
        </button>

        <button
          onClick={toggleNotification}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-white/5"
          aria-label={notifyEnabled ? "إيقاف التنبيهات" : "تفعيل التنبيهات"}
        >
          <svg
            className={`h-4 w-4 ${
              notifyEnabled ? "text-brand" : "text-gray-500"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className={notifyEnabled ? "text-brand" : "text-gray-500"}>
            {notifyEnabled ? "تنبيه فعّال" : "تنبيه"}
          </span>
        </button>
      </div>
    </div>
  );
}
