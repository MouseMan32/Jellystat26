/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "../../../lib/axios_instance";
import ComputerLineIcon from "remixicon-react/ComputerLineIcon";
import SmartphoneLineIcon from "remixicon-react/SmartphoneLineIcon";

import "../../css/users/user-device-stats.css";

function formatDuration(seconds) {
  const totalSeconds = Number(seconds ?? 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function RankingList({ title, items, icon }) {
  const maxPlays = Math.max(...items.map((item) => Number(item.PlayCount ?? 0)), 1);

  return (
    <section className="user-device-ranking">
      <div className="user-device-ranking-heading">
        {icon}
        <h3>{title}</h3>
      </div>
      <div className="user-device-ranking-list">
        {items.map((item, index) => {
          const playCount = Number(item.PlayCount ?? 0);
          const width = `${Math.max((playCount / maxPlays) * 100, 6)}%`;

          return (
            <div className="user-device-ranking-row" key={`${title}-${item.Name}`}>
              <div className="user-device-ranking-meta">
                <span className="user-device-ranking-index">{index + 1}</span>
                <div>
                  <strong>{item.Name}</strong>
                  <span>
                    {playCount} plays / {formatDuration(item.TotalPlaybackDuration)}
                  </span>
                </div>
              </div>
              <div className="user-device-ranking-bar" aria-hidden="true">
                <span style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function UserDeviceStats({ UserId }) {
  const [stats, setStats] = useState();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.post(
          "/api/getUserDeviceStats",
          { userid: UserId, limit: 5 },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setStats(response.data);
      } catch (error) {
        console.log(error);
        setStats({ clients: [], devices: [] });
      }
    };

    fetchStats();
  }, [UserId, token]);

  const clients = stats?.clients ?? [];
  const devices = stats?.devices ?? [];

  if (clients.length === 0 && devices.length === 0) {
    return <></>;
  }

  return (
    <div className="user-device-stats">
      <div className="user-device-stats-heading">
        <h2>Clients & devices</h2>
      </div>
      <div className="user-device-stats-grid">
        {clients.length > 0 && <RankingList title="Top clients" items={clients} icon={<ComputerLineIcon size={20} />} />}
        {devices.length > 0 && <RankingList title="Top devices" items={devices} icon={<SmartphoneLineIcon size={20} />} />}
      </div>
    </div>
  );
}
