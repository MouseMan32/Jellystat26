/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "../../../lib/axios_instance";
import baseUrl from "../../../lib/baseurl";
import { Link } from "react-router-dom";
import FilmLineIcon from "remixicon-react/FilmLineIcon";
import TvLineIcon from "remixicon-react/TvLineIcon";

import "../../css/users/user-favorites.css";

function formatDuration(seconds) {
  const totalSeconds = Number(seconds ?? 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function FavoriteFallback({ mediaType }) {
  return (
    <div className="favorite-poster favorite-poster-fallback">
      {mediaType === "tvshows" ? <TvLineIcon size="42%" /> : <FilmLineIcon size="42%" />}
    </div>
  );
}

function FavoriteCard({ item, rank, maxValue }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isShow = item.MediaType === "tvshows";
  const score = Number(isShow ? item.EpisodeCount : item.PlayCount) || 0;
  const width = `${Math.max((score / Math.max(maxValue, 1)) * 100, 8)}%`;

  return (
    <Link to={`/libraries/item/${item.ItemId}`} className="favorite-card">
      {!imageFailed && item.ItemId ? (
        <img
          className="favorite-poster"
          src={`${baseUrl}/proxy/Items/Images/Primary?id=${item.ItemId}&fillWidth=360&quality=70`}
          onError={() => setImageFailed(true)}
          alt=""
        />
      ) : (
        <FavoriteFallback mediaType={item.MediaType} />
      )}
      <div className="favorite-card-body">
        <span className="favorite-rank">#{rank} {isShow ? "show" : "movie"}</span>
        <strong>{item.Title}</strong>
        <div className="favorite-card-stats">
          {isShow && <span>{item.EpisodeCount} episodes</span>}
          <span>{item.PlayCount} plays</span>
          <span>{formatDuration(item.TotalPlaybackDuration)}</span>
        </div>
        <div className="favorite-score-bar" aria-hidden="true">
          <span style={{ width }} />
        </div>
      </div>
    </Link>
  );
}

export default function UserFavorites({ UserId }) {
  const [favorites, setFavorites] = useState();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.post(
          "/api/getUserFavorites",
          { userid: UserId, limit: 6 },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setFavorites(response.data);
      } catch (error) {
        console.log(error);
        setFavorites([]);
      }
    };

    fetchFavorites();
  }, [UserId, token]);

  if (!favorites || favorites.length === 0) {
    return <></>;
  }

  const shows = favorites.filter((item) => item.MediaType === "tvshows");
  const movies = favorites.filter((item) => item.MediaType === "movies");
  const maxShowEpisodes = Math.max(...shows.map((item) => Number(item.EpisodeCount ?? 0)), 1);
  const maxMoviePlays = Math.max(...movies.map((item) => Number(item.PlayCount ?? 0)), 1);

  return (
    <div className="user-favorites">
      <div className="user-favorites-heading">
        <h2>Favorites</h2>
      </div>
      {shows.length > 0 && (
        <section>
          <h3>TV Shows</h3>
          <div className="favorite-grid">
            {shows.map((item, index) => (
              <FavoriteCard key={`show-${item.Title}`} item={item} rank={index + 1} maxValue={maxShowEpisodes} />
            ))}
          </div>
        </section>
      )}
      {movies.length > 0 && (
        <section>
          <h3>Movies</h3>
          <div className="favorite-grid">
            {movies.map((item, index) => (
              <FavoriteCard key={`movie-${item.Title}`} item={item} rank={index + 1} maxValue={maxMoviePlays} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
