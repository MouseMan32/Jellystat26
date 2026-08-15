/* eslint-disable react/prop-types */
import { Tabs, Tab, Button, FormSelect, Modal } from "react-bootstrap";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import "./css/stats.css";

import DailyPlayStats from "./components/statistics/daily-play-count";
import PlayStatsByDay from "./components/statistics/play-stats-by-day";
import PlayStatsByHour from "./components/statistics/play-stats-by-hour";
import { Trans } from "react-i18next";
import axios from "../lib/axios_instance.jsx";
import Loading from "./components/general/loading.jsx";
import { Link } from "react-router-dom";

function formatDuration(seconds) {
  const totalSeconds = Number(seconds ?? 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatActivityTime(date) {
  return Intl.DateTimeFormat(localStorage.getItem("i18nextLng"), {
    hour: "numeric",
    minute: "2-digit",
    hour12: JSON.parse(localStorage.getItem("12hr")),
  }).format(new Date(date));
}

function getActivityTitle(row) {
  if (!row?.SeriesName) {
    return row?.NowPlayingItemName ?? "-";
  }

  if (row.SeasonNumber != null && row.EpisodeNumber != null) {
    return `${row.SeriesName} : S${row.SeasonNumber}E${row.EpisodeNumber} - ${row.NowPlayingItemName}`;
  }

  return `${row.SeriesName} - ${row.NowPlayingItemName}`;
}

function getPlayMethod(row) {
  if (row?.PlayMethod === "DirectPlay") {
    return "Direct";
  }

  if (row?.PlayMethod === "DirectStream") {
    return "Direct Stream";
  }

  return row?.PlayMethod ?? "-";
}

function SelectedDateActivityModal({ dateKey, onHide }) {
  const [data, setData] = useState();
  const [itemCount, setItemCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(false);
  const token = localStorage.getItem("token");

  const selectedDate = useMemo(() => dayjs(dateKey), [dateKey]);
  const dateFilters = useMemo(
    () => [
      {
        field: "ActivityDateInserted",
        min: selectedDate.startOf("day").toISOString(),
        max: selectedDate.endOf("day").toISOString(),
      },
    ],
    [selectedDate]
  );

  useEffect(() => {
    setCurrentPage(1);
    setData(undefined);
  }, [dateKey]);

  useEffect(() => {
    const fetchActivity = () => {
      setIsBusy(true);
      axios
        .get("/stats/getPlaybackActivity", {
          params: {
            size: itemCount,
            page: currentPage,
            sort: "ActivityDateInserted",
            desc: true,
            filters: JSON.stringify(dateFilters),
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          setData(response.data);
          setIsBusy(false);
        })
        .catch((error) => {
          console.log(error);
          setData({ results: [], pages: 1 });
          setIsBusy(false);
        });
    };

    if (dateKey) {
      fetchActivity();
    }
  }, [dateKey, itemCount, currentPage, token, dateFilters]);

  return (
    <Modal show={!!dateKey} onHide={onHide} size="xl" dialogClassName="stats-drilldown-modal">
      <Modal.Header closeButton>
        <Modal.Title>Watched on {selectedDate.format("MMM D, YYYY")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="stats-drilldown-toolbar">
          <div>
            <span>Results</span>
            <strong>{data?.results?.length ?? 0}</strong>
          </div>
          <div className="stats-control">
            <label htmlFor="stats-drilldown-items">Rows</label>
            <FormSelect id="stats-drilldown-items" value={itemCount} onChange={(event) => setItemCount(Number(event.target.value))}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </FormSelect>
          </div>
        </div>
        {data ? (
          <div className="stats-drilldown-list">
            <div className="stats-drilldown-list-header">
              <span>Time</span>
              <span>User</span>
              <span>Title</span>
              <span>Client</span>
              <span>Method</span>
              <span>Duration</span>
            </div>
            {(data.results ?? []).map((row) => (
              <div className="stats-drilldown-row" key={row.Id}>
                <span>{formatActivityTime(row.ActivityDateInserted)}</span>
                <span>{row.UserName}</span>
                <Link to={`/libraries/item/${row.EpisodeId || row.NowPlayingItemId}`} className="stats-drilldown-title">
                  {getActivityTitle(row)}
                </Link>
                <span>{row.Client ?? "-"}</span>
                <span>{getPlayMethod(row)}</span>
                <span>{formatDuration(row.PlaybackDuration)}</span>
              </div>
            ))}
            {(data.results ?? []).length === 0 && <div className="stats-drilldown-empty">No activity found for this date.</div>}
            <div className="stats-drilldown-pages">
              <Button variant="outline-secondary" disabled={currentPage <= 1 || isBusy} onClick={() => setCurrentPage(currentPage - 1)}>
                Previous
              </Button>
              <span>
                Page {currentPage} of {data.pages ?? 1}
              </span>
              <Button
                variant="outline-secondary"
                disabled={currentPage >= (data.pages ?? 1) || isBusy}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <Loading />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-primary" onClick={onHide}>
          <Trans i18nKey="CLOSE" />
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function Statistics() {
  const initialDays =
    localStorage.getItem("PREF_STATISTICS_STAT_DAYS_INPUT") != undefined
      ? Number(localStorage.getItem("PREF_STATISTICS_STAT_DAYS_INPUT"))
      : Number(localStorage.getItem("PREF_STATISTICS_STAT_DAYS") ?? 20);
  const [days, setDays] = useState(initialDays);
  const [input, setInput] = useState(localStorage.getItem("PREF_STATISTICS_STAT_DAYS_INPUT") ?? 20);
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [startDate, setStartDate] = useState(dayjs().subtract(initialDays - 1, "day").format("YYYY-MM-DD"));

  const handleOnChange = (event) => {
    setInput(event.target.value);
    localStorage.setItem("PREF_STATISTICS_STAT_DAYS_INPUT", event.target.value);
  };

  const handleDateRangeChange = (field, value) => {
    const nextStartDate = field === "start" ? value : startDate;
    const nextEndDate = field === "end" ? value : endDate;

    if (field === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }

    if (dayjs(nextStartDate).isValid() && dayjs(nextEndDate).isValid() && !dayjs(nextStartDate).isAfter(dayjs(nextEndDate), "day")) {
      const nextDays = dayjs(nextEndDate).diff(dayjs(nextStartDate), "day") + 1;
      setDays(nextDays);
      setInput(nextDays);
      localStorage.setItem("PREF_STATISTICS_STAT_DAYS", nextDays);
      localStorage.setItem("PREF_STATISTICS_STAT_DAYS_INPUT", nextDays);
    }
  };

  const [activeTab, setActiveTab] = useState(localStorage.getItem(`PREF_STATISTICS_LAST_SELECTED_TAB`) ?? "tabCount");
  const [chartType, setChartTypeState] = useState(localStorage.getItem("PREF_STATISTICS_CHART_TYPE") ?? "area");
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  function setTab(tabName) {
    setActiveTab(tabName);
    localStorage.setItem(`PREF_STATISTICS_LAST_SELECTED_TAB`, tabName);
  }

  function setChartType(type) {
    setChartTypeState(type);
    localStorage.setItem("PREF_STATISTICS_CHART_TYPE", type);
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      if (input < 1) {
        setInput(1);
        setDays(0);
        localStorage.setItem("PREF_STATISTICS_STAT_DAYS", 0);
        localStorage.setItem("PREF_STATISTICS_STAT_DAYS_INPUT", 1);
      } else {
        const nextDays = parseInt(input);
        setDays(nextDays);
        setEndDate(dayjs().format("YYYY-MM-DD"));
        setStartDate(dayjs().subtract(nextDays - 1, "day").format("YYYY-MM-DD"));
        localStorage.setItem("PREF_STATISTICS_STAT_DAYS", nextDays);
        localStorage.setItem("PREF_STATISTICS_STAT_DAYS_INPUT", input);
      }

      console.log(days);
    }
  };

  return (
    <div className="watch-stats">
      {selectedDateKey && <SelectedDateActivityModal dateKey={selectedDateKey} onHide={() => setSelectedDateKey(null)} />}
      <div className="Heading">
        <h1>
          <Trans i18nKey={"STAT_PAGE.STATISTICS"} />
        </h1>
        <div className="stats-toolbar">
          <div className="stats-tab-nav">
            <Tabs
              defaultActiveKey={activeTab}
              activeKey={activeTab}
              onSelect={setTab}
              variant="pills"
            >
              <Tab
                eventKey="tabCount"
                className="bg-transparent"
                title={<Trans i18nKey="STAT_PAGE.COUNT_VIEW" />} 
              />
            
              <Tab
                eventKey="tabDuration"
                className="bg-transparent"
                title={<Trans i18nKey="STAT_PAGE.DURATION_VIEW" />}
              />
            </Tabs>
          </div>
          <div className="stats-control">
            <label htmlFor="stats-chart-type">Chart</label>
            <FormSelect id="stats-chart-type" value={chartType} onChange={(event) => setChartType(event.target.value)}>
              <option value="area">Area</option>
              <option value="bar">Bar</option>
              <option value="stackedBar">Stacked bar</option>
            </FormSelect>
          </div>
          <div className="stats-date-control">
            <label htmlFor="stats-start-date">Start</label>
            <input id="stats-start-date" type="date" value={startDate} onChange={(event) => handleDateRangeChange("start", event.target.value)} />
          </div>
          <div className="stats-date-control">
            <label htmlFor="stats-end-date">End</label>
            <input id="stats-end-date" type="date" value={endDate} onChange={(event) => handleDateRangeChange("end", event.target.value)} />
          </div>
          <div className="date-range">
            <div className="header">
              <Trans i18nKey={"LAST"} />
            </div>
            <div className="days">
              <input type="number" min={1} value={input} onChange={handleOnChange} onKeyDown={handleKeyDown} />
            </div>
            <div className="trailer">
              <Trans i18nKey={`UNITS.DAY${days > 1 ? "S" : ""}`} />
            </div>
          </div>
        </div>
      </div>

      {activeTab === "tabCount" && (
        <div>
          <DailyPlayStats days={days} startDate={startDate} endDate={endDate} viewName="count" chartType={chartType} onDateSelect={setSelectedDateKey} />
          <div className="statistics-graphs">
            <PlayStatsByDay days={days} startDate={startDate} endDate={endDate} viewName="count" chartType={chartType} />
            <PlayStatsByHour days={days} startDate={startDate} endDate={endDate} viewName="count" chartType={chartType} />
          </div>
        </div>
      )}

      {activeTab === "tabDuration" && (
        <div>
          <DailyPlayStats days={days} startDate={startDate} endDate={endDate} viewName="duration" chartType={chartType} onDateSelect={setSelectedDateKey} />
          <div className="statistics-graphs">
            <PlayStatsByDay days={days} startDate={startDate} endDate={endDate} viewName="duration" chartType={chartType} />
            <PlayStatsByHour days={days} startDate={startDate} endDate={endDate} viewName="duration" chartType={chartType} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Statistics;
