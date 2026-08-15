/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import Chart from "./chart";
import "../../css/stats.css";
import { Trans } from "react-i18next";

function PlayStatsByHour(props) {
  const [stats, setStats] = useState();
  const [libraries, setLibraries] = useState();
  const [days, setDays] = useState(20);
  const viewName = props.viewName;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLibraries = () => {
      const params = new URLSearchParams({ days: props.days });
      if (props.startDate && props.endDate) {
        params.set("startDate", props.startDate);
        params.set("endDate", props.endDate);
      }
      const url = `/stats/getViewsByHour?${params.toString()}`;

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

    setDays(props.days);
    fetchLibraries();
    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [props.days, props.startDate, props.endDate, token]);

  if (!stats || !libraries) {
    return <></>;
  }

  const titleKey = viewName === "count" ? "STAT_PAGE.PLAY_COUNT_BY" : "STAT_PAGE.PLAY_DURATION_BY";
  if (stats.length === 0) {
    return (
      <div className="statistics-widget small">
        <h1><Trans i18nKey={titleKey}/> <Trans i18nKey={"UNITS.HOUR"}/>  - <Trans i18nKey={"LAST"}/> {days} <Trans i18nKey={`UNITS.DAY${days>1 ? 'S':''}`}/></h1>

        <h5><Trans i18nKey={"ERROR_MESSAGES.NO_STATS"}/></h5>
      </div>
    );
  }

  return (
    <div className="statistics-widget">
      <h2 className="text-start my-2"><Trans i18nKey={titleKey}/> <Trans i18nKey={"UNITS.HOUR"}/> - <Trans i18nKey={"LAST"}/> {days} <Trans i18nKey={`UNITS.DAY${days>1 ? 'S':''}`}/></h2>
      <div className="graph small">
      <Chart libraries={libraries} stats={stats} viewName={viewName} chartType={props.chartType}/>
      </div>
    </div>
  );
}

export default PlayStatsByHour;
