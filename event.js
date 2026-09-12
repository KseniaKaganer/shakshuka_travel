const config = window.SHAKSHUKA_CONFIG;
const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

const statusEl = document.getElementById("status");
const loginScreen = document.getElementById("participantLoginScreen");
const eventEl = document.getElementById("event");
const sessionIndicator = document.getElementById("participantSessionIndicator");

let client = null;
let loadedEvent = null;
let participantAccess = null;
let participantSessionToken = "";

const LOCAL_SESSION_KEY = eventId ? `shakshuka_participant_session_${eventId}` : "";
const SESSION_SESSION_KEY = eventId ? `shakshuka_participant_session_temp_${eventId}` : "";

function getStoredParticipantToken() {
  if (!eventId) return "";
  return localStorage.getItem(LOCAL_SESSION_KEY)
    || sessionStorage.getItem(SESSION_SESSION_KEY)
    || "";
}

function storeParticipantToken(token, remember) {
  if (!eventId || !token) return;

  localStorage.removeItem(LOCAL_SESSION_KEY);
  sessionStorage.removeItem(SESSION_SESSION_KEY);

  if (remember) {
    localStorage.setItem(LOCAL_SESSION_KEY, token);
  } else {
    sessionStorage.setItem(SESSION_SESSION_KEY, token);
  }
}

function clearParticipantToken() {
  if (!eventId) return;
  localStorage.removeItem(LOCAL_SESSION_KEY);
  sessionStorage.removeItem(SESSION_SESSION_KEY);
  participantSessionToken = "";
}

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

function showStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
  statusEl.classList.remove("hidden");
}

function hideStatus() {
  if (statusEl) statusEl.classList.add("hidden");
}

function showLoginStatus(message = "", isError = false) {
  const el = document.getElementById("participantLoginStatus");
  el.textContent = message;
  el.classList.toggle("hidden", !message);
  el.classList.toggle("error", isError);
}

function showSaveStatus(message = "", isError = false) {
  const el = document.getElementById("participantSaveStatus");
  el.textContent = message;
  el.classList.toggle("hidden", !message);
  el.classList.toggle("error", isError);
}

function splitMinutes(totalMinutes) {
  const total = Math.max(0, Number(totalMinutes) || 0);
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

function combineMinutes(hours, minutes) {
  return Math.max(0, (Number(hours) || 0) * 60 + (Number(minutes) || 0));
}

function moneyNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function formatMoney(value) {
  return moneyNumber(value).toFixed(2);
}

function renderPaymentStatus(data) {
  const paymentTotal = moneyNumber(data.payment_total);
  const paymentPaid = moneyNumber(data.payment_paid);
  const coachTotal = moneyNumber(data.coach_tickets_total);
  const coachPaid = moneyNumber(data.coach_tickets_paid);

  setText("selfPaymentTotal", formatMoney(paymentTotal), "0.00");
  setText("selfPaymentPaid", formatMoney(paymentPaid), "0.00");
  setText("selfPaymentLeft", formatMoney(Math.max(0, paymentTotal - paymentPaid)), "0.00");

  setText("selfCoachTotal", formatMoney(coachTotal), "0.00");
  setText("selfCoachPaid", formatMoney(coachPaid), "0.00");
  setText("selfCoachLeft", formatMoney(Math.max(0, coachTotal - coachPaid)), "0.00");

  const coachCard = document.getElementById("selfCoachPaymentCard");
  if (coachCard) {
    coachCard.classList.toggle("hidden", (data.event_type || loadedEvent?.event_type) === "tunnel");
  }
}

function renderMissingAdminInfo(data) {
  const type = data.event_type || loadedEvent?.event_type || "skydive";
  const missing = [];

  if (!data.flight_done) missing.push("Flights");
  if (!data.insurance_done) missing.push("Insurance");

  if (type === "skydive") {
    if (!String(data.license_text || "").trim()) missing.push("License");
    if (!data.reserve_date) missing.push("Reserve date");
  }

  const box = document.getElementById("missingAdminInfo");
  const text = document.getElementById("missingAdminInfoText");

  ["selfFlightCard", "selfInsuranceCard", "selfLicenseCard", "selfReserveCard"].forEach(id => {
    document.getElementById(id)?.classList.remove("missing-required-field");
  });

  if (!data.flight_done) document.getElementById("selfFlightCard")?.classList.add("missing-required-field");
  if (!data.insurance_done) document.getElementById("selfInsuranceCard")?.classList.add("missing-required-field");
  if (type === "skydive" && !String(data.license_text || "").trim()) {
    document.getElementById("selfLicenseCard")?.classList.add("missing-required-field");
  }
  if (type === "skydive" && !data.reserve_date) {
    document.getElementById("selfReserveCard")?.classList.add("missing-required-field");
  }

  if (!missing.length) {
    box.classList.add("hidden");
    text.textContent = "";
    return;
  }

  text.textContent = missing.join(", ");
  box.classList.remove("hidden");
}

function formatLogbookDate(dateString) {
  return dateString ? formatDate(dateString) : "—";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadParticipantLogbook() {
  const list = document.getElementById("participantLogbookList");
  const status = document.getElementById("participantLogbookStatus");

  if (!participantAccess?.participant_id || !participantSessionToken) return;

  status.textContent = "Loading logbook…";
  status.classList.remove("hidden", "error");

  const { data, error } = await client.rpc("get_participant_logbook_by_token", {
    p_event_id: eventId,
    p_token: participantSessionToken
  });

  status.classList.add("hidden");

  if (error) {
    status.textContent = `Could not load logbook: ${error.message}`;
    status.classList.remove("hidden");
    status.classList.add("error");
    return;
  }

  if (!data?.length) {
    list.innerHTML = '<p class="muted">No jumps entered yet.</p>';
    return;
  }

  list.innerHTML = data.map(entry => `
    <article class="logbook-entry">
      <div class="logbook-entry-main">
        <strong>${entry.jump_number != null ? `Jump #${entry.jump_number}` : "Jump"}</strong>
        <span>${escapeHtml(entry.jump_type || "Skydive")}</span>
      </div>
      <div class="logbook-entry-date">${formatLogbookDate(entry.jump_date)}</div>
      ${entry.notes ? `<p>${escapeHtml(entry.notes)}</p>` : ""}
    </article>
  `).join("");
}

function showLoginScreen() {
  eventEl.classList.add("hidden");
  sessionIndicator.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  hideStatus();
}

async function loadParticipantNames() {
  const select = document.getElementById("participantSelect");
  select.disabled = true;
  select.innerHTML = '<option value="">Loading participants…</option>';

  try {
    const { data, error } = await client.rpc("get_event_participant_names", {
      p_event_id: eventId
    });

    if (error) throw error;

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
  } catch (error) {
    console.error("Could not load participant names:", error);
    select.innerHTML = '<option value="">Could not load participants</option>';
    showLoginStatus(`Could not load participants: ${error.message}`, true);
  } finally {
    select.disabled = false;
  }
}

function renderParticipantFields(data) {
  const type = data.event_type || loadedEvent?.event_type || "skydive";
  setText("participantEventTypeLabel", type === "tunnel" ? "Tunnel event" : "Skydive event", "");

  document.getElementById("participantTunnelFields").classList.toggle("hidden", type !== "tunnel");
  document.getElementById("participantSkydiveFields").classList.toggle("hidden", type !== "skydive");

  document.getElementById("selfFlightDone").checked = Boolean(data.flight_done);
  document.getElementById("selfInsuranceDone").checked = Boolean(data.insurance_done);
  document.getElementById("selfPassportDone").checked = Boolean(data.passport_done);

  const time = splitMinutes(data.tunnel_minutes_total);
  document.getElementById("selfTunnelHours").value = time.hours || "";
  document.getElementById("selfTunnelMinutes").value = time.minutes || "";
  document.getElementById("selfSkydiveTunnelHours").value = time.hours || "";
  document.getElementById("selfSkydiveTunnelMinutes").value = time.minutes || "";

  document.getElementById("selfJerseyDone").checked = Boolean(data.jersey_done);
  document.getElementById("selfLicenseText").value = data.license_text || "";
  document.getElementById("selfReserveDate").value = data.reserve_date ? formatDate(data.reserve_date) : "";
  document.getElementById("selfLastJumpDate").value = data.last_jump_date || "";
  document.getElementById("selfNumberJumps").value = data.number_of_jumps ?? "";
  document.getElementById("selfCanopySize").value = data.canopy_size ?? "";
  document.getElementById("selfWaterTrainingDone").checked = Boolean(data.water_training_done);
  document.getElementById("selfCanopyCourseDone").checked = Boolean(data.canopy_course_done);
}

function showLoggedInView(data) {
  participantAccess = data;
  loginScreen.classList.add("hidden");
  eventEl.classList.remove("hidden");
  sessionIndicator.classList.remove("hidden");

  setText("participantSessionName", data.display_name, "");
  setText("participantWelcomeName", data.display_name, "Participant");
  renderParticipantFields(data);
  renderPaymentStatus(data);
  renderMissingAdminInfo(data);
  loadParticipantLogbook();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function participantSignIn() {
  const participantId = document.getElementById("participantSelect").value;
  const password = document.getElementById("participantPhone").value.trim();
  const remember = document.getElementById("rememberParticipantLogin").checked;
  const button = document.getElementById("participantSignIn");

  if (!participantId) return showLoginStatus("Please select your name.", true);
  if (!password) return showLoginStatus("Please enter your password.", true);

  button.disabled = true;
  const oldText = button.textContent;
  button.textContent = "Checking…";
  showLoginStatus("");

  try {
    const { data, error } = await client.rpc("participant_login_create_session", {
      p_event_id: eventId,
      p_participant_id: participantId,
      p_phone: password,
      p_remember: remember
    });

    if (error) throw error;
    if (!data?.ok || !data?.token || !data?.access) {
      showLoginStatus("The password does not match this participant.", true);
      return;
    }

    participantSessionToken = data.token;
    participantAccess = data.access;
    storeParticipantToken(data.token, remember);
    document.getElementById("participantPhone").value = "";
    showLoggedInView(data.access);
  } catch (error) {
    console.error("Participant login failed:", error);
    showLoginStatus(`Could not sign in: ${error.message}`, true);
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

async function saveParticipantProfile() {
  if (!participantAccess?.participant_id || !participantSessionToken) return;

  const type = participantAccess.event_type || loadedEvent?.event_type || "skydive";
  const button = document.getElementById("saveParticipantProfile");
  button.disabled = true;
  const oldText = button.textContent;
  button.textContent = "Saving…";
  showSaveStatus("");

  const tunnelMinutes = type === "tunnel"
    ? combineMinutes(document.getElementById("selfTunnelHours").value, document.getElementById("selfTunnelMinutes").value)
    : combineMinutes(document.getElementById("selfSkydiveTunnelHours").value, document.getElementById("selfSkydiveTunnelMinutes").value);

  try {
    const { data, error } = await client.rpc("update_participant_self_fields_by_token", {
      p_event_id: eventId,
      p_token: participantSessionToken,
      p_passport_done: document.getElementById("selfPassportDone").checked,
      p_tunnel_minutes_total: tunnelMinutes,
      p_jersey_done: type === "skydive" ? document.getElementById("selfJerseyDone").checked : null,
      p_last_jump_date: type === "skydive" ? (document.getElementById("selfLastJumpDate").value || null) : null,
      p_number_of_jumps: type === "skydive" && document.getElementById("selfNumberJumps").value !== ""
        ? Number(document.getElementById("selfNumberJumps").value) : null,
      p_canopy_size: type === "skydive" && document.getElementById("selfCanopySize").value !== ""
        ? Number(document.getElementById("selfCanopySize").value) : null,
      p_water_training_done: type === "skydive" ? document.getElementById("selfWaterTrainingDone").checked : null,
      p_canopy_course_done: type === "skydive" ? document.getElementById("selfCanopyCourseDone").checked : null
    });

    if (error) throw error;
    if (!data?.ok) throw new Error("Could not verify participant login.");

    participantAccess = { ...participantAccess, ...data };
    renderParticipantFields(participantAccess);
    renderPaymentStatus(participantAccess);
    renderMissingAdminInfo(participantAccess);
    showSaveStatus("Saved.");
    setTimeout(() => showSaveStatus(""), 2200);
  } catch (error) {
    console.error("Participant save failed:", error);
    showSaveStatus(`Could not save: ${error.message}`, true);
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

async function participantSignOut() {
  const tokenToRevoke = participantSessionToken || getStoredParticipantToken();

  clearParticipantToken();
  participantAccess = null;
  document.getElementById("participantPhone").value = "";
  document.getElementById("participantSelect").value = "";
  document.getElementById("rememberParticipantLogin").checked = false;
  showLoginStatus("");
  showLoginScreen();

  if (tokenToRevoke && client) {
    client.rpc("participant_logout_session", { p_token: tokenToRevoke }).catch(() => {});
  }
}


async function restoreParticipantSession() {
  const token = getStoredParticipantToken();
  if (!token) return false;

  try {
    const { data, error } = await client.rpc("get_participant_event_access_by_token", {
      p_event_id: eventId,
      p_token: token
    });

    if (error || !data?.ok) {
      clearParticipantToken();
      return false;
    }

    participantSessionToken = token;
    participantAccess = data;
    showLoggedInView(data);
    return true;
  } catch (error) {
    console.warn("Could not restore participant session:", error);
    clearParticipantToken();
    return false;
  }
}

async function loadEvent() {
  try {
    if (!eventId) throw new Error("Event ID is missing.");

    if (!config?.supabaseUrl || !config?.supabaseAnonKey || config.supabaseUrl.includes("PASTE_")) {
      throw new Error("Supabase configuration is missing.");
    }

    if (!window.supabase) {
      throw new Error("Supabase library did not load. Refresh the page.");
    }

    client = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

    const { data: event, error } = await client
      .from("events")
      .select(`
        id,
        name,
        start_date,
        end_date,
        event_type,
        venue,
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

    if (error) throw error;
    if (!event) throw new Error("Event not found.");

    loadedEvent = event;

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

    const restored = await restoreParticipantSession();

    if (!restored) {
      showLoginScreen();
      await loadParticipantNames();
    }

  } catch (error) {
    console.error("Event page failed to load:", error);
    loginScreen.classList.add("hidden");
    eventEl.classList.add("hidden");
    showStatus(`Could not load event: ${error.message}`, true);
  }
}

document.getElementById("participantSignIn").addEventListener("click", participantSignIn);
document.getElementById("participantSignOut").addEventListener("click", participantSignOut);
document.getElementById("saveParticipantProfile").addEventListener("click", saveParticipantProfile);
document.getElementById("participantPhone").addEventListener("keydown", event => {
  if (event.key === "Enter") participantSignIn();
});

loadEvent();
