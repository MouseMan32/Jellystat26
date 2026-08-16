/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "../../../lib/axios_instance";
import dayjs from "dayjs";

import Timeline from "@mui/lab/Timeline";

import "../../css/timeline/activity-timeline.css";

import Config from "../../../lib/config.jsx";
import Loading from "../../../pages/components/general/loading.jsx";

import ActivityTimelineItem from "./activity-timeline-item.jsx";
import { groupAdjacentSeasons, MEDIA_TYPES } from "./helpers.jsx";
import baseUrl from "../../../lib/baseurl.jsx";
import { Link } from "react-router-dom";
import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";

function getPeriodKey(date, zoom) {
  if (zoom === "year") {
    return dayjs(date).format("YYYY");
  }

  if (zoom === "day") {
    return dayjs(date).format("YYYY-MM-DD");
  }

  return dayjs(date).format("YYYY-MM");
}

function getPeriodLabel(periodKey, zoom) {
  if (zoom === "year") {
    return periodKey;
  }

  if (zoom === "day") {
    return dayjs(periodKey).format("MMM D, YYYY");
  }

  return dayjs(`${periodKey}-01`).format("MMMM YYYY");
}

function formatDuration(seconds) {
  const totalSeconds = Number(seconds ?? 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function summarizeGroups(groups) {
  return groups.reduce(
    (summary, group) => ({
      periods: summary.periods + 1,
      titles: summary.titles + group.itemCount,
      episodes: summary.episodes + group.episodeCount,
      duration: summary.duration + group.totalDuration,
    }),
    { periods: 0, titles: 0, episodes: 0, duration: 0 }
  );
}

function buildTimelineGroups(entries, zoom) {
  const periodMap = new Map();

  entries.forEach((entry) => {
    const periodKey = getPeriodKey(entry.LastActivityDate ?? entry.FirstActivityDate, zoom);
    const itemKey = `${entry.MediaType}-${entry.Title}`;

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        key: periodKey,
        label: getPeriodLabel(periodKey, zoom),
        entries: new Map(),
        episodeCount: 0,
        itemCount: 0,
        totalDuration: 0,
      });
    }

    const period = periodMap.get(periodKey);
    const existing = period.entries.get(itemKey);
    const episodeCount = Number(entry.EpisodeCount ?? 0);
    const totalDuration = Number(entry.TotalPlaybackDuration ?? 0);

    if (existing) {
      existing.EpisodeCount += episodeCount;
      existing.TotalPlaybackDuration += totalDuration;
      existing.PlayCount += 1;
      if (dayjs(entry.LastActivityDate).isAfter(existing.LastActivityDate)) {
        existing.LastActivityDate = entry.LastActivityDate;
        existing.NowPlayingItemId = entry.NowPlayingItemId;
      }
    } else {
      period.entries.set(itemKey, {
        ...entry,
        EpisodeCount: episodeCount,
        TotalPlaybackDuration: totalDuration,
        PlayCount: 1,
      });
      period.itemCount += 1;
    }

    period.episodeCount += episodeCount;
    period.totalDuration += totalDuration;
  });

  return Array.from(periodMap.values())
    .map((period) => ({
      ...period,
      entries: Array.from(period.entries.values()).sort((a, b) => new Date(b.LastActivityDate) - new Date(a.LastActivityDate)),
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

function GroupedPosterFallback({ mediaType }) {
  return (
    <div className="timeline-grouped-poster timeline-grouped-poster-fallback">
      {mediaType === MEDIA_TYPES.Shows ? <TvLineIcon size="46%" /> : <FilmLineIcon size="46%" />}
    </div>
  );
}

function GroupedTimelineCard({ entry, maxDuration }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isShow = entry.MediaType === MEDIA_TYPES.Shows;
  const duration = Number(entry.TotalPlaybackDuration ?? 0);
  const width = `${Math.max((duration / Math.max(maxDuration, 1)) * 100, 8)}%`;

  return (
    <Link to={`/libraries/item/${entry.NowPlayingItemId}`} className="timeline-grouped-card">
      {!imageFailed ? (
        <img
          className="timeline-grouped-poster"
          src={`${baseUrl}/proxy/Items/Images/Primary?id=${entry.NowPlayingItemId}&fillWidth=360&quality=70`}
          onError={() => setImageFailed(true)}
          alt=""
        />
      ) : (
        <GroupedPosterFallback mediaType={entry.MediaType} />
      )}
      <div className="timeline-grouped-card-body">
        <span className="timeline-grouped-card-type">{isShow ? "TV show" : "Movie"}</span>
        <strong>{entry.Title}</strong>
        {entry.SeasonName && <span>{entry.SeasonName}</span>}
        <div className="timeline-grouped-card-stats">
          {isShow && entry.EpisodeCount > 0 && <span>{entry.EpisodeCount} episodes</span>}
          <span>{entry.PlayCount} sessions</span>
          <span>{formatDuration(entry.TotalPlaybackDuration)}</span>
        </div>
        <div className="timeline-grouped-density" aria-hidden="true">
          <span style={{ width }} />
        </div>
      </div>
    </Link>
  );
}

function GroupedTimeline({ entries, zoom }) {
  const groups = buildTimelineGroups(entries, zoom);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const summary = summarizeGroups(groups);

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  return (
    <div className="timeline-grouped">
      <div className="timeline-grouped-summary">
        <div>
          <span>Periods</span>
          <strong>{summary.periods}</strong>
        </div>
        <div>
          <span>Titles</span>
          <strong>{summary.titles}</strong>
        </div>
        {summary.episodes > 0 && (
          <div>
            <span>Episodes</span>
            <strong>{summary.episodes}</strong>
          </div>
        )}
        <div>
          <span>Watch time</span>
          <strong>{formatDuration(summary.duration)}</strong>
        </div>
      </div>
      {groups.map((group) => (
        <section className="timeline-group" key={group.key}>
          <div className="timeline-group-header">
            <div>
              <span className="timeline-group-kicker">{zoom} view</span>
              <h2>{group.label}</h2>
            </div>
            <div className="timeline-group-actions">
              <div className="timeline-group-metrics">
                <span>{group.itemCount} titles</span>
                {group.episodeCount > 0 && <span>{group.episodeCount} episodes</span>}
                <span>{formatDuration(group.totalDuration)}</span>
              </div>
              <button className="timeline-group-toggle" type="button" onClick={() => toggleGroup(group.key)}>
                {collapsedGroups[group.key] ? "Expand" : "Collapse"}
              </button>
            </div>
          </div>
          {!collapsedGroups[group.key] && (
            <div className="timeline-group-grid">
              {group.entries.map((entry) => (
                <GroupedTimelineCard
                  key={`${group.key}-${entry.MediaType}-${entry.Title}`}
                  entry={entry}
                  maxDuration={group.totalDuration}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

export default function ActivityTimelineComponent(props) {
  const { userId, libraries, view = "grouped", zoom = "month" } = props;

  const [timelineEntries, setTimelineEntries] = useState();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          console.log(error);
        }
      }
    };

    const fetchLibraries = () => {
      if (config) {
        const url = `/api/getActivityTimeLine`;
        axios
          .post(
            url,
            { userId: userId, libraries: libraries },
            {
              headers: {
                Authorization: `Bearer ${config.token}`,
                "Content-Type": "application/json",
              },
            }
          )
          .then((timelineEntries) => {
            const groupedAdjacentSeasons = groupAdjacentSeasons([
              ...timelineEntries.data,
            ]);
            setTimelineEntries(groupedAdjacentSeasons);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };

    if (!config) {
      fetchConfig();
    }

    fetchLibraries();
  }, [userId, libraries, config]);

  return timelineEntries?.length > 0 ? (
    <div>
      {view === "grouped" ? (
        <GroupedTimeline entries={timelineEntries} zoom={zoom} />
      ) : (
        <Timeline position="alternate">
          {timelineEntries.map((entry) => (
            <ActivityTimelineItem
              key={`${entry.Title}-${entry.FirstActivityDate}-${entry.LastActivityDate}`}
              {...entry}
            />
          ))}
        </Timeline>
      )}
    </div>
  ) : (
    <Loading />
  );
}
