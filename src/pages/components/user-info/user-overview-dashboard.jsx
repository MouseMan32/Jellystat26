/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../lib/axios_instance";
import baseUrl from "../../../lib/baseurl";
import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";
import CalendarLineIcon from "remixicon-react/CalendarLineIcon";
import ComputerLineIcon from "remixicon-react/ComputerLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";
import MovieLineIcon from "remixicon-react/MovieLineIcon";
import PlayCircleLineIcon from "remixicon-react/PlayCircleLineIcon";
import TimeLineIcon from "remixicon-react/TimeLineIcon";
import TvLineIcon from "remixicon-react/TvLineIcon";

import "../../css/users/user-overview-dashboard.css";

const RANGE_OPTIONS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
  { label: "Last year", value: 365 },
];

function numberValue(value) {
  return Number(value ?? 0);
}

function formatDuration(seconds) {
  const totalSeconds = numberValue(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatDate(value) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getDelta(current, previous, label) {
  const currentValue = numberValue(current);
  const previousValue = numberValue(previous);

  if (previousValue === 0) {
    return currentValue > 0 ? { text: `New ${label}`, trend: "up" } : { text: `No ${label}`, trend: "neutral" };
  }

  const percentage = Math.round(((currentValue - previousValue) / previousValue) * 100);
  return {
    text: `${percentage > 0 ? "+" : ""}${percentage}% vs previous range`,
    trend: percentage > 0 ? "up" : percentage < 0 ? "down" : "neutral",
  };
}

function Poster({ itemId, title, className, fallback }) {
  const [failed, setFailed] = useState(false);

  if (!itemId || failed) {
    return <div className={`${className} user-dashboard-poster-fallback`}>{fallback}</div>;
  }

  return (
    <img
      className={className}
      src={`${baseUrl}/proxy/Items/Images/Primary?id=${itemId}&fillWidth=160&quality=70`}
      onError={() => setFailed(true)}
      alt={title}
    />
  );
}

function StatCard({ icon, label, value, detail, delta }) {
  return (
    <div className="user-dashboard-stat-card">
      <div className="user-dashboard-stat-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={`trend-${delta.trend}`}>{delta.text}</small>
      {detail && <em>{detail}</em>}
    </div>
  );
}

function RankingPanel({ title, items, accent = "cyan", kind }) {
  const maxDuration = Math.max(...items.map((item) => numberValue(item.TotalPlaybackDuration)), 1);

  return (
    <section className="user-dashboard-panel">
      <div className="user-dashboard-panel-heading">
        <h2>{title}</h2>
      </div>
      <div className="user-dashboard-ranking-list">
        {items.length === 0 && <div className="user-dashboard-empty">No activity in this range</div>}
        {items.map((item, index) => {
          const width = `${Math.max((numberValue(item.TotalPlaybackDuration) / maxDuration) * 100, 7)}%`;
          const isShow = kind === "show";

          return (
            <Link to={`/libraries/item/${item.ItemId}`} className="user-dashboard-ranking-row" key={`${title}-${item.Title}`}>
              <span className="user-dashboard-rank">{index + 1}</span>
              <Poster
                itemId={item.ItemId}
                title={item.Title}
                className="user-dashboard-rank-poster"
                fallback={isShow ? <TvLineIcon size="52%" /> : <FilmLineIcon size="52%" />}
              />
              <div className="user-dashboard-rank-main">
                <div className="user-dashboard-rank-title">
                  <strong>{item.Title}</strong>
                  <span>{formatDuration(item.TotalPlaybackDuration)}</span>
                </div>
                <div className={`user-dashboard-rank-bar accent-${accent}`} aria-hidden="true">
                  <span style={{ width }} />
                </div>
                <small>
                  {isShow && `${item.EpisodeCount} episodes / `}
                  {item.PlayCount} plays
                </small>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function DevicesPanel({ items }) {
  const totalDuration = items.reduce((sum, item) => sum + numberValue(item.TotalPlaybackDuration), 0);

  return (
    <section className="user-dashboard-panel">
      <div className="user-dashboard-panel-heading">
        <h2>Top clients / devices</h2>
      </div>
      <div className="user-dashboard-device-list">
        {items.length === 0 && <div className="user-dashboard-empty">No client activity in this range</div>}
        {items.map((item, index) => {
          const percentage = totalDuration > 0 ? Math.round((numberValue(item.TotalPlaybackDuration) / totalDuration) * 100) : 0;

          return (
            <div className="user-dashboard-device-row" key={`${item.Client}-${item.DeviceName}`}>
              <span className="user-dashboard-rank">{index + 1}</span>
              <div className="user-dashboard-device-icon">
                <ComputerLineIcon size={18} />
              </div>
              <div className="user-dashboard-device-main">
                <strong>{item.Client}</strong>
                <span>{item.DeviceName}</span>
              </div>
              <div className="user-dashboard-device-stat">
                <strong>{formatDuration(item.TotalPlaybackDuration)}</strong>
                <span>{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecentActivity({ items }) {
  return (
    <section className="user-dashboard-panel user-dashboard-recent-panel">
      <div className="user-dashboard-panel-heading">
        <h2>Recent activity</h2>
      </div>
      <div className="user-dashboard-table">
        <div className="user-dashboard-table-head">
          <span>Item</span>
          <span>Type</span>
          <span>Client</span>
          <span>Watched</span>
          <span>Time</span>
        </div>
        {items.length === 0 && <div className="user-dashboard-empty">No recent activity in this range</div>}
        {items.map((item) => (
          <Link to={`/libraries/item/${item.EpisodeId || item.ItemId}`} className="user-dashboard-table-row" key={item.Id}>
            <div className="user-dashboard-table-item">
              <Poster
                itemId={item.ItemId}
                title={item.Title}
                className="user-dashboard-table-poster"
                fallback={item.Type === "Movie" ? <FilmLineIcon size="54%" /> : <TvLineIcon size="54%" />}
              />
              <strong>{item.Title}</strong>
            </div>
            <span>{item.Type}</span>
            <span>
              {item.Client}
              <small>{item.DeviceName}</small>
            </span>
            <span>{formatDate(item.ActivityDateInserted)}</span>
            <span>{formatDuration(item.PlaybackDuration)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function UserOverviewDashboard({ UserId, user }) {
  const [rangeDays, setRangeDays] = useState(30);
  const [data, setData] = useState();
  const [imageFailed, setImageFailed] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.post(
          "/api/getUserOverviewDashboard",
          { userid: UserId, days: rangeDays },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setData(response.data);
      } catch (error) {
        console.log(error);
        setData({
          summary: {},
          topGenre: null,
          topShows: [],
          topMovies: [],
          topDevices: [],
          recentActivity: [],
        });
      }
    };

    fetchDashboard();
  }, [UserId, rangeDays, token]);

  const summary = data?.summary ?? {};
  const topGenre = data?.topGenre;
  const rangeLabel = useMemo(
    () => RANGE_OPTIONS.find((option) => option.value === rangeDays)?.label ?? "Last 30 days",
    [rangeDays]
  );

  return (
    <div className="user-dashboard">
      <div className="user-dashboard-topbar">
        <div>
          <h1>Overview</h1>
          <span>User overview and statistics</span>
        </div>
        <label className="user-dashboard-range">
          <CalendarLineIcon size={18} />
          <select value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))}>
            {RANGE_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="user-dashboard-hero">
        <div className="user-dashboard-profile">
          <div className="user-dashboard-avatar">
            {imageFailed ? (
              <AccountCircleFillIcon size="100%" />
            ) : (
              <img
                src={`${baseUrl}/proxy/Users/Images/Primary?id=${UserId}&quality=100`}
                onError={() => setImageFailed(true)}
                alt=""
              />
            )}
          </div>
          <div>
            <h2>{user?.Name}</h2>
            <span>{rangeLabel}</span>
            <div className="user-dashboard-profile-meta">
              <span>
                <CalendarLineIcon size={16} />
                User ID
              </span>
              <small>{UserId}</small>
            </div>
          </div>
        </div>

        <div className="user-dashboard-stat-grid">
          <StatCard
            icon={<TimeLineIcon size={25} />}
            label="Watch time"
            value={formatDuration(summary.TotalPlaybackDuration)}
            delta={getDelta(summary.TotalPlaybackDuration, summary.PreviousPlaybackDuration, "watch time")}
          />
          <StatCard
            icon={<TvLineIcon size={25} />}
            label="Episodes"
            value={numberValue(summary.EpisodeCount)}
            delta={getDelta(summary.EpisodeCount, summary.PreviousEpisodeCount, "episodes")}
          />
          <StatCard
            icon={<MovieLineIcon size={25} />}
            label="Movies"
            value={numberValue(summary.MovieCount)}
            delta={getDelta(summary.MovieCount, summary.PreviousMovieCount, "movies")}
          />
          <StatCard
            icon={<PlayCircleLineIcon size={25} />}
            label="Top genre"
            value={topGenre?.Name ?? "No data"}
            detail={topGenre ? `${formatDuration(topGenre.TotalPlaybackDuration)} watched` : ""}
            delta={{ text: `${numberValue(summary.PlayCount)} plays`, trend: "neutral" }}
          />
        </div>
      </section>

      <div className="user-dashboard-panel-grid">
        <RankingPanel title="Top shows" items={data?.topShows ?? []} accent="cyan" kind="show" />
        <RankingPanel title="Top movies" items={data?.topMovies ?? []} accent="gold" kind="movie" />
        <DevicesPanel items={data?.topDevices ?? []} />
      </div>

      <RecentActivity items={data?.recentActivity ?? []} />
    </div>
  );
}
