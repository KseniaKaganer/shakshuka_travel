const config = window.SHAKSHUKA_CONFIG;
const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

const statusEl = document.getElementById("status");
const eventEl = document.getElementById("event");

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateRange(start, end) {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function setText(id, value, fallback = "—") {
  document.getElementById(id).textContent = value || fallback;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadEvent() {
  if (!eventId) {
    statusEl.textContent = "Event not found.";
    statusEl.classList.add("error");
    return;
  }

  if (!config?.supabaseUrl || config.supabaseUrl.includes("PASTE_")) {
    statusEl.textContent = "Add your Supabase URL and anon key in supabase-config.js.";
    statusEl.classList.add("error");
    return;
  }

  const client = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  const { data: event, error } = await client
    .from("events")
    .select(`
      id,
      name,
      start_date,
      end_date,
      venue,
      additional_location_info,
      description,
      meeting_info,
      status,
      locations (
        name,
        city,
        country,
        dropzone,
        address
      )
    `)
    .eq("id", eventId)
    .eq("status", "published")
    .single();

  if (error || !event) {
    statusEl.textContent = "This event is unavailable or has not been published.";
    statusEl.classList.add("error");
    return;
  }

  const { data: links } = await client
    .from("event_links")
    .select("title,url,category,sort_order")
    .eq("event_id", eventId)
    .eq("visible_to_participants", true)
    .order("sort_order", { ascending: true });

  statusEl.remove();
  eventEl.classList.remove("hidden");

  setText("eventDates", formatDateRange(event.start_date, event.end_date), "");
  setText("eventName", event.name);

  const loc = event.locations || {};
  const locationLine = [loc.name, loc.city, loc.country]
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index)
    .join(" • ");
  setText("eventLocation", locationLine);

  setText("eventDescription", event.description);
  setText("eventVenue", [event.venue, loc.dropzone, loc.address].filter(Boolean).join("\n"));
  setText("eventLocationInfo", event.additional_location_info);

  const linksEl = document.getElementById("eventLinks");
  if (!links?.length) {
    linksEl.innerHTML = "<p>—</p>";
  } else {
    linksEl.innerHTML = `<div class="link-list">${
      links.map(link => `
        <a class="link-item" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">
          ${escapeHtml(link.title)} ↗
        </a>
      `).join("")
    }</div>`;
  }
}

loadEvent();
