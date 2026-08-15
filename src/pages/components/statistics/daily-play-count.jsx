/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import Chart from "./chart";

import "../../css/stats.css";
import { Trans } from "react-i18next";

function formatMinutes(minutes) {
  if (!minutes) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function getSummaryCards(stats, libraries) {
  const summary = stats.reduce(
    (accumulator, day) => {
      libraries.forEach((library) => {
        const libraryStats = day[library.Name] ?? {};
        const count = Number(libraryStats.count ?? 0);
        const duration = Number(libraryStats.duration ?? 0);

        accumulator.totalViews += count;
        accumulator.totalDuration += duration;
        accumulator.byLibrary[library.Name] = (accumulator.byLibrary[library.Name] ?? 0) + count;
      });

      return accumulator;
    },
    { totalViews: 0, totalDuration: 0, byLibrary: {} }
  );

  const topLibrary = Object.entries(summary.byLibrary).sort((a, b) => b[1] - a[1])[0];
  const activeDays = stats.filter((day) =>
    libraries.some((library) => Number(day[library.Name]?.count ?? 0) > 0 || Number(day[library.Name]?.duration ?? 0) > 0)
  ).length;

  return [
    { label: "Total plays", value: summary.totalViews.toLocaleString() },
    { label: "Watch time", value: formatMinutes(summary.totalDuration) },
    { label: "Active days", value: activeDays.toLocaleString() },
    { label: "Top library", value: topLibrary?.[0] ?? "-" },
  ];
}

function DailyPlayStats(props) {

  const [stats, setStats] = useState();
  const [libraries, setLibraries] = useState();
  const [days, setDays] = useState(20);
  const viewName = props.viewName;
  const token = localStorage.getItem("token");
  


  
  useEffect(() => {
    const fetchLibraries = () => {
      const url = `/stats/getViewsOverTime?days=${props.days}`;

      axios
        .get(
          url,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        .then((data) => {
          setStats(data.data.stats);
          setLibraries(data.data.libraries);
        })
        .catch((error) => {
          console.log(error);
        });
    };

    if (!stats) {
      fetchLibraries();
    }
    if (days !== props.days) {
      setDays(props.days);
      fetchLibraries();
    }
    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [stats, days, props.days, token]);

  if (!stats) {
    return <></>;
  }

  const titleKey = viewName === "count" ? "STAT_PAGE.DAILY_PLAY_PER_LIBRARY" : "STAT_PAGE.DAILY_DURATION_PER_LIBRARY";

  if (stats.length === 0) {
    return (
      <div className="main-widget">
        <h1><Trans i18nKey={titleKey}/> - {days} <Trans i18nKey={`UNITS.DAY${days>1 ? 'S':''}`}/></h1>

        <h5><Trans i18nKey={"ERROR_MESSAGES.NO_STATS"}/></h5>
      </div>
    );
  }
  const summaryCards = getSummaryCards(stats, libraries ?? []);

  return (
    <div className="main-widget">
      <div className="stats-section-heading">
        <h2 className="text-start my-2"><Trans i18nKey={titleKey}/> - <Trans i18nKey={"LAST"}/> {days} <Trans i18nKey={`UNITS.DAY${days>1 ? 'S':''}`}/></h2>
        {props.onDateSelect && <span>Click a date to inspect watch activity</span>}
      </div>

      <div className="stats-summary-grid">
        {summaryCards.map((card) => (
          <div className="stats-summary-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="graph">
         <Chart
          libraries={libraries}
          stats={stats}
          viewName={viewName}
          chartType={props.chartType}
          onKeySelect={props.onDateSelect}
        />
      </div>
    </div>
  );
}

export default DailyPlayStats;
