document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const form = $("movieForm");
  const input = $("movieName");
  const details = $("movieDetails");
  const spinner = $("spinner");
  const yearSpan = $("year");
  const searchHistoryEl = $("searchHistory");
  const clearHistoryBtn = $("clearHistoryBtn");
  const clearBtn = $("clearBtn");
  const toggleThemeCheckbox = $("toggleTheme");
  const API_KEY = "fde7a48f";

  yearSpan.textContent = new Date().getFullYear();

  // ---------- THEME MANAGEMENT ----------
  const applyTheme = (theme) => {
    document.body.classList.toggle("light", theme === "light");
    toggleThemeCheckbox.checked = theme === "light";
    localStorage.setItem("theme", theme);
  };

  const loadTheme = () => applyTheme(localStorage.getItem("theme") || "dark");

  toggleThemeCheckbox.addEventListener("change", () =>
    applyTheme(toggleThemeCheckbox.checked ? "light" : "dark")
  );

  // ---------- SEARCH HISTORY ----------
  const getHistory = () => {
    try {
      return JSON.parse(localStorage.getItem("movieSearchHistory")) || [];
    } catch {
      return [];
    }
  };

  const saveHistory = (history) =>
    localStorage.setItem("movieSearchHistory", JSON.stringify(history));

  const addToHistory = (title) => {
    let history = getHistory().filter(
      (item) => item.toLowerCase() !== title.toLowerCase()
    );
    history.unshift(title);
    if (history.length > 10) history.pop();
    saveHistory(history);
    renderHistory();
  };

  const clearHistory = () => {
    localStorage.removeItem("movieSearchHistory");
    renderHistory();
  };

  // ---------- UTILITIES ----------
  const createEl = (tag, props = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) =>
      k.startsWith("on")
        ? el.addEventListener(k.slice(2).toLowerCase(), v)
        : (el[k] = v)
    );
    children.forEach((child) => el.appendChild(child));
    return el;
  };

  const createHistoryItem = (movie) => {
    const triggerSearch = () => {
      input.value = movie;
      fetchMovie(movie);
    };

    const li = createEl("li", {
      textContent: movie,
      tabIndex: 0,
      role: "button",
      title: `Search "${movie}" again`,
      onclick: triggerSearch,
      onkeypress: (e) => {
        if (["Enter", " "].includes(e.key)) {
          e.preventDefault();
          triggerSearch();
        }
      },
    });

    return li;
  };

  const renderHistory = () => {
    searchHistoryEl.innerHTML = "";
    const history = getHistory();

    if (!history.length) {
      searchHistoryEl.appendChild(
        createEl("li", {
          textContent: "No search history yet.",
          style: "font-style: italic;",
          tabIndex: -1,
        })
      );
      return;
    }

    history.forEach((movie) =>
      searchHistoryEl.appendChild(createHistoryItem(movie))
    );
  };

  // ---------- SPINNER ----------
  const showSpinner = () => spinner.classList.remove("hidden");
  const hideSpinner = () => spinner.classList.add("hidden");

  // ---------- CLEAR ----------
  const clearDetailsAndInput = () => {
    details.innerHTML = "";
    input.value = "";
    input.focus();
  };

  // ---------- FETCH MOVIE ----------
  const fetchMovie = async (movie) => {
    if (!movie) return;
    details.innerHTML = "";
    showSpinner();

    try {
      const res = await fetch(
        `https://www.omdbapi.com/?t=${encodeURIComponent(
          movie
        )}&apikey=${API_KEY}&plot=full`
      );
      const data = await res.json();
      hideSpinner();

      if (data.Response === "False") {
        details.innerHTML = `<p>Movie not found. Please try again.</p>`;
        return;
      }

      addToHistory(data.Title);

      details.innerHTML = `
        <div class="movie-card">
          ${
            data.Poster && data.Poster !== "N/A"
              ? `<img class="poster" src="${data.Poster}" alt="Poster of ${data.Title}" />`
              : ""
          }
          <div class="info">
            <h2>${data.Title} (${data.Year})</h2>
            ${[
              "Rated",
              "Released",
              "Runtime",
              "Genre",
              "Director",
              "Writer",
              "Actors",
              "Language",
              "Country",
              "Awards",
              "imdbRating",
            ]
              .map((key) => {
                const label =
                  key === "imdbRating"
                    ? `<strong>IMDB Rating:</strong> ${data[key]} (${data.imdbVotes} votes)`
                    : `<strong>${key}:</strong> ${data[key]}`;
                return `<p>${label}</p>`;
              })
              .join("")}
            <p><strong>Plot:</strong> ${data.Plot}</p>
          </div>
        </div>
      `;
    } catch (error) {
      hideSpinner();
      details.innerHTML = `<p>Something went wrong. Please try again later.</p>`;
      console.error("Fetch error:", error);
    }
  };

  // ---------- EVENT LISTENERS ----------
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const movie = input.value.trim();
    if (movie) fetchMovie(movie);
  });

  clearBtn.addEventListener("click", clearDetailsAndInput);

  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear your search history?")) {
      clearHistory();
    }
  });

  // ---------- INIT ----------
  loadTheme();
  renderHistory();
});
