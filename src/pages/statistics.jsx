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
import ActivityTable from "./components/activity/activity-table.jsx";
import Loading from "./components/general/loading.jsx";

function SelectedDateActivityModal({ dateKey, onHide }) {
  const [data, setData] = useState();
  const [itemCount, setItemCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState({ column: "ActivityDateInserted", desc: true });
  const [tableFilters, setTableFilters] = useState([]);
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
    setTableFilters([]);
  }, [dateKey]);

  useEffect(() => {
    const fetchActivity = () => {
      setIsBusy(true);
      axios
        .get("/api/getHistory", {
          params: {
            size: itemCount,
            page: currentPage,
            sort: sorting.column,
            desc: sorting.desc,
            filters: JSON.stringify([...dateFilters, ...tableFilters]),
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
  }, [dateKey, itemCount, currentPage, sorting, tableFilters, token, dateFilters]);

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
          <ActivityTable
            data={data.results ?? []}
            itemCount={itemCount}
            onPageChange={setCurrentPage}
            onSortChange={(sort) => setSorting({ column: sort.column, desc: sort.desc })}
            onFilterChange={setTableFilters}
            pageCount={data.pages ?? 1}
            isBusy={isBusy}
          />
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
  const [days, setDays] = useState(
    localStorage.getItem("PREF_STATISTICS_STAT_DAYS_INPUT") != undefined
      ? localStorage.getItem("PREF_STATISTICS_STAT_DAYS_INPUT")
      : localStorage.getItem("PREF_STATISTICS_STAT_DAYS") ?? 20
  );
  const [input, setInput] = useState(localStorage.getItem("PREF_STATISTICS_STAT_DAYS_INPUT") ?? 20);

  const handleOnChange = (event) => {
    setInput(event.target.value);
    localStorage.setItem("PREF_STATISTICS_STAT_DAYS_INPUT", event.target.value);
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
        setDays(parseInt(input));
        localStorage.setItem("PREF_STATISTICS_STAT_DAYS", parseInt(input));
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
          <DailyPlayStats days={days} viewName="count" chartType={chartType} onDateSelect={setSelectedDateKey} />
          <div className="statistics-graphs">
            <PlayStatsByDay days={days} viewName="count" chartType={chartType} />
            <PlayStatsByHour days={days} viewName="count" chartType={chartType} />
          </div>
        </div>
      )}

      {activeTab === "tabDuration" && (
        <div>
          <DailyPlayStats days={days} viewName="duration" chartType={chartType} onDateSelect={setSelectedDateKey} />
          <div className="statistics-graphs">
            <PlayStatsByDay days={days} viewName="duration" chartType={chartType} />
            <PlayStatsByHour days={days} viewName="duration" chartType={chartType} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Statistics;
