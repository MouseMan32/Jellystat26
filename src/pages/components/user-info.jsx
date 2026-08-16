import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "../../lib/axios_instance";
import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";
import Config from "../../lib/config";
import { Tabs, Tab, Button, ButtonGroup } from "react-bootstrap";

import LastPlayed from "./user-info/lastplayed";
import UserActivity from "./user-info/user-activity";
import "../css/users/user-details.css";
import { Trans } from "react-i18next";
import baseUrl from "../../lib/baseurl";
import GlobalStats from "./general/globalStats";
import ActivityTimeline from "../activity_time_line";
import GenreUserStats from "./user-info/genre-user-stats.jsx";
import UserFavorites from "./user-info/user-favorites.jsx";
import UserDeviceStats from "./user-info/user-device-stats.jsx";

function UserInfo() {
  const { UserId } = useParams();
  const [data, setData] = useState();
  const [imgError, setImgError] = useState(false);
  const [config, setConfig] = useState();
  const [activeTab, setActiveTab] = useState("tabOverview");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchData = async () => {
      if (config) {
        try {
          const userData = await axios.post(
            `/api/getUserDetails`,
            {
              userid: UserId,
            },
            {
              headers: {
                Authorization: `Bearer ${config.token}`,
                "Content-Type": "application/json",
              },
            }
          );
          setData(userData.data);
        } catch (error) {
          console.log(error);
        }
      }
    };
    fetchData();

    if (!config) {
      fetchConfig();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [config, UserId]);

  const handleImageError = () => {
    setImgError(true);
  };

  if (!data || !config) {
    return <></>;
  }

  return (
    <div className="user-modern-page">
      <div className="user-detail-container">
        <div className="user-profile-cluster">
          <div className="user-image-container">
            {imgError ? (
              <AccountCircleFillIcon size={"100%"} />
            ) : (
              <img
                className="user-image"
                src={baseUrl + "/proxy/Users/Images/Primary?id=" + UserId + "&quality=100"}
                onError={handleImageError}
                alt=""
              ></img>
            )}
          </div>

          <div className="user-title-block">
            <span className="user-page-label">User overview</span>
            <p className="user-name">{data.Name}</p>
            <span className="user-id-chip">{UserId}</span>
          </div>
        </div>

        <ButtonGroup className="user-tab-controls">
          <Button
            onClick={() => setActiveTab("tabOverview")}
            active={activeTab === "tabOverview"}
            variant="outline-primary"
            type="button"
          >
            <Trans i18nKey="TAB_CONTROLS.OVERVIEW" />
          </Button>
          <Button
            onClick={() => setActiveTab("tabActivity")}
            active={activeTab === "tabActivity"}
            variant="outline-primary"
            type="button"
          >
            <Trans i18nKey="TAB_CONTROLS.ACTIVITY" />
          </Button>
          <Button
            onClick={() => setActiveTab("tabTimeline")}
            active={activeTab === "tabTimeline"}
            variant="outline-primary"
            type="button"
          >
            <Trans i18nKey="TAB_CONTROLS.TIMELINE" />
          </Button>
        </ButtonGroup>
      </div>

      <Tabs defaultActiveKey="tabOverview" activeKey={activeTab} variant="pills">
        <Tab eventKey="tabOverview" className="bg-transparent">
          <div className="user-overview-dashboard">
            <section className="user-overview-section user-overview-section-wide user-overview-stats">
              <GlobalStats
                id={UserId}
                param={"userid"}
                endpoint={"getGlobalUserStats"}
                title={<Trans i18nKey="USERS_PAGE.USER_STATS" />}
              />
            </section>
            <div className="user-overview-grid">
              <section className="user-overview-section">
                <UserFavorites UserId={UserId} />
              </section>
              <section className="user-overview-section">
                <UserDeviceStats UserId={UserId} />
              </section>
              <section className="user-overview-section user-overview-section-wide">
                <GenreUserStats UserId={UserId} />
              </section>
              <section className="user-overview-section user-overview-section-wide">
                <LastPlayed UserId={UserId} />
              </section>
            </div>
          </div>
        </Tab>
        <Tab eventKey="tabActivity" className="bg-transparent">
          <UserActivity UserId={UserId} />
        </Tab>
        <Tab eventKey="tabTimeline" className="bg-transparent">
          <ActivityTimeline preselectedUser={UserId} />
        </Tab>
      </Tabs>
    </div>
  );
}
export default UserInfo;
