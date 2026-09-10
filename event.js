const config = window.SHAKSHUKA_CONFIG;
const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

const statusEl = document.getElementById("status");
const loginScreen = document.getElementById("participantLoginScreen");
const eventEl = document.getElementById("event");
const sessionIndicator = document.getElementById("participantSessionIndicator");

let client = null;
let loadedEvent = null;

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateRange(start, end) {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function setText(id, value, fallback = "—") {
  const el = document.getElementById(id);
  if (el) el.textContent = value || fallback;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showLoginStatus(message = "", isError = false) {
  const el = document.getElementById("participantLoginStatus");

  if (!message) {
    el.textContent = "";
    el.classList.add("hidden");
    el.classList.remove("error");
    return;
  }

  el.textContent = message;
  el.classList.remove("hidden");
  el.classList.toggle("error", isError);
}

function setChecklistState(id, done) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = done ? "✓" : "○";
  el.classList.toggle("done", Boolean(done));
}

async function loadParticipantNames() {
  const select = document.getElementById("participantSelect");
  select.disabled = true;
  select.innerHTML = '<option value="">Loading participants…</option>';

  const { data, error } = await client.rpc("get_event_participant_names", {
    p_event_id: eventId
  });

  select.disabled = false;

  if (error) {
    select.innerHTML = '<option value="">Could not load participants</option>';
    showLoginStatus(`Could not load participants: ${error.message}`, true);
    return;
  }

  select.innerHTML = '<option value="">Select your name…</option>';

  (data || []).forEach(person => {
    const option = document.createElement("option");
    option.value = person.participant_id;
    option.textContent = person.display_name;
    select.appendChild(option);
  });

  if (!data?.length) {
    select.innerHTML = '<option value="">No participants added yet</option>';
  }
}

function showLoggedOutView() {
  eventEl.classList.add("hidden");
  sessionIndicator.classList.add("hidden");
  loginScreen.classList.remove("hidden");

  document.getElementById("participantSelect").value = "";
  document.getElementById("participantPhone").value = "";
  showLoginStatus("");
}

function showLoggedInView(accessData) {
  loginScreen.classList.add("hidden");
  eventEl.classList.remove("hidden");
  sessionIndicator.classList.remove("hidden");

  setText("participantSessionName", accessData.display_name, "");
  setText("participantWelcomeName", `Welcome, ${accessData.display_name}`, "Welcome");

  setChecklistState("checkFlight", accessData.flight_done);
  setChecklistState("checkInsurance", accessData.insurance_done);
  setChecklistState("checkReserve", accessData.reserve_done);
  setChecklistState("checkLicense", accessData.license_done);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function participantSignIn() {
  const participantId = document.getElementById("participantSelect").value;
  const phone = document.getElementById("participantPhone").value.trim();
  const button = document.getElementById("participantSignIn");

  if (!participantId) {
    showLoginStatus("Please select your name.", true);
    return;
  }

  if (!phone) {
    showLoginStatus("Please enter your phone number.", true);
    return;
  }

  button.disabled = true;
  const previousText = button.textContent;
  button.textContent = "Checking…";
  showLoginStatus("");

  const { data, error } = await client.rpc("get_participant_event_access", {
    p_event_id: eventId,
    p_participant_id: participantId,
    p_phone: phone
  });

  button.disabled = false;
  button.textContent = previousText;

  if (error) {
    showLoginStatus(`Could not sign in: ${error.message}`, true);
    return;
  }

  if (!data?.ok) {
    showLoginStatus("The phone number does not match this participant.", true);
    return;
  }

  showLoggedInView(data);
}

function participantSignOut() {
  showLoggedOutView();
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

  client = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

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
      status,
      locations (
        name,
        city,
        country,
        dropzone,
        address,
        venue_type
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

  loadedEvent = event;

  const { data: links } = await client
    .from("event_links")
    .select("title,url,category,sort_order")
    .eq("event_id", eventId)
    .eq("visible_to_participants", true)
    .order("sort_order", { ascending: true });

  statusEl.remove();

  setText("loginEventName", event.name, "Participant login");
  setText("eventDates", formatDateRange(event.start_date, event.end_date), "");
  setText("eventName", event.name);

  const loc = event.locations || {};
  const locationLine = [loc.name, loc.city, loc.country]
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index)
    .join(" • ");

  setText("eventLocation", locationLine);
  setText("eventDescription", event.description);

  const venueLines = [event.venue, loc.dropzone, loc.address]
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);

  setText("eventVenue", venueLines.join("\n"));
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

  await loadParticipantNames();
  showLoggedOutView();
}

document.getElementById("participantSignIn").addEventListener("click", participantSignIn);
document.getElementById("participantSignOut").addEventListener("click", participantSignOut);

document.getElementById("participantPhone").addEventListener("keydown", event => {
  if (event.key === "Enter") participantSignIn();
});

loadEvent();
