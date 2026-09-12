const config = window.SHAKSHUKA_CONFIG;

const statusEl = document.getElementById("status");
const eventsEl = document.getElementById("events");

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateRange(start, end) {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function locationText(location) {
  if (!location) return "";
  return [location.name, location.city, location.country]
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index)
    .join(" • ");
}


function countryCode(country = "") {
  const aliases = {
    "spain": "es",
    "thailand": "th",
    "slovenia": "si",
    "italy": "it",
    "france": "fr",
    "czech republic": "cz",
    "czechia": "cz",
    "morocco": "ma",
    "united states": "us",
    "usa": "us",
    "united states of america": "us",
    "israel": "il",
    "greece": "gr",
    "cyprus": "cy",
    "united arab emirates": "ae",
    "uae": "ae",
    "portugal": "pt",
    "germany": "de",
    "austria": "at",
    "netherlands": "nl",
    "belgium": "be",
    "poland": "pl",
    "croatia": "hr",
    "ukraine": "ua",
    "united kingdom": "gb",
    "uk": "gb"
  };

  return aliases[String(country).trim().toLowerCase()] || "";
}

function countryFlagMarkup(country = "") {
  const code = countryCode(country);
  if (!code) return '<span class="event-country-fallback">🌍</span>';

  return `<img
    class="event-country-flag-img"
    src="https://flagcdn.com/w40/${code}.png"
    srcset="https://flagcdn.com/w80/${code}.png 2x"
    width="40"
    alt="${escapeHtml(country)} flag"
    loading="lazy"
  />`;
}

function eventTypeIcon(type) {
  return type === "tunnel" ? "🌀" : "🪂";
}

async function loadEvents() {
  if (!config?.supabaseUrl || config.supabaseUrl.includes("PASTE_")) {
    statusEl.textContent = "Add your Supabase URL and anon key in supabase-config.js.";
    statusEl.classList.add("error");
    return;
  }

  const client = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  const { data, error } = await client
    .from("events")
    .select(`
      id,
      name,
      start_date,
      end_date,
      event_type,
      status,
      locations (
        name,
        city,
        country
      )
    `)
    .eq("status", "published")
    .order("start_date", { ascending: true });

  if (error) {
    statusEl.textContent = `Could not load events: ${error.message}`;
    statusEl.classList.add("error");
    return;
  }

  statusEl.remove();

  if (!data?.length) {
    eventsEl.innerHTML = `<div class="panel"><p>No published travel events yet.</p></div>`;
    return;
  }

  eventsEl.innerHTML = data.map(event => {
    const country = event.locations?.country || "";
    const type = event.event_type || "skydive";
    return `
      <a class="event-card event-card--with-icons" href="event.html?id=${encodeURIComponent(event.id)}">
        <div class="event-card__topline">
          <div class="event-card__date">${formatDateRange(event.start_date, event.end_date)}</div>
          <div class="event-card__icons">
            <span class="event-country-flag" title="${escapeHtml(country)}">${countryFlagMarkup(country)}</span>
            <span class="event-type-icon" title="${type === "tunnel" ? "Tunnel event" : "Skydive event"}">${eventTypeIcon(type)}</span>
          </div>
        </div>
        <h3>${escapeHtml(event.name)}</h3>
        <div class="event-card__location">${escapeHtml(locationText(event.locations))}</div>
      </a>
    `;
  }).join("");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadEvents();
