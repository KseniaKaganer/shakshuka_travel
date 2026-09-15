const config = window.SHAKSHUKA_CONFIG;
const client = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const editorView = document.getElementById("editorView");
const signOutButton = document.getElementById("signOutButton");
const loggedInIndicator = document.getElementById("loggedInIndicator");
const loggedInEmail = document.getElementById("loggedInEmail");
const loginStatus = document.getElementById("loginStatus");
const dashboardStatus = document.getElementById("dashboardStatus");
const editorStatus = document.getElementById("editorStatus");
const eventsEl = document.getElementById("adminEvents");
const locationSelect = document.getElementById("locationSelect");
const participantsList = document.getElementById("participantsList");
const participantTemplate = document.getElementById("participantRowTemplate");
const participantModal = document.getElementById("participantModal");
const modalParticipantName = document.getElementById("modalParticipantName");
const modalParticipantPhone = document.getElementById("modalParticipantPhone");
const modalParticipantEmail = document.getElementById("modalParticipantEmail");
const modalParticipantNotes = document.getElementById("modalParticipantNotes");
const modalFlightDone = document.getElementById("modalFlightDone");
const modalInsuranceDone = document.getElementById("modalInsuranceDone");
const modalPassportDone = document.getElementById("modalPassportDone");
const modalJerseyDone = document.getElementById("modalJerseyDone");
const modalLicenseText = document.getElementById("modalLicenseText");
const modalReserveDate = document.getElementById("modalReserveDate");
const modalLastJumpDate = document.getElementById("modalLastJumpDate");
const modalNumberJumps = document.getElementById("modalNumberJumps");
const modalTunnelHours = document.getElementById("modalTunnelHours");
const modalTunnelMinutes = document.getElementById("modalTunnelMinutes");
const modalSkydiveTunnelHours = document.getElementById("modalSkydiveTunnelHours");
const modalSkydiveTunnelMinutes = document.getElementById("modalSkydiveTunnelMinutes");
const modalCanopySize = document.getElementById("modalCanopySize");
const modalWaterTrainingDone = document.getElementById("modalWaterTrainingDone");
const modalCanopyCourseDone = document.getElementById("modalCanopyCourseDone");
const tunnelParticipantFields = document.getElementById("tunnelParticipantFields");
const skydiveParticipantFields = document.getElementById("skydiveParticipantFields");
const participantEventTypeBadge = document.getElementById("participantEventTypeBadge");
const modalPaymentTotal = document.getElementById("modalPaymentTotal");
const modalPaymentNotes = document.getElementById("modalPaymentNotes");
const modalPaymentPaid = document.getElementById("modalPaymentPaid");
const modalPaymentLeft = document.getElementById("modalPaymentLeft");
const modalCoachTotal = document.getElementById("modalCoachTotal");
const modalCoachPaid = document.getElementById("modalCoachPaid");
const modalCoachLeft = document.getElementById("modalCoachLeft");
const exportParticipantsButton = document.getElementById("exportParticipantsButton");
const coachTicketsPaymentRow = document.getElementById("coachTicketsPaymentRow");


const venueSelect = document.getElementById("venueSelect");
const selectedVenueDetails = document.getElementById("selectedVenueDetails");
const showVenueFormButton = document.getElementById("showVenueFormButton");
const editVenueButton = document.getElementById("editVenueButton");
const clearVenueButton = document.getElementById("clearVenueButton");
const newVenueBox = document.getElementById("newVenueBox");
const venueFormTitle = document.getElementById("venueFormTitle");
const cancelVenueButton = document.getElementById("cancelVenueButton");
const venueNameInput = document.getElementById("venueNameInput");
const venueTypeFormInput = document.getElementById("venueTypeFormInput");
const venueWebsiteFormInput = document.getElementById("venueWebsiteFormInput");
const venueTicketPriceFormField = document.getElementById("venueTicketPriceFormField");
const venueTunnelCostFormField = document.getElementById("venueTunnelCostFormField");
const venueTicketPriceFormInput = document.getElementById("venueTicketPriceFormInput");
const venueTunnelCostFormInput = document.getElementById("venueTunnelCostFormInput");
const saveVenueButton = document.getElementById("saveVenueButton");
const deleteVenueButton = document.getElementById("deleteVenueButton");
const eventVenueTypeInput = document.getElementById("eventVenueTypeInput");
const venueUrlInput = document.getElementById("venueUrlInput");
const dropzoneTicketPriceField = document.getElementById("dropzoneTicketPriceField");
const tunnelTimeCostField = document.getElementById("tunnelTimeCostField");
const ticketPriceInput = document.getElementById("ticketPriceInput");
const tunnelTimeCostInput = document.getElementById("tunnelTimeCostInput");
const eventLogbookSection = document.getElementById("eventLogbookSection");
const eventLogbookDays = document.getElementById("eventLogbookDays");
const eventLogbookStatus = document.getElementById("eventLogbookStatus");
const addLogbookDayButton = document.getElementById("addLogbookDayButton");
const newLogbookDaySelect = document.getElementById("newLogbookDaySelect");
const exportLogbookButton = document.getElementById("exportLogbookButton");
const logbookDayTemplate = document.getElementById("logbookDayTemplate");
const logbookLoadTemplate = document.getElementById("logbookLoadTemplate");
const logbookGroupTemplate = document.getElementById("logbookGroupTemplate");

let currentEventId = null;
let currentEventStartDate = "";
let currentEventEndDate = "";
let removedMembershipIds = [];
let locations = [];
let venues = [];
let editingParticipantRow = null;
let editingLocationId = null;
let editingVenueId = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateRange(start, end) {
  return `${formatDate(start)} – ${formatDate(end)}`;
}


function setTextById(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setStatus(element, message = "", isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
  element.classList.toggle("success", Boolean(message) && !isError);
}

function showView(view) {
  loginView.classList.toggle("hidden", view !== "login");
  dashboardView.classList.toggle("hidden", view !== "dashboard");
  editorView.classList.toggle("hidden", view !== "editor");

  const isLoggedInView = view !== "login";
  signOutButton.classList.toggle("hidden", !isLoggedInView);
  loggedInIndicator.classList.toggle("hidden", !isLoggedInView);

  window.scrollTo({ top: 0, behavior: "smooth" });
}


function adminEventIdFromUrl() {
  return new URLSearchParams(window.location.search).get("event") || "";
}

function setAdminEventUrl(eventId = "") {
  const url = new URL(window.location.href);

  if (eventId) {
    url.searchParams.set("event", eventId);
  } else {
    url.searchParams.delete("event");
  }

  window.history.replaceState(
    { eventId: eventId || null },
    "",
    `${url.pathname}${url.search}${url.hash}`
  );
}

async function updateLoggedInIndicator() {
  const { data: { user } } = await client.auth.getUser();
  if (!loggedInEmail) return;
  const email = user?.email || "";
  const e = email.toLowerCase();
  const meta = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.user_metadata?.display_name || "";
  const name = meta || (e === "ksenia.kaganer@gmail.com" ? "Ksenia" : e === "ilyazabarskiy@gmail.com" ? "Ilya" : (email.split("@")[0] || "Admin"));
  loggedInEmail.textContent = name;
  loggedInEmail.title = email || name;
}

async function isCurrentUserAdmin() {
  const { data, error } = await client.rpc("is_admin");
  if (error) return false;
  return data === true;
}

async function routeForSession() {
  const { data: { session } } = await client.auth.getSession();

  if (!session) {
    showView("login");
    return;
  }

  if (!(await isCurrentUserAdmin())) {
    await client.auth.signOut();
    setStatus(loginStatus, "This account is not an administrator.", true);
    showView("login");
    return;
  }

  await updateLoggedInIndicator();

  // Load shared data first, then restore the exact event if its ID is in the URL.
  await Promise.all([loadLocations(), loadVenues(), loadAdminEvents()]);

  const eventIdFromUrl = adminEventIdFromUrl();

  if (eventIdFromUrl) {
    await openEventEditor(eventIdFromUrl, { updateUrl: false });
  } else {
    showView("dashboard");
  }
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(loginStatus, "Signing in…");

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    setStatus(loginStatus, error.message, true);
    return;
  }

  if (!(await isCurrentUserAdmin())) {
    await client.auth.signOut();
    setStatus(loginStatus, "This account is not an administrator.", true);
    return;
  }

  setStatus(loginStatus, "");
  await updateLoggedInIndicator();
  await Promise.all([loadLocations(), loadVenues(), loadAdminEvents()]);

  const eventIdFromUrl = adminEventIdFromUrl();
  if (eventIdFromUrl) {
    await openEventEditor(eventIdFromUrl, { updateUrl: false });
  } else {
    showView("dashboard");
  }
});

signOutButton.addEventListener("click", async () => {
  await client.auth.signOut();
  if (loggedInEmail) loggedInEmail.textContent = "";
  showView("login");
});

async function loadLocations() {
  const { data, error } = await client
    .from("locations")
    .select("id,name,country,city,dropzone,address,active,venue_type,location_type,website_url")
    .order("country", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    setStatus(dashboardStatus, `Could not load locations: ${error.message}`, true);
    return;
  }

  locations = data || [];
  renderLocationOptions();
}

function renderLocationOptions(selectedId = locationSelect.value) {
  locationSelect.innerHTML = `<option value="">No location selected</option>` + locations.map(location => {
    const label = [location.name, location.city, location.country]
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index)
      .join(" • ");
    return `<option value="${location.id}">${escapeHtml(label)}</option>`;
  }).join("");
  if (selectedId) locationSelect.value = selectedId;
}

async function loadVenues() {
  const { data, error } = await client
    .from("venues")
    .select("id,name,venue_type,website_url,ticket_price,tunnel_time_cost,active")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    setStatus(dashboardStatus, `Could not load venues: ${error.message}`, true);
    return;
  }

  venues = data || [];
  renderVenueOptions();
}

function renderVenueOptions(selectedId = venueSelect?.value || "") {
  if (!venueSelect) return;

  venueSelect.innerHTML = `<option value="">No venue selected</option>` + venues.map(venue => {
    const typeLabel = venue.venue_type === "tunnel" ? "Tunnel" : "Drop zone";
    return `<option value="${venue.id}">${escapeHtml(venue.name)} • ${typeLabel}</option>`;
  }).join("");

  if (selectedId) venueSelect.value = selectedId;
  renderSelectedVenue();
}

function updateVenueFormPriceFields() {
  const type = venueTypeFormInput?.value || "dropzone";
  venueTicketPriceFormField?.classList.toggle("hidden", type !== "dropzone");
  venueTunnelCostFormField?.classList.toggle("hidden", type !== "tunnel");
}

function renderSelectedVenue() {
  if (!venueSelect) return;

  const venue = venues.find(item => item.id === venueSelect.value);

  selectedVenueDetails?.classList.toggle("hidden", !venue);

  if (!venue) {
    if (eventVenueTypeInput) eventVenueTypeInput.value = getEventType() === "tunnel" ? "tunnel" : "dropzone";
    if (document.getElementById("venueInput")) document.getElementById("venueInput").value = "";
    if (venueUrlInput) venueUrlInput.value = "";
    if (ticketPriceInput) ticketPriceInput.value = "";
    if (tunnelTimeCostInput) tunnelTimeCostInput.value = "";
    updateEventVenueFields();
    return;
  }

  if (eventVenueTypeInput) eventVenueTypeInput.value = venue.venue_type || "dropzone";
  document.getElementById("venueInput").value = venue.name || "";
  if (venueUrlInput) venueUrlInput.value = venue.website_url || "";
  if (ticketPriceInput) ticketPriceInput.value = venue.ticket_price ?? "";
  if (tunnelTimeCostInput) tunnelTimeCostInput.value = venue.tunnel_time_cost ?? "";

  updateEventVenueFields();
}

function showVenueForm(mode = "new") {
  newVenueBox?.classList.remove("hidden");
  editingVenueId = mode === "edit" ? venueSelect?.value || null : null;

  if (editingVenueId) {
    const venue = venues.find(item => item.id === editingVenueId);
    if (!venue) return;

    setTextById("venueFormTitle", "Edit event venue");
    venueNameInput.value = venue.name || "";
    venueTypeFormInput.value = venue.venue_type || "dropzone";
    venueWebsiteFormInput.value = venue.website_url || "";
    venueTicketPriceFormInput.value = venue.ticket_price ?? "";
    venueTunnelCostFormInput.value = venue.tunnel_time_cost ?? "";
    deleteVenueButton?.classList.remove("hidden");
  } else {
    setTextById("venueFormTitle", "Add event venue");
    venueNameInput.value = "";
    venueTypeFormInput.value = getEventType() === "tunnel" ? "tunnel" : "dropzone";
    venueWebsiteFormInput.value = "";
    venueTicketPriceFormInput.value = "";
    venueTunnelCostFormInput.value = "";
    deleteVenueButton?.classList.add("hidden");
  }

  updateVenueFormPriceFields();
}

function hideVenueForm() {
  newVenueBox?.classList.add("hidden");
  editingVenueId = null;
  if (venueNameInput) venueNameInput.value = "";
  if (venueWebsiteFormInput) venueWebsiteFormInput.value = "";
  if (venueTicketPriceFormInput) venueTicketPriceFormInput.value = "";
  if (venueTunnelCostFormInput) venueTunnelCostFormInput.value = "";
  if (deleteVenueButton) deleteVenueButton.classList.add("hidden");
}

venueTypeFormInput?.addEventListener("change", updateVenueFormPriceFields);
venueSelect?.addEventListener("change", renderSelectedVenue);
showVenueFormButton?.addEventListener("click", () => showVenueForm("new"));

editVenueButton?.addEventListener("click", () => {
  if (!venueSelect?.value) {
    setStatus(editorStatus, "Select a venue first, then click Edit.", true);
    return;
  }
  showVenueForm("edit");
});

clearVenueButton?.addEventListener("click", () => {
  if (venueSelect) venueSelect.value = "";
  renderSelectedVenue();
  hideVenueForm();
  setStatus(editorStatus, "Venue removed from this event. Save the event to keep the change.");
});

cancelVenueButton?.addEventListener("click", hideVenueForm);

saveVenueButton?.addEventListener("click", async () => {
  const name = venueNameInput?.value.trim() || "";

  if (!name) {
    setStatus(editorStatus, "Venue name is required.", true);
    return;
  }

  const venueType = venueTypeFormInput?.value || "dropzone";
  const payload = {
    name,
    venue_type: venueType,
    website_url: venueWebsiteFormInput?.value.trim() || null,
    ticket_price: venueType === "dropzone" && venueTicketPriceFormInput?.value
      ? Number(venueTicketPriceFormInput.value)
      : null,
    tunnel_time_cost: venueType === "tunnel" && venueTunnelCostFormInput?.value
      ? Number(venueTunnelCostFormInput.value)
      : null,
    active: true
  };

  if (editingVenueId) {
    const { data, error } = await client
      .from("venues")
      .update(payload)
      .eq("id", editingVenueId)
      .select()
      .single();

    if (error) {
      setStatus(editorStatus, `Could not update venue: ${error.message}`, true);
      return;
    }

    venues = venues.map(item => item.id === data.id ? data : item);
    renderVenueOptions(data.id);
    setStatus(editorStatus, "Venue updated.");
  } else {
    const { data, error } = await client
      .from("venues")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setStatus(editorStatus, `Could not add venue: ${error.message}`, true);
      return;
    }

    venues.push(data);
    renderVenueOptions(data.id);
    setStatus(editorStatus, "Venue added.");
  }

  hideVenueForm();
});

deleteVenueButton?.addEventListener("click", async () => {
  if (!editingVenueId) return;

  const venue = venues.find(item => item.id === editingVenueId);
  const label = venue?.name || "this venue";

  if (!window.confirm(`Delete ${label} from the saved venues list?`)) return;

  const { error } = await client.from("venues").delete().eq("id", editingVenueId);

  if (error) {
    const { error: deactivateError } = await client
      .from("venues")
      .update({ active: false })
      .eq("id", editingVenueId);

    if (deactivateError) {
      setStatus(editorStatus, `Could not remove venue: ${deactivateError.message}`, true);
      return;
    }
  }

  venues = venues.filter(item => item.id !== editingVenueId);

  if (venueSelect?.value === editingVenueId) venueSelect.value = "";

  renderVenueOptions();
  hideVenueForm();
  setStatus(editorStatus, "Venue removed.");
});


async function loadAdminEvents() {
  setStatus(dashboardStatus, "Loading events…");

  const { data, error } = await client
    .from("events")
    .select(`
      id,
      name,
      start_date,
      end_date,
      status,
      locations(name, city, country),
      event_participants(count)
    `)
    .order("start_date", { ascending: true });

  if (error) {
    setStatus(dashboardStatus, `Could not load events: ${error.message}`, true);
    return;
  }

  setStatus(dashboardStatus, "");

  if (!data?.length) {
    eventsEl.innerHTML = `<div class="panel"><p class="muted">No events yet. Create your first SHAKSHUKA TRAVEL event.</p></div>`;
    return;
  }

  eventsEl.innerHTML = data.map(event => {
    const location = event.locations || {};
    const locationLine = [location.name, location.city, location.country]
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index)
      .join(" • ") || "No location";
    const participantCount = event.event_participants?.[0]?.count ?? 0;

    return `
      <article class="admin-event-card">
        <div class="admin-event-date">${formatDateRange(event.start_date, event.end_date)}</div>
        <div class="admin-event-content">
          <div class="admin-event-title-row">
            <h3>${escapeHtml(event.name)}</h3>
            <span class="status-pill status-${escapeHtml(event.status)}">${escapeHtml(event.status)}</span>
          </div>
          <div class="muted">${escapeHtml(locationLine)}</div>
          <div class="admin-event-meta">${participantCount} participant${participantCount === 1 ? "" : "s"}</div>
        </div>
        <div class="admin-event-actions">
          <button class="secondary-button edit-event-button" type="button" data-event-id="${event.id}">Edit event</button>
          ${event.status === "published" ? `<a class="ghost-button button-link" href="event.html?id=${encodeURIComponent(event.id)}" target="_blank" rel="noopener">View ↗</a>` : ""}
        </div>
      </article>
    `;
  }).join("");

}

function getEventType() {
  return document.querySelector('input[name="eventType"]:checked')?.value || "skydive";
}

function setEventType(type = "skydive") {
  const radio = document.querySelector(`input[name="eventType"][value="${type}"]`);
  if (radio) radio.checked = true;
  updateParticipantModalForEventType();
}

function updateParticipantModalForEventType() {
  const type = getEventType();
  if (tunnelParticipantFields) tunnelParticipantFields.classList.toggle("hidden", type !== "tunnel");
  if (skydiveParticipantFields) skydiveParticipantFields.classList.toggle("hidden", type !== "skydive");
  if (participantEventTypeBadge) {
    if (participantEventTypeBadge) participantEventTypeBadge.textContent = type === "tunnel" ? "TUNNEL" : "SKYDIVE";
    participantEventTypeBadge.className = `status-pill event-type-${type}`;
  }

  if (coachTicketsPaymentRow) {
    coachTicketsPaymentRow.classList.toggle("hidden", type === "tunnel");
  }

  if (type === "tunnel") {
    modalCoachPaid.value = "0";
    modalCoachTotal.value = "0";
    updatePaymentCalculations();
  }
  if (eventLogbookSection) {
    eventLogbookSection.classList.toggle("hidden", type !== "skydive");
  }

  if (eventVenueTypeInput && !currentEventId) {
    eventVenueTypeInput.value = type === "tunnel" ? "tunnel" : "dropzone";
  }
  updateEventVenueFields();
}



function updateEventVenueFields() {
  const venueType = eventVenueTypeInput?.value || (getEventType() === "tunnel" ? "tunnel" : "dropzone");

  dropzoneTicketPriceField?.classList.toggle("hidden", venueType !== "dropzone");
  tunnelTimeCostField?.classList.toggle("hidden", venueType !== "tunnel");
}

document.querySelectorAll('input[name="eventType"]').forEach(radio => {
  radio.addEventListener("change", updateParticipantModalForEventType);
});

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

function calculateLeft(total, paid) {
  return Math.max(0, moneyNumber(total) - moneyNumber(paid));
}

function formatMoney(value) {
  return moneyNumber(value).toFixed(2);
}

function updatePaymentCalculations() {
  if (modalPaymentLeft) {
    if (modalPaymentLeft) modalPaymentLeft.textContent = formatMoney(calculateLeft(modalPaymentTotal.value, modalPaymentPaid.value));
  }
  if (modalCoachLeft) {
    if (modalCoachLeft) modalCoachLeft.textContent = formatMoney(calculateLeft(modalCoachTotal.value, modalCoachPaid.value));
  }
}

[modalPaymentTotal, modalPaymentPaid, modalCoachTotal, modalCoachPaid].forEach(input => {
  input?.addEventListener("input", updatePaymentCalculations);
});


function setEventLogbookStatus(message = "", isError = false) {
  if (!eventLogbookStatus) return;
  if (!eventLogbookStatus) return;
  eventLogbookStatus.textContent = message;
  eventLogbookStatus.classList.toggle("hidden", !message);
  eventLogbookStatus.classList.toggle("error", isError);
}

function getParticipantOptions() {
  return [...participantsList.querySelectorAll(".participant-row")]
    .map(row => ({
      participant_id: row.querySelector(".participant-id")?.value || "",
      name: row.querySelector(".participant-name")?.value.trim() || ""
    }))
    .filter(p => p.participant_id && p.name);
}

function getParticipantNameById(participantId) {
  return getParticipantOptions().find(p => p.participant_id === participantId)?.name || "Participant";
}

function selectedParticipantIds(card) {
  return [...card.querySelectorAll(".logbook-participant-box.is-selected")]
    .map(box => box.dataset.participantId)
    .filter(Boolean);
}

function participantIdsUsedByOtherGroups(card, groupContainer) {
  if (!groupContainer) return new Set();

  const used = new Set();

  [...groupContainer.querySelectorAll(".logbook-group-card")].forEach(otherCard => {
    if (otherCard === card) return;

    selectedParticipantIds(otherCard).forEach(id => used.add(id));
  });

  return used;
}

function renderGroupParticipantBoxes(card, selectedParticipants = [], groupContainer = null) {
  const container = card.querySelector(".logbook-participant-boxes");
  if (!container) return;

  const selectedIds = new Set(
    (selectedParticipants || []).map(person => person.participant_id || person)
  );

  const usedByOtherGroups = participantIdsUsedByOtherGroups(card, groupContainer);
  const participants = getParticipantOptions()
    .filter(person =>
      selectedIds.has(person.participant_id) ||
      !usedByOtherGroups.has(person.participant_id)
    );

  container.innerHTML = "";

  if (!participants.length) {
    container.innerHTML = '<p class="muted small-text">All participants are already assigned to another group in this load.</p>';
    return;
  }

  participants.forEach(person => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "logbook-participant-box";
    button.dataset.participantId = person.participant_id;
    button.textContent = person.name;

    if (selectedIds.has(person.participant_id)) {
      button.classList.add("is-selected");
      button.setAttribute("aria-pressed", "true");
    } else {
      button.setAttribute("aria-pressed", "false");
    }

    button.addEventListener("click", () => {
      const selected = button.classList.toggle("is-selected");
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    container.appendChild(button);
  });
}

function eventDateOptions() {
  const startInput = document.getElementById("startDateInput");
  const endInput = document.getElementById("endDateInput");

  const start = startInput?.value || currentEventStartDate || "";
  const end = endInput?.value || currentEventEndDate || "";

  if (!start || !end) return [];

  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);

  if (![sy, sm, sd, ey, em, ed].every(Number.isFinite)) return [];

  const current = new Date(Date.UTC(sy, sm - 1, sd));
  const last = new Date(Date.UTC(ey, em - 1, ed));

  if (current > last) return [];

  const dates = [];
  let dayIndex = 0;

  while (current <= last) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, "0");
    const day = String(current.getUTCDate()).padStart(2, "0");
    const value = `${year}-${month}-${day}`;

    const shortYear = String(year).slice(-2);
    const dateLabel = `${day}/${month}/${shortYear}`;

    dates.push({
      value,
      dayIndex,
      dateLabel,
      label: `Day ${dayIndex} - ${dateLabel}`
    });

    dayIndex += 1;
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function formatLogbookDayLabel(value) {
  const option = eventDateOptions().find(item => item.value === value);
  return option?.dateLabel || value || "";
}

function logbookDayNumberForDate(value) {
  const option = eventDateOptions().find(item => item.value === value);
  return Number.isInteger(option?.dayIndex) ? option.dayIndex : 0;
}

function usedLogbookDayDates() {
  return [...eventLogbookDays.querySelectorAll(".logbook-day-date")]
    .map(input => input.value)
    .filter(Boolean);
}

function refreshNewLogbookDaySelect() {
  if (!newLogbookDaySelect) return;

  const usedDates = usedLogbookDayDates().sort();
  const used = new Set(usedDates);
  const previousValue = newLogbookDaySelect.value;

  const availableDates = eventDateOptions()
    .filter(item => !used.has(item.value));

  newLogbookDaySelect.innerHTML = "";

  if (!availableDates.length) {
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "No available event dates";
    newLogbookDaySelect.appendChild(emptyOption);
    newLogbookDaySelect.value = "";
    return;
  }

  availableDates.forEach(item => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    newLogbookDaySelect.appendChild(option);
  });

  // Default suggestion:
  // choose the first available event date AFTER the latest date already added.
  // If no days exist yet, use the first event date (Day 0).
  let suggestedValue = availableDates[0].value;

  if (usedDates.length) {
    const latestUsedDate = usedDates[usedDates.length - 1];
    const followingDate = availableDates.find(item => item.value > latestUsedDate);
    if (followingDate) suggestedValue = followingDate.value;
  }

  // Keep an intentional current selection while the user is interacting,
  // otherwise move automatically to the logical next day.
  const previousStillAvailable = availableDates.some(item => item.value === previousValue);
  const previousIsAfterLatest = usedDates.length
    ? previousValue > usedDates[usedDates.length - 1]
    : Boolean(previousValue);

  newLogbookDaySelect.value = previousStillAvailable && previousIsAfterLatest
    ? previousValue
    : suggestedValue;
}

function updateDayTitles() {
  const dayCards = [...eventLogbookDays.querySelectorAll(".logbook-day-card")];

  dayCards.sort((a, b) => {
    const dateA = a.querySelector(".logbook-day-date")?.value || "";
    const dateB = b.querySelector(".logbook-day-date")?.value || "";
    return dateA.localeCompare(dateB);
  });

  dayCards.forEach(card => eventLogbookDays.appendChild(card));

  dayCards.forEach(card => {
    const dateInput = card.querySelector(".logbook-day-date");
    const title = card.querySelector(".logbook-day-title");
    const displayTitle = card.querySelector(".logbook-day-display-title");
    const displayDate = card.querySelector(".logbook-day-display-date");

    const dateValue = dateInput?.value || "";
    const dayNumber = logbookDayNumberForDate(dateValue);
    const generatedTitle = `Day ${dayNumber}`;

    // Explicit visual ordering prevents any later DOM append/render from
    // showing the cards out of chronological order.
    card.style.order = String(dayNumber);
    card.dataset.dayOrder = String(dayNumber);

    if (title) title.value = generatedTitle;
    if (displayTitle) {
      const formattedDate = formatLogbookDayLabel(dateValue);
      displayTitle.textContent = formattedDate
        ? `${generatedTitle} - ${formattedDate}`
        : generatedTitle;
    }
    if (displayDate) displayDate.textContent = "";
  });

  refreshNewLogbookDaySelect();
}

function renumberGroupTitles(groupContainer) {
  [...groupContainer.querySelectorAll(".logbook-group-card")].forEach((card, index) => {
    const title = card.querySelector(".logbook-group-title");
    const summaryNumber = card.querySelector(".logbook-group-summary-number");

    if (title) title.textContent = `Group ${index + 1}`;
    if (summaryNumber) summaryNumber.textContent = String(index + 1);
  });
}

function addLogbookGroup(groupContainer, data = {}) {
  const fragment = logbookGroupTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".logbook-group-card");

  const editor = card.querySelector(".logbook-group-editor");
  const summary = card.querySelector(".logbook-group-summary");
  const coach = card.querySelector(".logbook-group-coach");
  const type = card.querySelector(".logbook-group-type");
  const confirmButton = card.querySelector(".confirm-group-button");

  coach.value = data.coach_name || "";
  type.value = data.jump_type || "";

  const initialParticipants = data.participants || [];
  renderGroupParticipantBoxes(card, initialParticipants, groupContainer);

  const currentSelectedParticipants = () =>
    selectedParticipantIds(card).map(participant_id => ({
      participant_id,
      display_name: getParticipantNameById(participant_id)
    }));

  const refreshOtherGroupSelections = () => {
    [...groupContainer.querySelectorAll(".logbook-group-card")].forEach(otherCard => {
      if (otherCard === card) return;

      const otherSelected = selectedParticipantIds(otherCard).map(participant_id => ({
        participant_id,
        display_name: getParticipantNameById(participant_id)
      }));

      renderGroupParticipantBoxes(otherCard, otherSelected, groupContainer);
    });
  };

  const removeCard = async () => {
    card.remove();
    renumberGroupTitles(groupContainer);

    // Removing a group makes its jumpers available to the other groups again.
    [...groupContainer.querySelectorAll(".logbook-group-card")].forEach(otherCard => {
      const otherSelected = selectedParticipantIds(otherCard).map(participant_id => ({
        participant_id,
        display_name: getParticipantNameById(participant_id)
      }));
      renderGroupParticipantBoxes(otherCard, otherSelected, groupContainer);
    });

    await persistEventLogbook("Group removed.");
  };

  const updateCompactSummary = () => {
    const groupIndex =
      [...groupContainer.querySelectorAll(".logbook-group-card")].indexOf(card) + 1;

    const selectedIds = selectedParticipantIds(card);
    const names = selectedIds.map(getParticipantNameById);

    card.querySelector(".logbook-group-summary-number").textContent =
      String(groupIndex);

    card.querySelector(".logbook-group-summary-coach").textContent =
      coach.value || "-";

    card.querySelector(".logbook-group-summary-participants").textContent =
      names.join(", ");
  };

  const showSummary = () => {
    updateCompactSummary();
    editor.classList.add("hidden");
    summary.classList.remove("hidden");
    card.classList.add("is-confirmed");
  };

  const showEditor = () => {
    const ownSelected = currentSelectedParticipants();

    // Rebuild the choices every time Edit is opened so any jumper already
    // assigned to another group in this load is not shown.
    renderGroupParticipantBoxes(card, ownSelected, groupContainer);

    summary.classList.add("hidden");
    editor.classList.remove("hidden");
    card.classList.remove("is-confirmed");
  };

  confirmButton.addEventListener("click", async () => {
    const selected = selectedParticipantIds(card);

    if (!selected.length) {
      setEventLogbookStatus("Choose at least one participant for the group.", true);
      return;
    }

    // Guard against duplicates even if two group editors were open at once.
    const usedElsewhere = participantIdsUsedByOtherGroups(card, groupContainer);
    const duplicate = selected.find(id => usedElsewhere.has(id));

    if (duplicate) {
      setEventLogbookStatus(
        `${getParticipantNameById(duplicate)} is already assigned to another group in this load.`,
        true
      );
      showEditor();
      return;
    }

    showSummary();
    refreshOtherGroupSelections();

    const saved = await persistEventLogbook("Group saved.");
    if (!saved) {
      showEditor();
    }
  });

  card.querySelector(".edit-group-button").addEventListener("click", showEditor);
  card.querySelector(".remove-group-button").addEventListener("click", removeCard);
  card.querySelector(".remove-group-summary-button").addEventListener("click", removeCard);

  groupContainer.appendChild(fragment);
  renumberGroupTitles(groupContainer);

  // Saved groups appear as compact summaries.
  if (data.group_id || initialParticipants.length) {
    showSummary();
  }
}

function nextLoadNumber(loadsContainer) {
  const numbers = [...loadsContainer.querySelectorAll(".logbook-load-number")]
    .map(input => Number(input.value))
    .filter(value => Number.isFinite(value) && value > 0);

  return numbers.length ? Math.max(...numbers) + 1 : 1;
}


function shouldIgnoreLogbookHeaderToggle(event) {
  return Boolean(event.target.closest(
    "button, input, select, textarea, a, label"
  ));
}

function setDayCollapsed(card, collapsed) {
  card.classList.toggle("is-collapsed", collapsed);
  const button = card.querySelector(".collapse-day-button");
  if (button) {
    button.textContent = collapsed ? "⌄" : "⌃";
    button.setAttribute("aria-label", collapsed ? "Expand day" : "Collapse day");
    button.title = collapsed ? "Expand day" : "Collapse day";
  }
}

function setLoadCollapsed(card, collapsed) {
  card.classList.toggle("is-collapsed", collapsed);
  const button = card.querySelector(".collapse-load-button");
  if (button) {
    button.textContent = collapsed ? "⌄" : "⌃";
    button.setAttribute("aria-label", collapsed ? "Expand load" : "Collapse load");
    button.title = collapsed ? "Expand load" : "Collapse load";
  }
}

function addLogbookLoad(loadsContainer, data = {}, collapseOnCreate = false) {
  const nextNumber = data.load_number ?? nextLoadNumber(loadsContainer);

  const fragment = logbookLoadTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".logbook-load-card");
  const numberInput = card.querySelector(".logbook-load-number");
  const groups = card.querySelector(".logbook-groups");

  loadsContainer.appendChild(fragment);

  // Set both property and attribute after insertion so the visible field
  // always shows the default number.
  numberInput.value = String(nextNumber);
  numberInput.setAttribute("value", String(nextNumber));

  card.querySelector(".add-group-button").addEventListener("click", () => {
    // A new group is only persisted after the yellow "+ Add group" confirmation.
    addLogbookGroup(groups);
  });

  const loadHeader = card.querySelector(".logbook-load-header");
  const loadCollapseButton = card.querySelector(".collapse-load-button");

  const toggleLoad = () => {
    setLoadCollapsed(card, !card.classList.contains("is-collapsed"));
  };

  loadCollapseButton?.addEventListener("click", event => {
    event.stopPropagation();
    toggleLoad();
  });

  loadHeader?.addEventListener("click", event => {
    if (shouldIgnoreLogbookHeaderToggle(event)) return;
    toggleLoad();
  });

  // Existing loads open collapsed when entering an event.
  // A newly-added load stays open so it can be edited immediately.
  if (collapseOnCreate) {
    setLoadCollapsed(card, true);
  }

  card.querySelector(".remove-load-button").addEventListener("click", async () => {
    card.remove();
    await persistEventLogbook("Load removed.");
  });

  numberInput.addEventListener("change", async () => {
    await persistEventLogbook("Load number saved.");
  });

  numberInput.addEventListener("blur", async () => {
    await persistEventLogbook("Load number saved.");
  });

  (data.groups || []).forEach(group => addLogbookGroup(groups, group));
}

function addLogbookDay(data = {}) {
  const dayDate = data.day_date || "";
  if (!dayDate) return;

  if (usedLogbookDayDates().includes(dayDate)) {
    setEventLogbookStatus("This day is already in the logbook.", true);
    return;
  }

  const fragment = logbookDayTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".logbook-day-card");
  const dateInput = card.querySelector(".logbook-day-date");
  const titleInput = card.querySelector(".logbook-day-title");
  const loads = card.querySelector(".logbook-loads");

  dateInput.value = dayDate;
  if (titleInput) titleInput.value = data.title || "";

  card.querySelector(".add-load-button").addEventListener("click", async () => {
    addLogbookLoad(loads);
    await persistEventLogbook("Load added.");
  });

  const dayHeader = card.querySelector(".logbook-day-header");
  const dayCollapseButton = card.querySelector(".collapse-day-button");

  const toggleDay = () => {
    setDayCollapsed(card, !card.classList.contains("is-collapsed"));
  };

  dayCollapseButton?.addEventListener("click", event => {
    event.stopPropagation();
    toggleDay();
  });

  dayHeader?.addEventListener("click", event => {
    if (shouldIgnoreLogbookHeaderToggle(event)) return;
    toggleDay();
  });

  card.querySelector(".remove-day-button").addEventListener("click", async () => {
    card.remove();
    updateDayTitles();
    await persistEventLogbook("Day removed.");
  });

  (data.loads || []).forEach(load => addLogbookLoad(loads, load, true));

  eventLogbookDays.appendChild(fragment);
  updateDayTitles();
}

function collectEventLogbookFromEditor() {
  const days = [];

  [...eventLogbookDays.querySelectorAll(".logbook-day-card")].forEach(dayCard => {
    const day = {
      day_date: dayCard.querySelector(".logbook-day-date").value || null,
      title: dayCard.querySelector(".logbook-day-title")?.value.trim() || null,
      loads: []
    };

    [...dayCard.querySelectorAll(".logbook-load-card")].forEach(loadCard => {
      const load = {
        load_number: Number(loadCard.querySelector(".logbook-load-number").value) || null,
        groups: []
      };

      [...loadCard.querySelectorAll(".logbook-group-card")].forEach(groupCard => {
        const participantIds = selectedParticipantIds(groupCard);

        load.groups.push({
          coach_name: groupCard.querySelector(".logbook-group-coach").value || null,
          jump_type: groupCard.querySelector(".logbook-group-type").value.trim() || null,
          participant_ids: participantIds
        });
      });

      day.loads.push(load);
    });

    days.push(day);
  });

  return days;
}

function validateEventLogbook(days) {
  for (const day of days) {
    if (!day.day_date) return "Each logbook day needs a date.";

    let lastLoad = null;
    for (const load of day.loads) {
      if (!load.load_number || load.load_number < 1) {
        return "Each load needs a positive load number.";
      }
      if (lastLoad !== null && load.load_number <= lastLoad) {
        return `Load numbers must increase within each day. ${load.load_number} is not greater than ${lastLoad}.`;
      }
      lastLoad = load.load_number;
    }
  }
  return "";
}

async function loadEventLogbook() {
  if (!currentEventId || getEventType() !== "skydive") {
    if (eventLogbookDays) eventLogbookDays.innerHTML = "";
    return;
  }

  setEventLogbookStatus("Loading logbook…");

  const { data, error } = await client.rpc("admin_get_event_logbook_v25", {
    p_event_id: currentEventId
  });

  if (error) {
    setEventLogbookStatus(`Could not load saved logbook: ${error.message}`, true);
    return;
  }

  let savedDays = data;

  // Some Supabase/PostgREST versions can return JSON as a string.
  if (typeof savedDays === "string") {
    try {
      savedDays = JSON.parse(savedDays);
    } catch {
      savedDays = [];
    }
  }

  if (!Array.isArray(savedDays)) savedDays = [];

  eventLogbookDays.innerHTML = "";

  savedDays.sort((a, b) =>
    String(a?.day_date || "").localeCompare(String(b?.day_date || ""))
  );

  savedDays.forEach(day => addLogbookDay(day));
  updateDayTitles();
  refreshNewLogbookDaySelect();

  setEventLogbookStatus(
    savedDays.length ? `Loaded ${savedDays.length} saved day(s).` : ""
  );

  if (savedDays.length) {
    setTimeout(() => {
      if (eventLogbookStatus?.textContent?.startsWith("Loaded ")) {
        setEventLogbookStatus("");
      }
    }, 1200);
  }
}

async function saveEventLogbook() {
  if (!currentEventId || getEventType() !== "skydive") return;

  const days = collectEventLogbookFromEditor();
  const validation = validateEventLogbook(days);
  if (validation) throw new Error(validation);

  const { data: saveResult, error: saveError } = await client.rpc(
    "admin_replace_event_logbook_v25",
    {
      p_event_id: currentEventId,
      p_logbook: days
    }
  );

  if (saveError) throw saveError;

  const { data: persisted, error: readError } = await client.rpc(
    "admin_get_event_logbook_v25",
    {
      p_event_id: currentEventId
    }
  );

  if (readError) throw readError;

  const expectedDayCount = days.length;
  const persistedDayCount = Array.isArray(persisted) ? persisted.length : 0;

  if (persistedDayCount !== expectedDayCount) {
    throw new Error(
      `The logbook was not saved correctly. Expected ${expectedDayCount} day(s), database returned ${persistedDayCount}.`
    );
  }

  const { error: coachCalcError } = await client.rpc("recalculate_event_coach_ticket_totals_v30", {
    p_event_id: currentEventId
  });

  if (coachCalcError) throw coachCalcError;

  return saveResult;
}


let eventLogbookSaveInProgress = false;

async function persistEventLogbook(message = "Logbook saved.") {
  if (!currentEventId || getEventType() !== "skydive") return false;
  if (eventLogbookSaveInProgress) return false;

  try {
    eventLogbookSaveInProgress = true;
    setEventLogbookStatus("Saving logbook…");
    await saveEventLogbook();
    setEventLogbookStatus(message);
    setTimeout(() => {
      if (eventLogbookStatus?.textContent === message) {
        setEventLogbookStatus("");
      }
    }, 1300);
    return true;
  } catch (error) {
    setEventLogbookStatus(`Could not save logbook: ${error.message}`, true);
    return false;
  } finally {
    eventLogbookSaveInProgress = false;
  }
}


function formatDateForExport(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${String(year).slice(-2)}`;
}

function exportEventLogbookToSpreadsheet() {
  const days = collectEventLogbookFromEditor();

  if (!days.length) {
    setEventLogbookStatus("There is no logbook data to export.", true);
    return;
  }

  const rows = [];
  const headers = [
    "Day",
    "Date",
    "Load",
    "Group",
    "Coach",
    "Coached jump",
    "Jump type / notes",
    "Participant"
  ];

  days.forEach((day, dayIndex) => {
    day.loads.forEach(load => {
      load.groups.forEach((group, groupIndex) => {
        const coach = group.coach_name || "";
        const participantIds = group.participant_ids || [];

        if (!participantIds.length) {
          rows.push([
            day.title || `Day ${dayIndex + 1}`,
            formatDateForExport(day.day_date),
            load.load_number ?? "",
            groupIndex + 1,
            coach,
            coach ? "Yes" : "No",
            group.jump_type || "",
            ""
          ]);
          return;
        }

        participantIds.forEach(participantId => {
          rows.push([
            day.title || `Day ${dayIndex + 1}`,
            formatDateForExport(day.day_date),
            load.load_number ?? "",
            groupIndex + 1,
            coach,
            coach ? "Yes" : "No",
            group.jump_type || "",
            getParticipantNameById(participantId)
          ]);
        });
      });
    });
  });

  const csvEscape = value => `"${String(value ?? "").replaceAll('"', '""')}"`;

  const csv = "\ufeff" + [headers, ...rows]
    .map(row => row.map(csvEscape).join(","))
    .join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const eventName = document.getElementById("eventNameInput").value.trim() || "SHAKSHUKA_event";
  const safeName = eventName.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");

  link.href = url;
  link.download = `${safeName}_logbook.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  setEventLogbookStatus("Logbook spreadsheet exported.");
  setTimeout(() => setEventLogbookStatus(""), 2200);
}



exportLogbookButton?.addEventListener("click", exportEventLogbookToSpreadsheet);


addLogbookDayButton?.addEventListener("click", async () => {
  const selectedDate = newLogbookDaySelect?.value || "";
  if (!selectedDate) {
    setEventLogbookStatus("Choose a day first.", true);
    return;
  }

  addLogbookDay({ day_date: selectedDate });
  refreshNewLogbookDaySelect();
  await persistEventLogbook("Day added.");
});

function resetEventForm() {
  currentEventId = null;
  currentEventStartDate = "";
  currentEventEndDate = "";
  removedMembershipIds = [];
  document.getElementById("eventForm").reset();
  setEventType("skydive");
  participantsList.innerHTML = "";
  if (eventLogbookDays) eventLogbookDays.innerHTML = "";
  if (adminQuestItems) adminQuestItems.innerHTML = "";
  setAdminQuestsStatus("");
  refreshNewLogbookDaySelect();
  updateParticipantCount();
  renderLocationOptions("");
  if (venueSelect) venueSelect.value = "";
  renderSelectedVenue();
  hideVenueForm();
  setStatus(editorStatus, "");

  if (landingCompetitionInfoInput) landingCompetitionInfoInput.value = "";
  if (socialMediaCompetitionInfoInput) socialMediaCompetitionInfoInput.value = "";
  setTextById("editorTitle", "Create Travel Event");
  hideNewLocationForm();
}

async function openEventEditor(eventId = null, { updateUrl = true } = {}) {
  resetEventForm();
  showView("editor");

  if (!eventId) {
    if (updateUrl) setAdminEventUrl("");
    return;
  }

  currentEventId = eventId;
  if (updateUrl) setAdminEventUrl(eventId);

  setTextById("editorTitle", "Edit Travel Event");
  setStatus(editorStatus, "Loading event…");

  const { data: event, error: eventError } = await client
    .from("events")
    .select("id,name,start_date,end_date,event_type,location_id,venue_id,venue,venue_type,venue_url,additional_location_info,description,status,ticket_price,tunnel_time_cost,event_price,landing_competition_info,social_media_competition_info")
    .eq("id", eventId)
    .single();

  if (eventError) {
    setStatus(editorStatus, eventError.message, true);
    return;
  }

  document.getElementById("eventNameInput").value = event.name || "";
  currentEventStartDate = event.start_date || "";
  currentEventEndDate = event.end_date || "";
  document.getElementById("startDateInput").value = currentEventStartDate;
  document.getElementById("endDateInput").value = currentEventEndDate;
  refreshNewLogbookDaySelect();
  renderLocationOptions(event.location_id || "");
  document.getElementById("venueInput").value = event.venue || "";
document.getElementById("descriptionInput").value = event.description || "";
  if (landingCompetitionInfoInput) landingCompetitionInfoInput.value = event.landing_competition_info || "";
  if (socialMediaCompetitionInfoInput) socialMediaCompetitionInfoInput.value = event.social_media_competition_info || "";
  document.getElementById("eventPriceInput").value = event.event_price ?? "";
  if (venueSelect) {
    renderVenueOptions(event.venue_id || "");
  }

  if (event.venue_id) {
    renderSelectedVenue();
  } else {
    // Backward compatibility for events created before saved venues existed.
    if (eventVenueTypeInput) eventVenueTypeInput.value = event.venue_type || (event.event_type === "tunnel" ? "tunnel" : "dropzone");
    document.getElementById("venueInput").value = event.venue || "";
    if (venueUrlInput) venueUrlInput.value = event.venue_url || "";
    if (ticketPriceInput) ticketPriceInput.value = event.ticket_price ?? "";
    if (tunnelTimeCostInput) tunnelTimeCostInput.value = event.tunnel_time_cost ?? "";
    selectedVenueDetails?.classList.toggle("hidden", !event.venue);
    updateEventVenueFields();
  }
  setEventType(event.event_type || "skydive");

  const { data: memberships, error: membershipError } = await client
    .from("event_participants")
    .select(`
      id,
      participant_id,
      flight_done,
      insurance_done,
      passport_done,
      jersey_done,
      license_text,
      reserve_date,
      last_jump_date,
      number_of_jumps,
      tunnel_minutes_total,
      canopy_size,
      water_training_done,
      canopy_course_done,
      payment_paid,
      payment_total,
      payment_notes,
      coach_tickets_paid,
      coach_tickets_total,
      participants(id,display_name,phone,email,notes)
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (membershipError) {
    setStatus(editorStatus, membershipError.message, true);
    return;
  }

  participantsList.innerHTML = "";
  (memberships || []).forEach(membership => {
    const participant = membership.participants || {};
    addParticipantRow({
      name: participant.display_name,
      phone: participant.phone,
      email: participant.email,
      participantId: participant.id,
      membershipId: membership.id,
      notes: participant.notes,
      flightDone: membership.flight_done,
      insuranceDone: membership.insurance_done,
      passportDone: membership.passport_done,
      jerseyDone: membership.jersey_done,
      licenseText: membership.license_text,
      reserveDate: membership.reserve_date,
      lastJumpDate: membership.last_jump_date,
      numberJumps: membership.number_of_jumps,
      tunnelMinutes: membership.tunnel_minutes_total,
      canopySize: membership.canopy_size,
      waterTrainingDone: membership.water_training_done,
      canopyCourseDone: membership.canopy_course_done,
      paymentPaid: membership.payment_paid,
      paymentTotal: membership.payment_total,
      paymentNotes: membership.payment_notes,
      coachPaid: membership.coach_tickets_paid,
      coachTotal: membership.coach_tickets_total
    });
  });

  await Promise.all([
    loadEventLogbook(),
    loadAdminSchedule(),
    loadAdminRooms(),
    loadAdminTransportation(),
    loadAdminCanopyTraining(),
    loadAdminQuests(),
    loadCompetitionPlacements(),
    loadAdminBeerFines()
  ]);
  setStatus(editorStatus, "");
}

document.getElementById("newEventButton").addEventListener("click", () => openEventEditor());
document.getElementById("backToDashboard").addEventListener("click", async () => {
  setAdminEventUrl("");
  showView("dashboard");
  await loadAdminEvents();
});

// Use one permanent click handler for event cards.
// This keeps Edit working even after the event list is re-rendered.
eventsEl.addEventListener("click", async (event) => {
  const editButton = event.target.closest(".edit-event-button");
  if (!editButton) return;

  const eventId = editButton.dataset.eventId;
  if (!eventId) {
    setStatus(dashboardStatus, "Could not open event: missing event ID.", true);
    return;
  }

  editButton.disabled = true;
  const originalText = editButton.textContent;
  editButton.textContent = "Opening…";

  try {
    await openEventEditor(eventId);
  } catch (error) {
    showView("dashboard");
    setStatus(dashboardStatus, `Could not open event: ${error.message}`, true);
  } finally {
    editButton.disabled = false;
    editButton.textContent = originalText;
  }
});

function boolString(value) {
  return value === true || value === "true" ? "true" : "false";
}

function updateParticipantSummary(row) {
  const name = row.querySelector(".participant-name").value.trim() || "New participant";
  const phone = row.querySelector(".participant-phone").value.trim();
  const summaryName = row.querySelector(".participant-summary-name");
  const summaryPhone = row.querySelector(".participant-summary-phone");
  if (summaryName) summaryName.textContent = name;
  if (summaryPhone) summaryPhone.textContent = phone;
}

async function openParticipantModal(row) {
  editingParticipantRow = row;
  modalParticipantName.value = row.querySelector(".participant-name").value;
  modalParticipantPhone.value = row.querySelector(".participant-phone").value;
  modalParticipantEmail.value = row.querySelector(".participant-email").value;
  modalParticipantNotes.value = row.querySelector(".participant-notes").value;

  modalFlightDone.checked = row.querySelector(".participant-flight").value === "true";
  modalInsuranceDone.checked = row.querySelector(".participant-insurance").value === "true";
  modalPassportDone.checked = row.querySelector(".participant-passport").value === "true";
  modalJerseyDone.checked = row.querySelector(".participant-jersey").value === "true";
  modalLicenseText.value = row.querySelector(".participant-license-text").value;
  modalReserveDate.value = row.querySelector(".participant-reserve-date").value;
  modalLastJumpDate.value = row.querySelector(".participant-last-jump-date").value;
  modalNumberJumps.value = row.querySelector(".participant-number-jumps").value;
  modalCanopySize.value = row.querySelector(".participant-canopy-size").value;
  modalWaterTrainingDone.checked = row.querySelector(".participant-water-training").value === "true";
  modalCanopyCourseDone.checked = row.querySelector(".participant-canopy-course").value === "true";

  modalPaymentPaid.value = row.querySelector(".participant-payment-paid").value || "0";
  modalPaymentTotal.value = row.querySelector(".participant-payment-total").value || "0";
  if (modalPaymentNotes) modalPaymentNotes.value = row.querySelector(".participant-payment-notes")?.value || "";
  modalCoachPaid.value = row.querySelector(".participant-coach-paid").value || "0";
  modalCoachTotal.value = row.querySelector(".participant-coach-total").value || "0";
  updatePaymentCalculations();

  const time = splitMinutes(row.querySelector(".participant-tunnel-minutes").value);
  modalTunnelHours.value = time.hours || "";
  modalTunnelMinutes.value = time.minutes || "";
  modalSkydiveTunnelHours.value = time.hours || "";
  modalSkydiveTunnelMinutes.value = time.minutes || "";
updateParticipantModalForEventType();
  participantModal.classList.remove("hidden");
  setTimeout(() => modalParticipantName.focus(), 0);
}

function closeParticipantModal() {
  participantModal.classList.add("hidden");
  editingParticipantRow = null;
}

function addParticipantRow(data = {}, openImmediately = false) {
  const fragment = participantTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".participant-row");
  row.querySelector(".participant-name").value = data.name || "";
  row.querySelector(".participant-phone").value = data.phone || "";
  row.querySelector(".participant-email").value = data.email || "";
  row.querySelector(".participant-notes").value = data.notes || "";
  row.querySelector(".participant-flight").value = boolString(data.flightDone);
  row.querySelector(".participant-insurance").value = boolString(data.insuranceDone);
  row.querySelector(".participant-passport").value = boolString(data.passportDone);
  row.querySelector(".participant-jersey").value = boolString(data.jerseyDone);
  row.querySelector(".participant-license-text").value = data.licenseText || "";
  row.querySelector(".participant-reserve-date").value = data.reserveDate || "";
  row.querySelector(".participant-last-jump-date").value = data.lastJumpDate || "";
  row.querySelector(".participant-number-jumps").value = data.numberJumps ?? "";
  row.querySelector(".participant-tunnel-minutes").value = data.tunnelMinutes ?? 0;
  row.querySelector(".participant-canopy-size").value = data.canopySize ?? "";
  row.querySelector(".participant-water-training").value = boolString(data.waterTrainingDone);
  row.querySelector(".participant-canopy-course").value = boolString(data.canopyCourseDone);
  row.querySelector(".participant-payment-paid").value = moneyNumber(data.paymentPaid);
  row.querySelector(".participant-payment-total").value = moneyNumber(data.paymentTotal);
  row.querySelector(".participant-payment-notes").value = data.paymentNotes || "";
  row.querySelector(".participant-coach-paid").value = moneyNumber(data.coachPaid);
  row.querySelector(".participant-coach-total").value = moneyNumber(data.coachTotal);
row.querySelector(".participant-id").value = data.participantId || "";
  row.querySelector(".membership-id").value = data.membershipId || "";

  row.querySelector(".edit-participant").addEventListener("click", () => openParticipantModal(row));
  row.querySelector(".participant-expand").addEventListener("click", () => openParticipantModal(row));
  row.querySelector(".remove-participant").addEventListener("click", () => {
    const membershipId = row.querySelector(".membership-id").value;
    if (membershipId) removedMembershipIds.push(membershipId);
    row.remove();
    updateParticipantCount();
  });

  participantsList.appendChild(fragment);
  updateParticipantSummary(row);
  updateParticipantCount();
  if (openImmediately) openParticipantModal(row);
}

document.getElementById("addParticipantButton").addEventListener("click", () => addParticipantRow({}, true));

document.getElementById("closeParticipantModal").addEventListener("click", closeParticipantModal);
document.getElementById("cancelParticipantEdit").addEventListener("click", closeParticipantModal);
participantModal.addEventListener("click", event => {
  if (event.target === participantModal) closeParticipantModal();
});

document.getElementById("acceptParticipantEdit").addEventListener("click", () => {
  if (!editingParticipantRow) return;
  const name = modalParticipantName.value.trim();
  const phone = modalParticipantPhone.value.trim();
  if (!name || !phone) {
    setStatus(editorStatus, "Participant name and phone are required.", true);
    return;
  }

  editingParticipantRow.querySelector(".participant-name").value = name;
  editingParticipantRow.querySelector(".participant-phone").value = phone;
  editingParticipantRow.querySelector(".participant-email").value = modalParticipantEmail.value.trim();
  editingParticipantRow.querySelector(".participant-notes").value = modalParticipantNotes.value.trim();
  editingParticipantRow.querySelector(".participant-flight").value = boolString(modalFlightDone.checked);
  editingParticipantRow.querySelector(".participant-insurance").value = boolString(modalInsuranceDone.checked);
  editingParticipantRow.querySelector(".participant-passport").value = boolString(modalPassportDone.checked);
  editingParticipantRow.querySelector(".participant-jersey").value = boolString(modalJerseyDone.checked);
  editingParticipantRow.querySelector(".participant-license-text").value = modalLicenseText.value.trim();
  editingParticipantRow.querySelector(".participant-reserve-date").value = modalReserveDate.value;
  editingParticipantRow.querySelector(".participant-last-jump-date").value = modalLastJumpDate.value;
  editingParticipantRow.querySelector(".participant-number-jumps").value = modalNumberJumps.value;
  editingParticipantRow.querySelector(".participant-canopy-size").value = modalCanopySize.value;
  editingParticipantRow.querySelector(".participant-water-training").value = boolString(modalWaterTrainingDone.checked);
  editingParticipantRow.querySelector(".participant-canopy-course").value = boolString(modalCanopyCourseDone.checked);
  editingParticipantRow.querySelector(".participant-payment-paid").value = moneyNumber(modalPaymentPaid.value);
  editingParticipantRow.querySelector(".participant-payment-total").value = moneyNumber(modalPaymentTotal.value);
  editingParticipantRow.querySelector(".participant-payment-notes").value = modalPaymentNotes?.value.trim() || "";
  editingParticipantRow.querySelector(".participant-coach-paid").value =
    getEventType() === "tunnel" ? 0 : moneyNumber(modalCoachPaid.value);
  editingParticipantRow.querySelector(".participant-coach-total").value =
    getEventType() === "tunnel" ? 0 : moneyNumber(modalCoachTotal.value);
const tunnelMinutesTotal = getEventType() === "tunnel"
    ? combineMinutes(modalTunnelHours.value, modalTunnelMinutes.value)
    : combineMinutes(modalSkydiveTunnelHours.value, modalSkydiveTunnelMinutes.value);
  editingParticipantRow.querySelector(".participant-tunnel-minutes").value = tunnelMinutesTotal;
  updateParticipantSummary(editingParticipantRow);
  setStatus(editorStatus, "");
  closeParticipantModal();
});

function updateParticipantCount() {
  const rows = [...participantsList.querySelectorAll(".participant-row")];
  setTextById("participantCount", rows.length);
}

function showNewLocationForm(mode = "new") {
  const box = document.getElementById("newLocationBox");
  box.classList.remove("hidden");
  editingLocationId = mode === "edit" ? locationSelect.value : null;

  const deleteButton = document.getElementById("deleteLocationButton");
  if (editingLocationId) {
    const location = locations.find(item => item.id === editingLocationId);
    if (!location) return;
    setTextById("locationFormTitle", "Edit living location");
    document.getElementById("locationNameInput").value = location.name || "";
    document.getElementById("locationCountryInput").value = location.country || "";
    document.getElementById("locationCityInput").value = location.city || "";
    document.getElementById("locationTypeInput").value = location.location_type || "hotel";
    document.getElementById("locationWebsiteInput").value = location.website_url || "";
    document.getElementById("locationAddressInput").value = location.address || "";
    deleteButton.classList.remove("hidden");
  } else {
    setTextById("locationFormTitle", "Add living location");
    ["locationNameInput", "locationCountryInput", "locationCityInput", "locationAddressInput", "locationWebsiteInput"]
      .forEach(id => document.getElementById(id).value = "");
    document.getElementById("locationTypeInput").value = "hotel";
    deleteButton.classList.add("hidden");
  }
}

function hideNewLocationForm() {
  document.getElementById("newLocationBox").classList.add("hidden");
  editingLocationId = null;
  ["locationNameInput", "locationCountryInput", "locationCityInput", "locationAddressInput", "locationWebsiteInput"]
    .forEach(id => document.getElementById(id).value = "");
  document.getElementById("locationTypeInput").value = "hotel";
  document.getElementById("deleteLocationButton").classList.add("hidden");
}

document.getElementById("showLocationFormButton").addEventListener("click", () => showNewLocationForm("new"));
document.getElementById("editLocationButton").addEventListener("click", () => {
  if (!locationSelect.value) {
    setStatus(editorStatus, "Select a location first, then click Edit.", true);
    return;
  }
  showNewLocationForm("edit");
});
document.getElementById("clearLocationButton").addEventListener("click", () => {
  locationSelect.value = "";
  hideNewLocationForm();
  setStatus(editorStatus, "Location removed from this event. Save the event to keep the change.");
});
document.getElementById("cancelLocationButton").addEventListener("click", hideNewLocationForm);

document.getElementById("saveLocationButton").addEventListener("click", async () => {
  const name = document.getElementById("locationNameInput").value.trim();
  if (!name) {
    setStatus(editorStatus, "Living location name is required.", true);
    return;
  }

  const payload = {
    name,
    country: document.getElementById("locationCountryInput").value.trim() || null,
    city: document.getElementById("locationCityInput").value.trim() || null,
    location_type: document.getElementById("locationTypeInput").value,
    website_url: document.getElementById("locationWebsiteInput").value.trim() || null,
    address: document.getElementById("locationAddressInput").value.trim() || null,
    active: true
  };

  if (editingLocationId) {
    const { data, error } = await client.from("locations").update(payload).eq("id", editingLocationId).select().single();
    if (error) {
      setStatus(editorStatus, `Could not update location: ${error.message}`, true);
      return;
    }
    locations = locations.map(item => item.id === data.id ? data : item);
    renderLocationOptions(data.id);
    setStatus(editorStatus, "Living location updated.");
  } else {
    const { data, error } = await client.from("locations").insert(payload).select().single();
    if (error) {
      setStatus(editorStatus, `Could not add location: ${error.message}`, true);
      return;
    }
    locations.push(data);
    renderLocationOptions(data.id);
    setStatus(editorStatus, "Living location added.");
  }
  hideNewLocationForm();
});

document.getElementById("deleteLocationButton").addEventListener("click", async () => {
  if (!editingLocationId) return;
  const location = locations.find(item => item.id === editingLocationId);
  const label = location?.name || "this location";
  if (!window.confirm(`Delete ${label} from the saved locations list? Existing events using it will keep their reference unless the database prevents deletion.`)) return;

  const { error } = await client.from("locations").delete().eq("id", editingLocationId);
  if (error) {
    // If referenced by an event, soft-hide it instead of losing historical data.
    const { error: deactivateError } = await client.from("locations").update({ active: false }).eq("id", editingLocationId);
    if (deactivateError) {
      setStatus(editorStatus, `Could not remove location: ${deactivateError.message}`, true);
      return;
    }
  }
  locations = locations.filter(item => item.id !== editingLocationId);
  locationSelect.value = "";
  renderLocationOptions("");
  hideNewLocationForm();
  setStatus(editorStatus, "Location removed from the saved list.");
});

function readParticipantRows() {
  return [...participantsList.querySelectorAll(".participant-row")].map(row => ({
    name: row.querySelector(".participant-name").value.trim(),
    phone: row.querySelector(".participant-phone").value.trim(),
    email: row.querySelector(".participant-email").value.trim(),
    notes: row.querySelector(".participant-notes").value.trim(),
    flightDone: row.querySelector(".participant-flight").value === "true",
    insuranceDone: row.querySelector(".participant-insurance").value === "true",
    passportDone: row.querySelector(".participant-passport").value === "true",
    jerseyDone: row.querySelector(".participant-jersey").value === "true",
    licenseText: row.querySelector(".participant-license-text").value.trim(),
    reserveDate: row.querySelector(".participant-reserve-date").value || null,
    lastJumpDate: row.querySelector(".participant-last-jump-date").value || null,
    numberJumps: row.querySelector(".participant-number-jumps").value === "" ? null : Number(row.querySelector(".participant-number-jumps").value),
    tunnelMinutes: Number(row.querySelector(".participant-tunnel-minutes").value) || 0,
    canopySize: row.querySelector(".participant-canopy-size").value === "" ? null : Number(row.querySelector(".participant-canopy-size").value),
    waterTrainingDone: row.querySelector(".participant-water-training").value === "true",
    canopyCourseDone: row.querySelector(".participant-canopy-course").value === "true",
    paymentPaid: moneyNumber(row.querySelector(".participant-payment-paid").value),
    paymentTotal: moneyNumber(row.querySelector(".participant-payment-total").value),
    paymentNotes: row.querySelector(".participant-payment-notes").value.trim(),
    coachPaid: moneyNumber(row.querySelector(".participant-coach-paid").value),
    coachTotal: moneyNumber(row.querySelector(".participant-coach-total").value),
    participantId: row.querySelector(".participant-id").value || null,
    membershipId: row.querySelector(".membership-id").value || null
  }));
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function formatMinutesForExport(totalMinutes) {
  const total = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

function exportParticipantsToSpreadsheet() {
  const participants = readParticipantRows();

  if (!participants.length) {
    setStatus(editorStatus, "There are no participants to export.", true);
    return;
  }

  const eventName = document.getElementById("eventNameInput").value.trim() || "SHAKSHUKA Event";
  const eventType = getEventType();

  const headers = [
    "Event",
    "Event type",
    "Name",
    "Phone",
    "Email",
    "Notes",
    "Flights",
    "Insurance",
    "Passport",
    "Jersey",
    "License",
    "Reserve date",
    "Last jump",
    "Number of jumps",
    "Total tunnel time",
    "Canopy size",
    "Water training",
    "Canopy course",
    "Participant total",
    "Participant paid",
    "Participant left to pay",
    "Coach tickets total",
    "Coach tickets paid",
    "Coach tickets left to pay"
  ];

  const rows = participants.map(p => [
    eventName,
    eventType,
    p.name,
    p.phone,
    p.email,
    p.notes,
    p.flightDone ? "Yes" : "No",
    p.insuranceDone ? "Yes" : "No",
    p.passportDone ? "Yes" : "No",
    p.jerseyDone ? "Yes" : "No",
    p.licenseText,
    p.reserveDate ? formatDate(p.reserveDate) : "",
    p.lastJumpDate ? formatDate(p.lastJumpDate) : "",
    p.numberJumps ?? "",
    formatMinutesForExport(p.tunnelMinutes),
    p.canopySize ?? "",
    p.waterTrainingDone ? "Yes" : "No",
    p.canopyCourseDone ? "Yes" : "No",
    formatMoney(p.paymentTotal),
    formatMoney(p.paymentPaid),
    formatMoney(calculateLeft(p.paymentTotal, p.paymentPaid)),
    formatMoney(p.coachTotal),
    formatMoney(p.coachPaid),
    formatMoney(calculateLeft(p.coachTotal, p.coachPaid))
  ]);

  const csv = "\ufeff" + [headers, ...rows]
    .map(row => row.map(csvEscape).join(","))
    .join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = eventName.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "event";

  link.href = url;
  link.download = `${safeName}_participants.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  setStatus(editorStatus, "Participant spreadsheet exported.");
}

exportParticipantsButton?.addEventListener("click", exportParticipantsToSpreadsheet);





// ---------------- Rooms ----------------
const adminRoomsStatus = document.getElementById("adminRoomsStatus");
const adminRoomsHint = document.getElementById("adminRoomsHint");
const adminRoomsList = document.getElementById("adminRoomsList");
const addRoomButton = document.getElementById("addRoomButton");

const ROOM_ADMIN_OPTIONS = [
  { key: "admin:ksenia", name: "Ksenia" },
  { key: "admin:ilya", name: "Ilya" }
];

let adminRoomsData = {
  is_hotel: false,
  rooms: []
};

function setAdminRoomsStatus(message = "", isError = false) {
  if (!adminRoomsStatus) return;
  adminRoomsStatus.textContent = message;
  adminRoomsStatus.classList.toggle("hidden", !message);
  adminRoomsStatus.classList.toggle("error", isError);
}

function currentRoomParticipants() {
  const unique = new Map();

  [...participantsList.querySelectorAll(".participant-row")]
    .map(row => ({
      person_type: "participant",
      person_id: row.querySelector(".participant-id")?.value || "",
      name: row.querySelector(".participant-name")?.value.trim() || "Participant"
    }))
    .filter(item => item.person_id)
    .forEach(item => {
      if (!unique.has(item.person_id)) unique.set(item.person_id, item);
    });

  return [...unique.values()].sort((a,b) => a.name.localeCompare(b.name));
}

function assignedRoomKeys() {
  const keys = new Set();

  (adminRoomsData.rooms || []).forEach(room => {
    (room.participants || []).forEach(person => {
      keys.add(`participant:${person.participant_id}`);
    });

    (room.people || []).forEach(person => {
      if (person.person_key) keys.add(person.person_key);
    });
  });

  return keys;
}

async function saveAdminRoomNumber(room, value) {
  if (!currentEventId || !room?.id) return false;

  const clean = String(value || "").trim();
  if (adminRoomsData.is_hotel && clean && !/^\d{3}$/.test(clean)) {
    setAdminRoomsStatus("Hotel room number must be exactly 3 digits.", true);
    return false;
  }

  try {
    const { data, error } = await client.rpc("admin_set_room_number_v117", {
      p_event_id: currentEventId,
      p_room_id: room.id,
      p_room_number: clean || null
    });

    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not save room number.");

    room.room_number = clean || null;
    setAdminRoomsStatus("Room number saved.");
    setTimeout(() => setAdminRoomsStatus(""), 900);
    renderAdminRooms();
    return true;
  } catch (error) {
    setAdminRoomsStatus(`Could not save room: ${error.message}`, true);
    return false;
  }
}

async function addAdminRoom() {
  if (!currentEventId) {
    setAdminRoomsStatus("Save the event first, then add rooms.", true);
    return;
  }

  try {
    const { data, error } = await client.rpc("admin_add_room_v117", {
      p_event_id: currentEventId
    });

    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not add room.");

    await loadAdminRooms();
  } catch (error) {
    setAdminRoomsStatus(`Could not add room: ${error.message}`, true);
  }
}

async function deleteAdminRoom(room) {
  if (!currentEventId || !room?.id) return;

  try {
    const { data, error } = await client.rpc("admin_delete_room_v117", {
      p_event_id: currentEventId,
      p_room_id: room.id
    });

    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not delete room.");

    await loadAdminRooms();
  } catch (error) {
    setAdminRoomsStatus(`Could not delete room: ${error.message}`, true);
  }
}

async function addParticipantToRoomV120(room, participantId) {
  if (!currentEventId || !room?.id || !participantId) return;

  try {
    const { data, error } = await client.rpc("admin_add_room_participant_v120", {
      p_event_id: currentEventId,
      p_room_id: room.id,
      p_participant_id: participantId
    });

    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not add participant.");

    await loadAdminRooms();
  } catch (error) {
    setAdminRoomsStatus(`Could not add participant: ${error.message}`, true);
  }
}

async function addNamedPersonToRoomV120(room, personType, displayName, personKey = null) {
  if (!currentEventId || !room?.id) return;

  const cleanName = String(displayName || "").trim();
  if (!cleanName) {
    setAdminRoomsStatus("Enter a name first.", true);
    return;
  }

  try {
    const { data, error } = await client.rpc("admin_add_room_named_person_v120", {
      p_event_id: currentEventId,
      p_room_id: room.id,
      p_person_type: personType,
      p_display_name: cleanName,
      p_person_key: personKey
    });

    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not add person.");

    await loadAdminRooms();
  } catch (error) {
    setAdminRoomsStatus(`Could not add person: ${error.message}`, true);
  }
}

async function removeParticipantFromRoomV120(room, participantId) {
  if (!currentEventId || !room?.id || !participantId) return;

  try {
    const { data, error } = await client.rpc("admin_remove_room_participant_v120", {
      p_event_id: currentEventId,
      p_room_id: room.id,
      p_participant_id: participantId
    });

    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not remove participant.");

    await loadAdminRooms();
  } catch (error) {
    setAdminRoomsStatus(`Could not remove participant: ${error.message}`, true);
  }
}

async function removeNamedPersonFromRoomV120(room, personId) {
  if (!currentEventId || !room?.id || !personId) return;

  try {
    const { data, error } = await client.rpc("admin_remove_room_named_person_v120", {
      p_event_id: currentEventId,
      p_room_id: room.id,
      p_person_id: personId
    });

    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not remove person.");

    await loadAdminRooms();
  } catch (error) {
    setAdminRoomsStatus(`Could not remove person: ${error.message}`, true);
  }
}

function roomDisplayLabel(room, index) {
  if (adminRoomsData.is_hotel) {
    return room.room_number ? `Room ${room.room_number}` : `Room ${index + 1}`;
  }

  return `Room ${room.room_index || index + 1}`;
}

function renderAdminRooms() {
  if (!adminRoomsList) return;

  adminRoomsList.innerHTML = "";
  const rooms = Array.isArray(adminRoomsData.rooms) ? adminRoomsData.rooms : [];
  const participantOptions = currentRoomParticipants();
  const assignedKeys = assignedRoomKeys();

  if (adminRoomsHint) {
    adminRoomsHint.textContent = adminRoomsData.is_hotel
      ? "Hotel: use the 3-digit room number field. Add people from the list."
      : "House: rooms are numbered automatically. Add people from the list.";
  }

  if (!rooms.length) {
    adminRoomsList.innerHTML = '<p class="muted">No rooms yet. Press + Add room.</p>';
    return;
  }

  rooms.forEach((room, index) => {
    const occupants = [
      ...(room.participants || []).map(person => ({
        type: "participant",
        id: person.participant_id,
        name: person.display_name || "Participant"
      })),
      ...(room.people || []).map(person => ({
        type: person.person_type || "other",
        id: person.id,
        key: person.person_key || "",
        name: person.display_name || "Other person"
      }))
    ].sort((a,b) => a.name.localeCompare(b.name));

    const row = document.createElement("div");
    row.className = "admin-room-flat-row";

    const left = document.createElement("div");
    left.className = "admin-room-flat-left";

    const number = document.createElement("strong");
    number.className = "admin-room-flat-number";
    number.textContent = adminRoomsData.is_hotel
      ? (room.room_number || String(index + 1))
      : String(room.room_index || index + 1);

    const names = document.createElement("div");
    names.className = "admin-room-flat-names";

    if (!occupants.length) {
      const empty = document.createElement("span");
      empty.className = "muted";
      empty.textContent = "—";
      names.appendChild(empty);
    } else {
      occupants.forEach((person, personIndex) => {
        const nameWrap = document.createElement("span");
        nameWrap.className = "admin-room-flat-name";

        const nameText = document.createElement("span");
        nameText.textContent = person.name;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "admin-room-name-remove";
        remove.textContent = "×";
        remove.title = `Remove ${person.name}`;
        remove.setAttribute("aria-label", `Remove ${person.name} from room`);

        remove.addEventListener("click", () => {
          if (person.type === "participant") {
            removeParticipantFromRoomV120(room, person.id);
          } else {
            removeNamedPersonFromRoomV120(room, person.id);
          }
        });

        nameWrap.append(nameText, remove);
        names.appendChild(nameWrap);

        if (personIndex < occupants.length - 1) {
          const separator = document.createElement("span");
          separator.className = "admin-room-name-separator";
          separator.textContent = " · ";
          names.appendChild(separator);
        }
      });
    }

    left.append(number, names);

    const right = document.createElement("div");
    right.className = "admin-room-flat-controls";

    if (adminRoomsData.is_hotel) {
      const roomNumber = document.createElement("input");
      roomNumber.type = "text";
      roomNumber.inputMode = "numeric";
      roomNumber.maxLength = 3;
      roomNumber.pattern = "\\d{3}";
      roomNumber.className = "admin-room-flat-number-input";
      roomNumber.placeholder = "000";
      roomNumber.value = room.room_number || "";
      roomNumber.setAttribute("aria-label", "Hotel room number");

      roomNumber.addEventListener("input", () => {
        roomNumber.value = roomNumber.value.replace(/\D/g, "").slice(0, 3);
      });

      roomNumber.addEventListener("change", () => {
        saveAdminRoomNumber(room, roomNumber.value);
      });

      right.appendChild(roomNumber);
    }

    const select = document.createElement("select");
    select.className = "admin-room-flat-select";
    select.innerHTML = '<option value="">Select person</option>';

    participantOptions
      .filter(person => !assignedKeys.has(`participant:${person.person_id}`))
      .forEach(person => {
        const option = document.createElement("option");
        option.value = `participant:${person.person_id}`;
        option.textContent = person.name;
        select.appendChild(option);
      });

    ROOM_ADMIN_OPTIONS
      .filter(person => !assignedKeys.has(person.key))
      .forEach(person => {
        const option = document.createElement("option");
        option.value = person.key;
        option.textContent = person.name;
        select.appendChild(option);
      });

    const otherOption = document.createElement("option");
    otherOption.value = "other";
    otherOption.textContent = "Other person…";
    select.appendChild(otherOption);

    const add = document.createElement("button");
    add.type = "button";
    add.className = "primary-button compact-button admin-room-flat-add";
    add.textContent = "+";
    add.title = "Add person to room";
    add.setAttribute("aria-label", "Add person to room");

    const deleteRoom = document.createElement("button");
    deleteRoom.type = "button";
    deleteRoom.className = "danger-ghost-button admin-room-flat-delete";
    deleteRoom.textContent = "×";
    deleteRoom.title = "Delete room";
    deleteRoom.setAttribute("aria-label", "Delete room");
    deleteRoom.addEventListener("click", () => deleteAdminRoom(room));

    const manual = document.createElement("div");
    manual.className = "admin-room-flat-manual hidden";

    const manualInput = document.createElement("input");
    manualInput.type = "text";
    manualInput.placeholder = "Enter name";
    manualInput.maxLength = 100;
    manualInput.setAttribute("aria-label", "Other person's name");

    manual.appendChild(manualInput);

    select.addEventListener("change", () => {
      const isOther = select.value === "other";
      manual.classList.toggle("hidden", !isOther);
      if (isOther) setTimeout(() => manualInput.focus(), 0);
    });

    add.addEventListener("click", async () => {
      const value = select.value;
      if (!value) return;

      if (value.startsWith("participant:")) {
        await addParticipantToRoomV120(room, value.slice("participant:".length));
        return;
      }

      if (value.startsWith("admin:")) {
        const admin = ROOM_ADMIN_OPTIONS.find(item => item.key === value);
        if (admin) {
          await addNamedPersonToRoomV120(room, "admin", admin.name, admin.key);
        }
        return;
      }

      if (value === "other") {
        await addNamedPersonToRoomV120(room, "other", manualInput.value, null);
      }
    });

    manualInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        add.click();
      }
    });

    right.append(select, add, deleteRoom);

    row.append(left, right, manual);
    adminRoomsList.appendChild(row);
  });
}

async function loadAdminRooms() {
  if (!adminRoomsList) return;

  if (!currentEventId) {
    adminRoomsData = { is_hotel: false, rooms: [] };
    renderAdminRooms();
    return;
  }

  try {
    setAdminRoomsStatus("Loading rooms…");

    const { data, error } = await client.rpc("admin_get_rooms_v120", {
      p_event_id: currentEventId
    });

    if (error) throw error;

    adminRoomsData = {
      is_hotel: Boolean(data?.is_hotel),
      rooms: Array.isArray(data?.rooms) ? data.rooms : []
    };

    renderAdminRooms();
    setAdminRoomsStatus("");
  } catch (error) {
    setAdminRoomsStatus(`Could not load rooms: ${error.message}`, true);
  }
}

addRoomButton?.addEventListener("click", addAdminRoom);


// ---------------- Transportation ----------------
const adminTransportationStatus = document.getElementById("adminTransportationStatus");
const adminTransportationList = document.getElementById("adminTransportationList");
const addTransportationButton = document.getElementById("addTransportationButton");

const TRANSPORT_TYPES = ["car", "train", "bus", "flight", "taxi"];
const TRANSPORT_LABELS = {
  car: "Car",
  train: "Train",
  bus: "Bus",
  flight: "Flight",
  taxi: "Taxi"
};

let adminTransportationData = [];

function setAdminTransportationStatus(message = "", isError = false) {
  if (!adminTransportationStatus) return;
  adminTransportationStatus.textContent = message;
  adminTransportationStatus.classList.toggle("hidden", !message);
  adminTransportationStatus.classList.toggle("error", isError);
}

function transportAssignedKeys() {
  const keys = new Set();
  (adminTransportationData || []).forEach(item => {
    (item.participants || []).forEach(person => {
      keys.add(`${item.id}:participant:${person.participant_id}`);
    });
    (item.people || []).forEach(person => {
      if (person.person_key) keys.add(`${item.id}:${person.person_key}`);
    });
  });
  return keys;
}

async function loadAdminTransportation() {
  if (!adminTransportationList) return;
  if (!currentEventId) {
    adminTransportationData = [];
    renderAdminTransportation();
    return;
  }

  try {
    setAdminTransportationStatus("Loading transportation…");
    const { data, error } = await client.rpc("admin_get_transportation_v128", {
      p_event_id: currentEventId
    });
    if (error) throw error;
    adminTransportationData = Array.isArray(data) ? data : [];
    renderAdminTransportation();
    setAdminTransportationStatus("");
  } catch (error) {
    setAdminTransportationStatus(`Could not load transportation: ${error.message}`, true);
  }
}

async function addAdminTransportation() {
  if (!currentEventId) {
    setAdminTransportationStatus("Save the event first, then add transportation.", true);
    return;
  }

  try {
    const { data, error } = await client.rpc("admin_add_transportation_v127", {
      p_event_id: currentEventId
    });
    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not add transportation.");
    await loadAdminTransportation();
  } catch (error) {
    setAdminTransportationStatus(`Could not add transportation: ${error.message}`, true);
  }
}

async function saveAdminTransportation(item, values) {
  try {
    const { data, error } = await client.rpc("admin_update_transportation_v128", {
      p_event_id: currentEventId,
      p_transport_id: item.id,
      p_transport_type: values.transport_type,
      p_travel_date: values.travel_date || null,
      p_departure_time: values.departure_time || null,
      p_arrival_time: values.arrival_time || null,
      p_from_location: values.from_location || null,
      p_destination: values.destination || null
    });
    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not save transportation.");
    await loadAdminTransportation();
  } catch (error) {
    setAdminTransportationStatus(`Could not save transportation: ${error.message}`, true);
  }
}

async function deleteAdminTransportation(item) {
  try {
    const { data, error } = await client.rpc("admin_delete_transportation_v127", {
      p_event_id: currentEventId,
      p_transport_id: item.id
    });
    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not delete transportation.");
    await loadAdminTransportation();
  } catch (error) {
    setAdminTransportationStatus(`Could not delete transportation: ${error.message}`, true);
  }
}

async function addTransportationParticipant(item, participantId) {
  try {
    const { data, error } = await client.rpc("admin_add_transport_participant_v127", {
      p_event_id: currentEventId,
      p_transport_id: item.id,
      p_participant_id: participantId
    });
    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not add traveler.");
    await loadAdminTransportation();
  } catch (error) {
    setAdminTransportationStatus(`Could not add traveler: ${error.message}`, true);
  }
}

async function addTransportationNamedPerson(item, personType, displayName, personKey = null) {
  const clean = String(displayName || "").trim();
  if (!clean) {
    setAdminTransportationStatus("Enter a name first.", true);
    return;
  }

  try {
    const { data, error } = await client.rpc("admin_add_transport_person_v127", {
      p_event_id: currentEventId,
      p_transport_id: item.id,
      p_person_type: personType,
      p_display_name: clean,
      p_person_key: personKey
    });
    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not add traveler.");
    await loadAdminTransportation();
  } catch (error) {
    setAdminTransportationStatus(`Could not add traveler: ${error.message}`, true);
  }
}

async function removeTransportationTraveler(item, person) {
  try {
    const rpc = person.type === "participant"
      ? "admin_remove_transport_participant_v127"
      : "admin_remove_transport_person_v127";

    const args = person.type === "participant"
      ? {
          p_event_id: currentEventId,
          p_transport_id: item.id,
          p_participant_id: person.id
        }
      : {
          p_event_id: currentEventId,
          p_transport_id: item.id,
          p_person_id: person.id
        };

    const { data, error } = await client.rpc(rpc, args);
    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not remove traveler.");
    await loadAdminTransportation();
  } catch (error) {
    setAdminTransportationStatus(`Could not remove traveler: ${error.message}`, true);
  }
}

function renderAdminTransportation() {
  if (!adminTransportationList) return;
  adminTransportationList.innerHTML = "";

  if (!adminTransportationData.length) {
    adminTransportationList.innerHTML = '<p class="muted">No transportation added yet.</p>';
    return;
  }

  const participants = currentRoomParticipants();
  const assigned = transportAssignedKeys();

  adminTransportationData.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "admin-transport-card";

    const form = document.createElement("div");
    form.className = "admin-transport-form";

    const type = document.createElement("select");
    type.className = "admin-transport-type";
    TRANSPORT_TYPES.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = TRANSPORT_LABELS[value];
      option.selected = value === item.transport_type;
      type.appendChild(option);
    });

    const date = document.createElement("input");
    date.type = "date";
    date.className = "admin-transport-date";
    date.value = item.travel_date || "";

    const fromLocation = document.createElement("input");
    fromLocation.type = "text";
    fromLocation.className = "admin-transport-location";
    fromLocation.placeholder = "From";
    fromLocation.maxLength = 120;
    fromLocation.value = item.from_location || "";

    const destination = document.createElement("input");
    destination.type = "text";
    destination.className = "admin-transport-location";
    destination.placeholder = "Destination";
    destination.maxLength = 120;
    destination.value = item.destination || "";

    const start = document.createElement("input");
    start.type = "time";
    start.className = "admin-transport-time";
    start.value = item.departure_time ? String(item.departure_time).slice(0,5) : "";

    const arrival = document.createElement("input");
    arrival.type = "time";
    arrival.className = "admin-transport-time";
    arrival.value = item.arrival_time ? String(item.arrival_time).slice(0,5) : "";

    const save = document.createElement("button");
    save.type = "button";
    save.className = "secondary-button compact-button transport-save-icon";
    save.textContent = "💾";
    save.title = "Save transportation";
    save.setAttribute("aria-label", "Save transportation");
    save.addEventListener("click", () => saveAdminTransportation(item, {
      transport_type: type.value,
      travel_date: date.value,
      departure_time: start.value,
      arrival_time: arrival.value,
      from_location: fromLocation.value.trim(),
      destination: destination.value.trim()
    }));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "danger-ghost-button transport-delete-button";
    del.textContent = "×";
    del.title = "Delete transportation";
    del.setAttribute("aria-label", "Delete transportation");
    del.addEventListener("click", () => deleteAdminTransportation(item));

    const typeField = document.createElement("label");
    typeField.className = "transport-mini-field";
    typeField.innerHTML = "<span>Type</span>";
    typeField.appendChild(type);

    const dateField = document.createElement("label");
    dateField.className = "transport-mini-field";
    dateField.innerHTML = "<span>Date</span>";
    dateField.appendChild(date);

    const fromField = document.createElement("label");
    fromField.className = "transport-mini-field transport-location-field";
    fromField.innerHTML = "<span>From</span>";
    fromField.appendChild(fromLocation);

    const destinationField = document.createElement("label");
    destinationField.className = "transport-mini-field transport-location-field";
    destinationField.innerHTML = "<span>Destination</span>";
    destinationField.appendChild(destination);

    const startField = document.createElement("label");
    startField.className = "transport-mini-field";
    startField.innerHTML = "<span>Start</span>";
    startField.appendChild(start);

    const arrivalField = document.createElement("label");
    arrivalField.className = "transport-mini-field";
    arrivalField.innerHTML = "<span>Est. arrival</span>";
    arrivalField.appendChild(arrival);

    form.append(typeField, dateField, fromField, destinationField, startField, arrivalField, save, del);
    card.appendChild(form);

    const travelers = [
      ...(item.participants || []).map(person => ({
        type: "participant",
        id: person.participant_id,
        name: person.display_name || "Participant"
      })),
      ...(item.people || []).map(person => ({
        type: person.person_type || "other",
        id: person.id,
        key: person.person_key || "",
        name: person.display_name || "Other person"
      }))
    ].sort((a,b) => a.name.localeCompare(b.name));

    const peopleRow = document.createElement("div");
    peopleRow.className = "admin-transport-people";

    const names = document.createElement("div");
    names.className = "admin-transport-names";

    travelers.forEach((person, personIndex) => {
      const pill = document.createElement("span");
      pill.className = "admin-transport-person";
      pill.textContent = person.name;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.title = `Remove ${person.name}`;
      remove.addEventListener("click", () => removeTransportationTraveler(item, person));

      pill.appendChild(remove);
      names.appendChild(pill);

      if (personIndex < travelers.length - 1) {
        const separator = document.createElement("span");
        separator.className = "transport-name-separator";
        separator.textContent = " · ";
        names.appendChild(separator);
      }
    });

    if (!travelers.length) {
      const empty = document.createElement("span");
      empty.className = "muted";
      empty.textContent = "No travelers";
      names.appendChild(empty);
    }

    const addWrap = document.createElement("div");
    addWrap.className = "admin-transport-add-person";

    const select = document.createElement("select");
    select.innerHTML = '<option value="">Select person</option>';

    participants
      .filter(person => !assigned.has(`${item.id}:participant:${person.person_id}`))
      .forEach(person => {
        const option = document.createElement("option");
        option.value = `participant:${person.person_id}`;
        option.textContent = person.name;
        select.appendChild(option);
      });

    ROOM_ADMIN_OPTIONS
      .filter(person => !assigned.has(`${item.id}:${person.key}`))
      .forEach(person => {
        const option = document.createElement("option");
        option.value = person.key;
        option.textContent = person.name;
        select.appendChild(option);
      });

    const other = document.createElement("option");
    other.value = "other";
    other.textContent = "Other person…";
    select.appendChild(other);

    const add = document.createElement("button");
    add.type = "button";
    add.className = "primary-button compact-button";
    add.textContent = "+";

    const manual = document.createElement("input");
    manual.type = "text";
    manual.placeholder = "Enter name";
    manual.maxLength = 100;
    manual.className = "admin-transport-manual hidden";

    select.addEventListener("change", () => {
      manual.classList.toggle("hidden", select.value !== "other");
      if (select.value === "other") setTimeout(() => manual.focus(), 0);
    });

    add.addEventListener("click", async () => {
      const value = select.value;
      if (!value) return;

      if (value.startsWith("participant:")) {
        await addTransportationParticipant(item, value.slice("participant:".length));
      } else if (value.startsWith("admin:")) {
        const admin = ROOM_ADMIN_OPTIONS.find(entry => entry.key === value);
        if (admin) await addTransportationNamedPerson(item, "admin", admin.name, admin.key);
      } else if (value === "other") {
        await addTransportationNamedPerson(item, "other", manual.value, null);
      }
    });

    manual.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        add.click();
      }
    });

    addWrap.append(select, add, manual);
    peopleRow.append(names, addWrap);
    card.appendChild(peopleRow);

    adminTransportationList.appendChild(card);
  });
}

addTransportationButton?.addEventListener("click", addAdminTransportation);


// ---------------- Schedule ----------------
const adminScheduleStatus = document.getElementById("adminScheduleStatus");
const adminScheduleDays = document.getElementById("adminScheduleDays");

let adminScheduleData = {
  days: [],
  items: [],
  exclusions: []
};

function setAdminScheduleStatus(message = "", isError = false) {
  if (!adminScheduleStatus) return;
  adminScheduleStatus.textContent = message;
  adminScheduleStatus.classList.toggle("hidden", !message);
  adminScheduleStatus.classList.toggle("error", isError);
}

function scheduleUuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function scheduleEventDates() {
  const start = document.getElementById("startDateInput")?.value;
  const end = document.getElementById("endDateInput")?.value;
  if (!start || !end) return [];

  const dates = [];
  const current = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);

  while (current <= last && dates.length < 100) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function formatScheduleAdminDate(dateValue, dayIndex) {
  const [y,m,d] = String(dateValue || "").split("-");
  return `Day ${dayIndex} · ${d}/${m}/${String(y).slice(-2)}`;
}

function scheduleTimeParts(timeValue) {
  const value = String(timeValue || "");
  const match = value.match(/^(\d{2}):(\d{2})/);
  return {
    hour: match ? match[1] : "08",
    minute: match && ["00","15","30","45"].includes(match[2]) ? match[2] : "00"
  };
}

function createScheduleTimeSelects(timeValue = "") {
  const parts = scheduleTimeParts(timeValue);
  const wrap = document.createElement("div");
  wrap.className = "schedule-time-selects";

  const hour = document.createElement("select");
  hour.className = "schedule-hour-select";
  hour.setAttribute("aria-label", "Hour");
  for (let h = 0; h < 24; h += 1) {
    const option = document.createElement("option");
    option.value = String(h).padStart(2, "0");
    option.textContent = String(h).padStart(2, "0");
    if (option.value === parts.hour) option.selected = true;
    hour.appendChild(option);
  }

  const colon = document.createElement("span");
  colon.textContent = ":";

  const minute = document.createElement("select");
  minute.className = "schedule-minute-select";
  minute.setAttribute("aria-label", "Minutes");
  ["00","15","30","45"].forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    if (value === parts.minute) option.selected = true;
    minute.appendChild(option);
  });

  wrap.append(hour, colon, minute);
  return { wrap, hour, minute };
}

function createScheduleEndTimeSelects(timeValue = "") {
  const hasValue = Boolean(timeValue);
  const parts = scheduleTimeParts(timeValue || "09:00");
  const wrap = document.createElement("div");
  wrap.className = "schedule-time-selects schedule-end-time-selects";

  const hour = document.createElement("select");
  hour.className = "schedule-hour-select";
  hour.setAttribute("aria-label", "End hour");

  const none = document.createElement("option");
  none.value = "";
  none.textContent = "--";
  hour.appendChild(none);

  for (let h = 0; h < 24; h += 1) {
    const option = document.createElement("option");
    option.value = String(h).padStart(2, "0");
    option.textContent = String(h).padStart(2, "0");
    if (hasValue && option.value === parts.hour) option.selected = true;
    hour.appendChild(option);
  }

  const colon = document.createElement("span");
  colon.textContent = ":";

  const minute = document.createElement("select");
  minute.className = "schedule-minute-select";
  minute.setAttribute("aria-label", "End minutes");
  ["00","15","30","45"].forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    if (value === parts.minute) option.selected = true;
    minute.appendChild(option);
  });

  const sync = () => {
    minute.disabled = !hour.value;
    colon.classList.toggle("muted", !hour.value);
  };
  hour.addEventListener("change", sync);
  sync();

  wrap.append(hour, colon, minute);
  return { wrap, hour, minute };
}

function itemVisibleOnScheduleDay(item, dayDate) {
  if (item.applies_to_all) {
    return !adminScheduleData.exclusions.some(ex =>
      ex.item_id === item.id && ex.day_date === dayDate
    );
  }
  return item.item_date === dayDate;
}

function scheduleItemsForDay(dayDate) {
  return adminScheduleData.items
    .filter(item => itemVisibleOnScheduleDay(item, dayDate))
    .sort((a,b) => {
      const ta = String(a.item_time || "99:99");
      const tb = String(b.item_time || "99:99");
      if (ta !== tb) return ta.localeCompare(tb);
      return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    });
}

async function saveScheduleDayTitle(dayDate, title) {
  if (!currentEventId) return;
  try {
    const { data, error } = await client.rpc("admin_set_schedule_day_title_v105", {
      p_event_id: currentEventId,
      p_day_date: dayDate,
      p_title: title.trim()
    });
    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not save day title.");

    const existing = adminScheduleData.days.find(day => day.day_date === dayDate);
    if (existing) existing.title = title.trim();
    else adminScheduleData.days.push({ day_date: dayDate, title: title.trim() });
    setAdminScheduleStatus("Day title saved.");
    setTimeout(() => setAdminScheduleStatus(""), 900);
  } catch (error) {
    setAdminScheduleStatus(`Could not save day title: ${error.message}`, true);
  }
}

async function upsertScheduleItem(item, dayDate, isNew = false) {
  if (!currentEventId) return false;
  if (!item.title?.trim()) {
    setAdminScheduleStatus("Schedule activity needs a title.", true);
    return false;
  }

  try {
    setAdminScheduleStatus("Saving schedule…");
    const { data, error } = await client.rpc("admin_upsert_schedule_item_v109", {
      p_event_id: currentEventId,
      p_item_id: item.id || null,
      p_item_date: item.applies_to_all ? null : dayDate,
      p_applies_to_all: Boolean(item.applies_to_all),
      p_item_time: item.item_time || null,
      p_end_time: item.end_time || null,
      p_title: item.title.trim(),
      p_details: (item.details || "").trim()
    });
    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not save schedule item.");

    const saved = {
      id: data.id || item.id,
      item_date: item.applies_to_all ? null : dayDate,
      applies_to_all: Boolean(item.applies_to_all),
      item_time: item.item_time || null,
      end_time: item.end_time || null,
      title: item.title.trim(),
      details: (item.details || "").trim(),
      sort_order: Number(item.sort_order) || 0
    };

    const index = adminScheduleData.items.findIndex(existing => existing.id === saved.id);
    if (index >= 0) adminScheduleData.items[index] = saved;
    else adminScheduleData.items.push(saved);

    // If a previously excluded all-days item is explicitly added again from this day,
    // remove that one-day exclusion.
    adminScheduleData.exclusions = adminScheduleData.exclusions.filter(ex =>
      !(ex.item_id === saved.id && ex.day_date === dayDate)
    );

    setAdminScheduleStatus("Schedule saved.");
    setTimeout(() => setAdminScheduleStatus(""), 900);
    if (isNew) renderAdminSchedule();
    return true;
  } catch (error) {
    setAdminScheduleStatus(`Could not save schedule: ${error.message}`, true);
    return false;
  }
}

async function deleteScheduleItemFromDay(item, dayDate) {
  if (!currentEventId || !item?.id) return;

  try {
    const { data, error } = await client.rpc("admin_delete_schedule_item_from_day_v105", {
      p_event_id: currentEventId,
      p_item_id: item.id,
      p_day_date: dayDate
    });
    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not delete schedule item.");

    if (item.applies_to_all) {
      // Removing one occurrence from an All-days item converts every remaining
      // occurrence into its own This-day item. Reload so all badges update now.
      await loadAdminSchedule();
    } else {
      adminScheduleData.items = adminScheduleData.items.filter(existing => existing.id !== item.id);
      renderAdminSchedule();
    }

    setAdminScheduleStatus("Item removed from this day.");
    setTimeout(() => setAdminScheduleStatus(""), 900);
  } catch (error) {
    setAdminScheduleStatus(`Could not remove schedule item: ${error.message}`, true);
  }
}

function buildScheduleItemEditor(item, dayDate) {
  const row = document.createElement("div");
  row.className = "schedule-day-item-display";
  if (item.applies_to_all) row.classList.add("is-all-days");

  const renderView = () => {
    row.innerHTML = "";
    row.classList.remove("is-editing");

    const when = document.createElement("div");
    when.className = "schedule-display-time";
    const startText = item.item_time ? String(item.item_time).slice(0,5) : "";
    const endText = item.end_time ? String(item.end_time).slice(0,5) : "";
    when.textContent = endText ? `${startText} – ${endText}` : startText;

    const body = document.createElement("div");
    body.className = "schedule-display-body";

    const title = document.createElement("strong");
    title.textContent = item.title || "Activity";
    body.appendChild(title);

    if (item.details) {
      const details = document.createElement("p");
      details.textContent = item.details;
      body.appendChild(details);
    }

    const actions = document.createElement("div");
    actions.className = "schedule-display-actions";

    if (item.applies_to_all) {
      const scope = document.createElement("span");
      scope.className = "schedule-item-scope-badge";
      scope.textContent = "All days";
      actions.appendChild(scope);
    }

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "secondary-button compact-button schedule-edit-item";
    edit.textContent = "Edit";
    edit.addEventListener("click", renderEdit);

    actions.appendChild(edit);
    row.append(when, body, actions);
  };

  const renderEdit = () => {
    row.innerHTML = "";
    row.classList.add("is-editing");

    const startTime = createScheduleTimeSelects(item.item_time);
    const endTime = createScheduleEndTimeSelects(item.end_time);

    const title = document.createElement("input");
    title.type = "text";
    title.className = "schedule-day-item-title";
    title.value = item.title || "";
    title.placeholder = "Activity";

    const scope = document.createElement("span");
    scope.className = "schedule-item-scope-badge";
    scope.textContent = item.applies_to_all ? "All days" : "This day";

    const save = document.createElement("button");
    save.type = "button";
    save.className = "primary-button compact-button";
    save.textContent = "Save";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "ghost-button compact-button";
    cancel.textContent = "Cancel";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger-ghost-button schedule-edit-delete";
    remove.textContent = "Delete";
    remove.title = item.applies_to_all ? "Remove from this day" : "Delete item";

    save.addEventListener("click", async () => {
      if (!title.value.trim()) {
        setAdminScheduleStatus("Schedule activity needs a title.", true);
        title.focus();
        return;
      }

      const nextStart = `${startTime.hour.value}:${startTime.minute.value}`;
      const nextEnd = endTime.hour.value
        ? `${endTime.hour.value}:${endTime.minute.value}`
        : null;

      if (nextEnd && nextEnd <= nextStart) {
        setAdminScheduleStatus("End time must be later than start time.", true);
        return;
      }

      const previous = {
        item_time: item.item_time,
        end_time: item.end_time,
        title: item.title
      };

      item.item_time = nextStart;
      item.end_time = nextEnd;
      item.title = title.value.trim();

      const saved = await upsertScheduleItem(item, dayDate);
      if (saved) {
        renderView();
      } else {
        item.item_time = previous.item_time;
        item.end_time = previous.end_time;
        item.title = previous.title;
      }
    });

    cancel.addEventListener("click", renderView);
    remove.addEventListener("click", () => deleteScheduleItemFromDay(item, dayDate));

    const fromRow = document.createElement("div");
    fromRow.className = "schedule-edit-time-row";
    const fromLabel = document.createElement("span");
    fromLabel.className = "schedule-time-range-label";
    fromLabel.textContent = "From";
    fromRow.append(fromLabel, startTime.wrap);

    const untilRow = document.createElement("div");
    untilRow.className = "schedule-edit-time-row";
    const untilLabel = document.createElement("span");
    untilLabel.className = "schedule-time-range-label";
    untilLabel.textContent = "Until";
    untilRow.append(untilLabel, endTime.wrap);

    const left = document.createElement("div");
    left.className = "schedule-edit-left";
    left.append(fromRow, untilRow, title, scope);

    const buttons = document.createElement("div");
    buttons.className = "schedule-edit-buttons schedule-edit-buttons-v113";
    buttons.append(save, cancel, remove);

    row.append(left, buttons);
  };

  renderView();
  return row;
}

function buildNewScheduleItemRow(dayDate) {
  const row = document.createElement("div");
  row.className = "schedule-new-item-row schedule-new-item-row-v108";

  const startTime = createScheduleTimeSelects("08:00");
  const endTime = createScheduleEndTimeSelects("");

  const title = document.createElement("input");
  title.type = "text";
  title.className = "schedule-new-item-title";
  title.placeholder = "Activity name";

  const scope = document.createElement("select");
  scope.className = "schedule-new-item-scope";
  scope.setAttribute("aria-label", "Schedule item days");
  scope.innerHTML = `
    <option value="day">This day</option>
    <option value="all">All days</option>
  `;

  const add = document.createElement("button");
  add.type = "button";
  add.className = "primary-button schedule-add-item-button";
  add.textContent = "+ Add";

  add.addEventListener("click", async () => {
    if (!title.value.trim()) {
      setAdminScheduleStatus("Enter an activity name first.", true);
      title.focus();
      return;
    }

    const nextStart = `${startTime.hour.value}:${startTime.minute.value}`;
    const nextEnd = endTime.hour.value
      ? `${endTime.hour.value}:${endTime.minute.value}`
      : null;

    if (nextEnd && nextEnd <= nextStart) {
      setAdminScheduleStatus("End time must be later than start time.", true);
      return;
    }

    const item = {
      id: null,
      item_date: scope.value === "all" ? null : dayDate,
      applies_to_all: scope.value === "all",
      item_time: nextStart,
      end_time: nextEnd,
      title: title.value.trim(),
      details: "",
      sort_order: scheduleItemsForDay(dayDate).length
    };

    await upsertScheduleItem(item, dayDate, true);
  });

  const timeRange = document.createElement("div");
  timeRange.className = "schedule-new-time-range";

  const fromLabel = document.createElement("span");
  fromLabel.className = "schedule-time-range-label";
  fromLabel.textContent = "From";

  const untilLabel = document.createElement("span");
  untilLabel.className = "schedule-time-range-label";
  untilLabel.textContent = "Until";

  timeRange.append(fromLabel, startTime.wrap, untilLabel, endTime.wrap);

  const firstLine = document.createElement("div");
  firstLine.className = "schedule-new-item-first-line schedule-new-item-first-line-v108";
  firstLine.append(timeRange, scope, add);

  const secondLine = document.createElement("div");
  secondLine.className = "schedule-new-item-second-line";
  secondLine.appendChild(title);

  row.append(firstLine, secondLine);
  return row;
}

function renderAdminSchedule() {
  if (!adminScheduleDays) return;
  adminScheduleDays.innerHTML = "";

  const dates = scheduleEventDates();
  if (!dates.length) {
    adminScheduleDays.innerHTML = '<p class="muted">Choose the event start and end dates first.</p>';
    return;
  }

  dates.forEach((dayDate, index) => {
    const day = document.createElement("details");
    day.className = "schedule-day-card";
    if (index === 0) day.open = true;

    const summary = document.createElement("summary");
    summary.className = "schedule-day-summary";

    const summaryLeft = document.createElement("div");
    summaryLeft.className = "schedule-day-summary-inline";

    const dayLabel = document.createElement("strong");
    dayLabel.className = "schedule-day-date-label";
    dayLabel.textContent = formatScheduleAdminDate(dayDate, index);

    let savedTitle = adminScheduleData.days.find(item => item.day_date === dayDate)?.title || "";

    const dayTitleInput = document.createElement("input");
    dayTitleInput.type = "text";
    dayTitleInput.className = "schedule-day-title-inline-input";
    dayTitleInput.maxLength = 80;
    dayTitleInput.placeholder = "Day title";
    dayTitleInput.value = savedTitle;
    dayTitleInput.setAttribute("aria-label", `Title for ${formatScheduleAdminDate(dayDate, index)}`);

    // The title lives inside the collapsible summary, so editing it should not
    // open/close the day card.
    ["click", "pointerdown", "mousedown", "touchstart"].forEach(eventName => {
      dayTitleInput.addEventListener(eventName, event => event.stopPropagation());
    });
    dayTitleInput.addEventListener("keydown", event => event.stopPropagation());

    const saveInlineDayTitle = async () => {
      const nextTitle = dayTitleInput.value.trim();
      if (nextTitle === savedTitle) return;
      await saveScheduleDayTitle(dayDate, nextTitle);
      savedTitle = nextTitle;
    };

    dayTitleInput.addEventListener("change", saveInlineDayTitle);
    dayTitleInput.addEventListener("blur", saveInlineDayTitle);

    summaryLeft.append(dayLabel, dayTitleInput);

    const count = document.createElement("span");
    count.className = "count-pill";
    count.textContent = String(scheduleItemsForDay(dayDate).length);

    summary.append(summaryLeft, count);

    const body = document.createElement("div");
    body.className = "schedule-day-body";

    const items = document.createElement("div");
    items.className = "schedule-day-items";
    const dayItems = scheduleItemsForDay(dayDate);
    if (!dayItems.length) {
      items.innerHTML = '<p class="muted small-text schedule-empty-day">No items for this day.</p>';
    } else {
      dayItems.forEach(item => items.appendChild(buildScheduleItemEditor(item, dayDate)));
    }

    const addLabel = document.createElement("div");
    addLabel.className = "schedule-add-label";
    addLabel.textContent = "Add schedule item";

    body.append(items, addLabel, buildNewScheduleItemRow(dayDate));
    day.append(summary, body);
    adminScheduleDays.appendChild(day);
  });
}

async function loadAdminSchedule() {
  if (!adminScheduleDays) return;
  adminScheduleDays.innerHTML = "";

  if (!currentEventId) {
    setAdminScheduleStatus("");
    renderAdminSchedule();
    return;
  }

  try {
    setAdminScheduleStatus("Loading schedule…");
    const { data, error } = await client.rpc("admin_get_event_schedule_v105", {
      p_event_id: currentEventId
    });
    if (error) throw error;

    adminScheduleData = {
      days: Array.isArray(data?.days) ? data.days : [],
      items: Array.isArray(data?.items) ? data.items : [],
      exclusions: Array.isArray(data?.exclusions) ? data.exclusions : []
    };

    renderAdminSchedule();
    setAdminScheduleStatus("");
  } catch (error) {
    setAdminScheduleStatus(`Could not load schedule: ${error.message}`, true);
  }
}

document.getElementById("startDateInput")?.addEventListener("change", renderAdminSchedule);
document.getElementById("endDateInput")?.addEventListener("change", renderAdminSchedule);


// ---------------- Canopy Training ----------------

const adminCanopyTrainingStatus = document.getElementById("adminCanopyTrainingStatus");
const canopyTaskTemplate = document.getElementById("canopyTaskTemplate");

const canopyCourseUi = {
  CT1: {
    participants: document.getElementById("canopyCT1Participants"),
    participantSelect: document.getElementById("canopyCT1ParticipantSelect"),
    addParticipant: document.getElementById("addCanopyCT1Participant"),
    tasks: document.getElementById("canopyCT1Tasks"),
    addTask: document.getElementById("addCanopyCT1Task")
  },
  CT2: {
    participants: document.getElementById("canopyCT2Participants"),
    participantSelect: document.getElementById("canopyCT2ParticipantSelect"),
    addParticipant: document.getElementById("addCanopyCT2Participant"),
    tasks: document.getElementById("canopyCT2Tasks"),
    addTask: document.getElementById("addCanopyCT2Task")
  }
};

let canopyTrainingAssignments = [];

function setAdminCanopyTrainingStatus(message = "", isError = false) {
  if (!adminCanopyTrainingStatus) return;
  adminCanopyTrainingStatus.textContent = message;
  adminCanopyTrainingStatus.classList.toggle("hidden", !message);
  adminCanopyTrainingStatus.classList.toggle("error", isError);
}

function canopyUuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function currentCanopyParticipants() {
  const unique = new Map();

  [...participantsList.querySelectorAll(".participant-row")]
    .map(row => ({
      participant_id: row.querySelector(".participant-id")?.value || "",
      name: row.querySelector(".participant-name")?.value.trim() || "Participant"
    }))
    .filter(item => item.participant_id)
    .forEach(item => {
      if (!unique.has(item.participant_id)) unique.set(item.participant_id, item);
    });

  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function renderCanopyAssignments() {
  const participants = currentCanopyParticipants();

  Object.entries(canopyCourseUi).forEach(([level, ui]) => {
    if (!ui.participants) return;

    const assignedIds = new Set(
      canopyTrainingAssignments
        .filter(item => item.course_level === level)
        .map(item => item.participant_id)
    );

    const assignedAnywhere = new Set(
      canopyTrainingAssignments.map(item => item.participant_id)
    );

    // A participant can be assigned to only one course, so hide anyone
    // already assigned to CT1 or CT2 from both dropdowns.
    if (ui.participantSelect) {
      const previous = ui.participantSelect.value;
      ui.participantSelect.innerHTML = '<option value="">Select participant</option>';

      participants
        .filter(person => !assignedAnywhere.has(person.participant_id))
        .forEach(person => {
          const option = document.createElement("option");
          option.value = person.participant_id;
          option.textContent = person.name;
          ui.participantSelect.appendChild(option);
        });

      if ([...ui.participantSelect.options].some(option => option.value === previous)) {
        ui.participantSelect.value = previous;
      }
    }

    ui.participants.innerHTML = "";

    const assignedPeople = participants.filter(person => assignedIds.has(person.participant_id));

    if (!assignedPeople.length) {
      ui.participants.innerHTML = '<p class="muted small-text">No participants assigned yet.</p>';
      return;
    }

    assignedPeople.forEach(person => {
      const row = document.createElement("div");
      row.className = "canopy-assigned-participant";

      const name = document.createElement("strong");
      name.textContent = person.name;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger-ghost-button canopy-assignment-remove";
      remove.textContent = "×";
      remove.title = `Remove ${person.name} from ${level}`;
      remove.setAttribute("aria-label", `Remove ${person.name} from ${level}`);

      remove.addEventListener("click", async () => {
        canopyTrainingAssignments = canopyTrainingAssignments.filter(item =>
          !(item.course_level === level && item.participant_id === person.participant_id)
        );
        renderCanopyAssignments();
        await saveAdminCanopyTraining("Course assignments saved.");
      });

      row.append(name, remove);
      ui.participants.appendChild(row);
    });
  });
}

function collectCanopyTasks() {
  const tasks = [];

  Object.entries(canopyCourseUi).forEach(([level, ui]) => {
    if (!ui.tasks) return;

    [...ui.tasks.querySelectorAll(".canopy-task-editor")].forEach((row, index) => {
      tasks.push({
        id: row.dataset.taskId || canopyUuid(),
        course_level: level,
        title: row.querySelector(".canopy-task-title")?.value.trim() || "",
        sort_order: index
      });
    });
  });

  return tasks;
}

function addCanopyTask(level, data = {}) {
  const ui = canopyCourseUi[level];
  if (!ui?.tasks || !canopyTaskTemplate) return;

  const fragment = canopyTaskTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".canopy-task-editor");
  const input = row.querySelector(".canopy-task-title");

  row.dataset.taskId = data.id || data.task_id || canopyUuid();
  input.value = data.title || data.task_title || "";

  input.addEventListener("change", () => saveAdminCanopyTraining());
  input.addEventListener("blur", () => {
    if (input.value.trim()) saveAdminCanopyTraining();
  });

  row.querySelector(".canopy-task-remove")?.addEventListener("click", async () => {
    row.remove();
    await saveAdminCanopyTraining("Task removed.");
  });

  ui.tasks.appendChild(fragment);
  if (!input.value) input.focus();
}

async function saveAdminCanopyTraining(message = "Canopy Training saved.") {
  if (!currentEventId) {
    setAdminCanopyTrainingStatus("Save the event first.");
    return false;
  }

  const tasks = collectCanopyTasks();
  if (tasks.some(item => !item.title)) {
    setAdminCanopyTrainingStatus("Each course task needs text.", true);
    return false;
  }

  try {
    setAdminCanopyTrainingStatus("Saving Canopy Training…");

    const { data, error } = await client.rpc("admin_replace_canopy_training_v100", {
      p_event_id: currentEventId,
      p_tasks: tasks,
      p_assignments: canopyTrainingAssignments
    });

    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not save Canopy Training.");

    setAdminCanopyTrainingStatus(message);
    setTimeout(() => {
      if (adminCanopyTrainingStatus?.textContent === message) {
        setAdminCanopyTrainingStatus("");
      }
    }, 1300);

    return true;
  } catch (error) {
    setAdminCanopyTrainingStatus(`Could not save Canopy Training: ${error.message}`, true);
    return false;
  }
}

async function loadAdminCanopyTraining() {
  Object.values(canopyCourseUi).forEach(ui => {
    if (ui.tasks) ui.tasks.innerHTML = "";
    if (ui.participants) ui.participants.innerHTML = "";
  });
  canopyTrainingAssignments = [];

  if (!currentEventId) {
    setAdminCanopyTrainingStatus("");
    return;
  }

  try {
    setAdminCanopyTrainingStatus("Loading Canopy Training…");

    const { data, error } = await client.rpc("admin_get_canopy_training_v100", {
      p_event_id: currentEventId
    });

    if (error) throw error;

    const payload = data || {};
    const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
    const assignments = Array.isArray(payload.assignments) ? payload.assignments : [];

    canopyTrainingAssignments = assignments.map(item => ({
      course_level: item.course_level,
      participant_id: item.participant_id
    }));

    tasks
      .sort((a, b) => {
        if (a.course_level !== b.course_level) return a.course_level.localeCompare(b.course_level);
        return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
      })
      .forEach(item => addCanopyTask(item.course_level, item));

    renderCanopyAssignments();
    setAdminCanopyTrainingStatus("");
  } catch (error) {
    setAdminCanopyTrainingStatus(`Could not load Canopy Training: ${error.message}`, true);
  }
}

function addCanopyParticipant(level) {
  const ui = canopyCourseUi[level];
  const participantId = ui?.participantSelect?.value || "";

  if (!participantId) {
    setAdminCanopyTrainingStatus(`Select a participant for ${level}.`, true);
    return;
  }

  // A participant may belong to only ONE Canopy Training course.
  // Assigning them to CT1 removes them from CT2, and vice versa.
  canopyTrainingAssignments = canopyTrainingAssignments.filter(item =>
    item.participant_id !== participantId
  );

  canopyTrainingAssignments.push({
    course_level: level,
    participant_id: participantId
  });

  renderCanopyAssignments();
  saveAdminCanopyTraining("Course assignments saved.");
}

canopyCourseUi.CT1.addTask?.addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();
  addCanopyTask("CT1");
});

canopyCourseUi.CT2.addTask?.addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();
  addCanopyTask("CT2");
});

canopyCourseUi.CT1.addParticipant?.addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();
  addCanopyParticipant("CT1");
});

canopyCourseUi.CT2.addParticipant?.addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();
  addCanopyParticipant("CT2");
});


// ---------------- SHAKSHUKA Quests ----------------

const adminQuestItems = document.getElementById("adminQuestItems");
const adminQuestsStatus = document.getElementById("adminQuestsStatus");
const addQuestItemButton = document.getElementById("addQuestItemButton");
const landingCompetitionInfoInput = document.getElementById("landingCompetitionInfoInput");
const socialMediaCompetitionInfoInput = document.getElementById("socialMediaCompetitionInfoInput");
const questItemTemplate = document.getElementById("questItemTemplate");

function setAdminQuestsStatus(message = "", isError = false) {
  if (!adminQuestsStatus) return;
  adminQuestsStatus.textContent = message;
  adminQuestsStatus.classList.toggle("hidden", !message);
  adminQuestsStatus.classList.toggle("error", isError);
}

function questUuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function collectAdminQuestItems() {
  if (!adminQuestItems) return [];

  return [...adminQuestItems.querySelectorAll(".quest-item-editor")].map((row, index) => ({
    id: row.dataset.itemId || questUuid(),
    title: row.querySelector(".quest-item-title")?.value.trim() || "",
    sort_order: index
  }));
}

async function saveAdminQuests(message = "Quests saved.") {
  if (!currentEventId) {
    setAdminQuestsStatus("Save the event first to store quests.");
    return false;
  }

  const items = collectAdminQuestItems();

  if (items.some(item => !item.title)) {
    setAdminQuestsStatus("Each quest item needs text.", true);
    return false;
  }

  try {
    setAdminQuestsStatus("Saving quests…");
    const { data, error } = await client.rpc("admin_replace_event_quest_items_v55", {
      p_event_id: currentEventId,
      p_items: items
    });
    if (error) throw error;

    setAdminQuestsStatus(message);
    setTimeout(() => {
      if (adminQuestsStatus?.textContent === message) setAdminQuestsStatus("");
    }, 1200);
    return Boolean(data?.ok ?? true);
  } catch (error) {
    setAdminQuestsStatus(`Could not save quests: ${error.message}`, true);
    return false;
  }
}

function addQuestItem(data = {}) {
  if (!questItemTemplate || !adminQuestItems) return;

  const fragment = questItemTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".quest-item-editor");
  const input = row.querySelector(".quest-item-title");

  row.dataset.itemId = data.id || questUuid();
  input.value = data.title || "";

  input.addEventListener("change", () => saveAdminQuests());
  input.addEventListener("blur", () => {
    if (input.value.trim()) saveAdminQuests();
  });

  row.querySelector(".remove-quest-item")?.addEventListener("click", async () => {
    row.remove();
    await saveAdminQuests("Quest removed.");
  });

  adminQuestItems.appendChild(fragment);

  if (!data.title) input.focus();
}

async function loadAdminQuests() {
  if (!adminQuestItems) return;
  adminQuestItems.innerHTML = "";

  if (!currentEventId) {
    setAdminQuestsStatus("");
    return;
  }

  try {
    setAdminQuestsStatus("Loading quests…");
    const { data, error } = await client.rpc("admin_get_event_quest_items_v55", {
      p_event_id: currentEventId
    });
    if (error) throw error;

    let items = data;
    if (typeof items === "string") {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (!Array.isArray(items)) items = [];

    items.forEach(item => addQuestItem(item));
    setAdminQuestsStatus("");
  } catch (error) {
    setAdminQuestsStatus(`Could not load quests: ${error.message}`, true);
  }
}

addQuestItemButton?.addEventListener("click", () => addQuestItem());



// ---------------- Beer Fine ----------------
const beerFineParticipantSelect = document.getElementById("beerFineParticipantSelect");
const beerFineTypeSelect = document.getElementById("beerFineTypeSelect");
const addBeerFineButton = document.getElementById("addBeerFineButton");
const beerFineAdminStatus = document.getElementById("beerFineAdminStatus");
const beerFineLists = {
  beer_line: document.getElementById("beerFineBeerLineList"),
  yellow_card: document.getElementById("beerFineYellowCardList"),
  red_card: document.getElementById("beerFineRedCardList")
};

function setBeerFineStatus(message = "", isError = false) {
  if (!beerFineAdminStatus) return;
  beerFineAdminStatus.textContent = message;
  beerFineAdminStatus.classList.toggle("hidden", !message);
  beerFineAdminStatus.classList.toggle("error", isError);
}

function refreshBeerFineParticipantOptions() {
  if (!beerFineParticipantSelect) return;
  const current = beerFineParticipantSelect.value;
  const rows = [...participantsList.querySelectorAll(".participant-row")]
    .map(row => ({
      id: row.querySelector(".participant-id")?.value || "",
      name: row.querySelector(".participant-name")?.value.trim() || "Participant"
    }))
    .filter(x => x.id)
    .sort((a,b)=>a.name.localeCompare(b.name));

  beerFineParticipantSelect.innerHTML = '<option value="">Select participant</option>';
  rows.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = p.name;
    beerFineParticipantSelect.appendChild(option);
  });
  if (rows.some(p=>p.id===current)) beerFineParticipantSelect.value=current;
}

async function saveBeerFineRow(row) {
  try {
    const paidInput = row.querySelector(".beer-fine-paid");
    const totalInput = row.querySelector(".beer-fine-unpaid");
    const total = Math.max(0, Number(totalInput?.value) || 0);
    const paid = Math.min(total, Math.max(0, Number(paidInput?.value) || 0));
    if (paidInput) paidInput.value = String(paid);

    const { error } = await client.rpc("admin_upsert_beer_fine_v70", {
      p_event_id: currentEventId,
      p_participant_id: row.dataset.participantId,
      p_fine_type: row.dataset.fineType,
      p_paid_count: paid,
      p_unpaid_count: total
    });
    if (error) throw error;
    setBeerFineStatus("Saved.");
  } catch (error) {
    setBeerFineStatus(`Could not save: ${error.message}`, true);
  }
}

function renderBeerFineAdminRow(item) {
  const list=beerFineLists[item.fine_type];
  if (!list) return;
  const row=document.createElement("div");
  row.className="beer-fine-admin-row";
  row.dataset.participantId=item.participant_id;
  row.dataset.fineType=item.fine_type;

  const name=document.createElement("strong");
  name.className="beer-fine-name";
  name.textContent=item.display_name||"Participant";

  const counts=document.createElement("div");
  counts.className="beer-fine-count-editor";

  const makeInput=(labelText, cls, value)=>{
    const label=document.createElement("label");
    const span=document.createElement("span");
    span.textContent=labelText;
    const input=document.createElement("input");
    input.type="number"; input.min="0"; input.step="1";
    input.className=cls; input.value=String(value??0);
    input.addEventListener("focus",()=>{ if(Number(input.value)===0) requestAnimationFrame(()=>input.select()); });
    label.append(span,input);
    return {label,input};
  };
  const paid=makeInput("Paid","beer-fine-paid",item.paid_count);
  const unpaid=makeInput("Total","beer-fine-unpaid",item.total_count ?? item.unpaid_count);
  paid.input.addEventListener("change",()=>saveBeerFineRow(row));
  unpaid.input.addEventListener("change",()=>saveBeerFineRow(row));
  counts.append(paid.label,unpaid.label);

  const remove=document.createElement("button");
  remove.type="button"; remove.className="danger-ghost-button beer-fine-remove"; remove.textContent="×";
  remove.addEventListener("click",async()=>{
    try {
      const {error}=await client.rpc("admin_delete_beer_fine_v70",{
        p_event_id:currentEventId,p_participant_id:row.dataset.participantId,p_fine_type:row.dataset.fineType
      });
      if(error) throw error;
      row.remove();
    } catch(error){ setBeerFineStatus(`Could not remove: ${error.message}`,true); }
  });
  row.append(name,counts,remove);
  list.appendChild(row);
}

async function loadAdminBeerFines() {
  Object.values(beerFineLists).forEach(list=>{if(list) list.innerHTML="";});
  refreshBeerFineParticipantOptions();
  if(!currentEventId) return;
  try {
    const {data,error}=await client.rpc("admin_get_beer_fines_v70",{p_event_id:currentEventId});
    if(error) throw error;
    (Array.isArray(data)?data:[]).forEach(renderBeerFineAdminRow);
    setBeerFineStatus("");
  } catch(error){ setBeerFineStatus(`Could not load: ${error.message}`,true); }
}

addBeerFineButton?.addEventListener("click",async()=>{
  const participantId=beerFineParticipantSelect?.value;
  const fineType=beerFineTypeSelect?.value;
  if(!participantId||!fineType||!currentEventId){ setBeerFineStatus("Choose participant and fine type.",true); return; }
  try {
    const {error}=await client.rpc("admin_add_beer_fine_v70",{
      p_event_id:currentEventId,p_participant_id:participantId,p_fine_type:fineType
    });
    if(error) throw error;
    await loadAdminBeerFines();
    setBeerFineStatus("Fine added.");
  } catch(error){ setBeerFineStatus(`Could not add: ${error.message}`,true); }
});


// ---------------- Competitions ----------------

const landingCompetitionRanking = document.getElementById("landingCompetitionRanking");
const socialCompetitionRanking = document.getElementById("socialCompetitionRanking");

const adminLandingScoreParticipant = document.getElementById("adminLandingScoreParticipant");
const adminLandingPatternScore = document.getElementById("adminLandingPatternScore");
const adminLandingAccuracyScore = document.getElementById("adminLandingAccuracyScore");
const adminLandingFlareScore = document.getElementById("adminLandingFlareScore");
const adminAddLandingScoreButton = document.getElementById("adminAddLandingScoreButton");
const adminLandingScoreStatus = document.getElementById("adminLandingScoreStatus");

function setAdminLandingScoreStatus(message = "", isError = false) {
  if (!adminLandingScoreStatus) return;
  adminLandingScoreStatus.textContent = message;
  adminLandingScoreStatus.classList.toggle("hidden", !message);
  adminLandingScoreStatus.classList.toggle("error", isError);
}

function refreshAdminLandingParticipantSelect(participants = currentCompetitionParticipants()) {
  if (!adminLandingScoreParticipant) return;

  const previous = adminLandingScoreParticipant.value;
  adminLandingScoreParticipant.innerHTML = '<option value="">Select participant</option>';

  participants.forEach(participant => {
    const option = document.createElement("option");
    option.value = participant.participant_id;
    option.textContent = participant.name;
    adminLandingScoreParticipant.appendChild(option);
  });

  if (participants.some(item => item.participant_id === previous)) {
    adminLandingScoreParticipant.value = previous;
  }
}

function currentCompetitionParticipants() {
  const unique = new Map();

  [...participantsList.querySelectorAll(".participant-row")]
    .map(row => ({
      participant_id: row.querySelector(".participant-id")?.value || "",
      name: row.querySelector(".participant-name")?.value.trim() || "Participant"
    }))
    .filter(item => item.participant_id)
    .forEach(item => {
      if (!unique.has(item.participant_id)) {
        unique.set(item.participant_id, item);
      }
    });

  return [...unique.values()];
}

function competitionTotalScore(row) {
  const pattern = Number(row.querySelector(".competition-pattern")?.value) || 0;
  const accuracy = Number(row.querySelector(".competition-accuracy")?.value) || 0;
  const flare = Number(row.querySelector(".competition-flare")?.value) || 0;
  const jumps = Number(row.dataset.jumpCount) || 0;

  if (jumps <= 0) return 0;
  return (pattern + accuracy + flare) / jumps;
}

function refreshCompetitionPlacementNumbers(container) {
  if (!container) return;

  // Landing Competition is ranked automatically:
  // average score = (Pattern + Accuracy + Flare) / number of jumps.
  if (container === landingCompetitionRanking) {
    const rows = [...container.querySelectorAll(".competition-ranking-row")];

    rows.sort((a, b) => {
      const scoreA = competitionTotalScore(a);
      const scoreB = competitionTotalScore(b);

      if (scoreA !== scoreB) return scoreB - scoreA;

      const nameA = a.querySelector(".competition-participant-name")?.textContent || "";
      const nameB = b.querySelector(".competition-participant-name")?.textContent || "";
      return nameA.localeCompare(nameB);
    });

    rows.forEach(row => container.appendChild(row));
  }

  if (container === socialCompetitionRanking) {
    const rows = [...container.querySelectorAll(".competition-ranking-row")];

    rows.sort((a, b) => {
      const scoreA = Number(a.dataset.socialScore) || 0;
      const scoreB = Number(b.dataset.socialScore) || 0;

      if (scoreA !== scoreB) return scoreB - scoreA;

      const nameA = a.querySelector(".competition-participant-name")?.textContent || "";
      const nameB = b.querySelector(".competition-participant-name")?.textContent || "";
      return nameA.localeCompare(nameB);
    });

    rows.forEach(row => container.appendChild(row));
  }

  [...container.querySelectorAll(".competition-ranking-row")].forEach((row, index) => {
    const place = row.querySelector(".competition-place");
    if (place) place.textContent = String(index + 1);

    const total = row.querySelector(".competition-total");
    if (total) total.textContent = competitionTotalScore(row).toFixed(2);
  });
}

async function saveCompetitionRanking(type, container) {
  if (!currentEventId || !container) return;

  const rows = [...container.querySelectorAll(".competition-ranking-row")];
  const payload = rows.map((row, index) => ({
    event_id: currentEventId,
    competition_type: type,
    participant_id: row.dataset.participantId,
    placement: index + 1,
    pattern_score: type === "landing" ? (Number(row.querySelector(".competition-pattern")?.value) || 0) : null,
    accuracy_score: type === "landing" ? (Number(row.querySelector(".competition-accuracy")?.value) || 0) : null,
    flare_score: type === "landing" ? (Number(row.querySelector(".competition-flare")?.value) || 0) : null
  }));

  const participantIds = payload.map(item => item.participant_id);

  if (payload.length) {
    const { error } = await client
      .from("competition_results")
      .upsert(payload, { onConflict: "event_id,competition_type,participant_id" });

    if (error) {
      setStatus(editorStatus, `Could not save competition placement: ${error.message}`, true);
      return;
    }
  }

  // Remove stale rows for participants no longer in this competition list.
  const { data: existing, error: existingError } = await client
    .from("competition_results")
    .select("id,participant_id")
    .eq("event_id", currentEventId)
    .eq("competition_type", type);

  if (!existingError) {
    const staleIds = (existing || [])
      .filter(row => !participantIds.includes(row.participant_id))
      .map(row => row.id);

    if (staleIds.length) {
      await client.from("competition_results").delete().in("id", staleIds);
    }
  }

  refreshCompetitionPlacementNumbers(container);
}

function enableCompetitionDrag(container, type) {
  let dragged = null;

  container.addEventListener("dragstart", event => {
    const row = event.target.closest(".competition-ranking-row");
    if (!row) return;
    dragged = row;
    row.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
  });

  container.addEventListener("dragend", async () => {
    if (dragged) dragged.classList.remove("is-dragging");
    dragged = null;
    refreshCompetitionPlacementNumbers(container);
    await saveCompetitionRanking(type, container);
  });

  container.addEventListener("dragover", event => {
    event.preventDefault();
    if (!dragged) return;

    const target = event.target.closest(".competition-ranking-row");
    if (!target || target === dragged) return;

    const rect = target.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    container.insertBefore(dragged, after ? target.nextSibling : target);
  });
}

function buildCompetitionRow(participant, type, saved = {}) {
  const row = document.createElement("div");
  row.className = `competition-ranking-row ${type === "landing" ? "landing-ranking-row" : ""}`;
  row.draggable = type !== "landing";
  row.dataset.participantId = participant.participant_id;
  row.dataset.jumpCount = String(saved.jump_count ?? 0);

  const place = document.createElement("span");
  place.className = "competition-place";
  place.textContent = "1";

  const drag = document.createElement("span");
  drag.className = "competition-drag-handle";
  drag.textContent = "⋮⋮";
  drag.title = "Drag to change placement";

  const name = document.createElement("strong");
  name.className = "competition-participant-name";
  name.textContent = participant.name;

  if (type === "landing") {
    const makeScoreInput = (className, value) => {
      const input = document.createElement("input");
      input.type = "number";
      input.step = "0.01";
      input.min = "0";
      input.className = `competition-score-input ${className}`;
      input.value = value ?? 0;

      input.addEventListener("focus", () => {
        if (Number(input.value) === 0) {
          requestAnimationFrame(() => input.select());
        }
      });

      input.addEventListener("change", async () => {
        refreshCompetitionPlacementNumbers(landingCompetitionRanking);
        await saveCompetitionRanking("landing", landingCompetitionRanking);
      });
      return input;
    };

    const jumps = document.createElement("span");
    jumps.className = "competition-jumps";
    jumps.textContent = String(saved.jump_count ?? 0);

    const total = document.createElement("strong");
    total.className = "competition-total";
    total.title = "Average score = (P + A + F) ÷ jumps";

    row.append(
      place,
      name,
      jumps,
      makeScoreInput("competition-pattern", saved.pattern_score),
      makeScoreInput("competition-accuracy", saved.accuracy_score),
      makeScoreInput("competition-flare", saved.flare_score),
      total
    );
  } else {
    row.draggable = false;

    const existing = document.createElement("span");
    existing.className = "social-count";
    existing.textContent = String(saved.existing_shakshuka_count ?? 0);

    const seqlife = document.createElement("span");
    seqlife.className = "social-count";
    seqlife.textContent = String(saved.seqlife_count ?? 0);

    const hashtag = document.createElement("span");
    hashtag.className = "social-count";
    hashtag.textContent = String(saved.hashtag_count ?? 0);

    const story = document.createElement("span");
    story.className = "social-count";
    story.textContent = String(saved.story_count ?? 0);

    const post = document.createElement("span");
    post.className = "social-count";
    post.textContent = String(saved.post_count ?? 0);

    const reel = document.createElement("span");
    reel.className = "social-count";
    reel.textContent = String(saved.reel_count ?? 0);

    const score = document.createElement("strong");
    score.className = "competition-total social-total";
    score.textContent = String(saved.total_score ?? 0);

    row.dataset.socialScore = String(saved.total_score ?? 0);

    row.append(place, name, existing, seqlife, hashtag, story, post, reel, score);
  }

  return row;
}

async function loadCompetitionRanking(type, container) {
  if (!container) return;
  container.innerHTML = "";

  const participants = currentCompetitionParticipants();

  if (type === "landing") {
    refreshAdminLandingParticipantSelect(participants);
  }

  if (!participants.length || !currentEventId) {
    container.innerHTML = '<p class="muted small-text">No participants yet.</p>';
    return;
  }

  let data = [];
  let error = null;

  if (type === "landing") {
    const result = await client.rpc("admin_get_landing_competition_v60", {
      p_event_id: currentEventId
    });
    data = result.data || [];
    error = result.error;
  } else {
    const result = await client.rpc("admin_get_social_competition_v66", {
      p_event_id: currentEventId
    });
    data = result.data || [];
    error = result.error;
  }

  if (error) {
    setStatus(editorStatus, `Could not load competition placement: ${error.message}`, true);
    return;
  }

  const savedMap = new Map((data || []).map(item => [item.participant_id, item]));
  const ordered = [...participants].sort((a, b) => {
    if (type === "landing") {
      const aSaved = savedMap.get(a.participant_id) || {};
      const bSaved = savedMap.get(b.participant_id) || {};

      const aJumps = Number(aSaved.jump_count) || 0;
      const bJumps = Number(bSaved.jump_count) || 0;

      const aScore = aJumps > 0
        ? ((Number(aSaved.pattern_score) || 0)
          + (Number(aSaved.accuracy_score) || 0)
          + (Number(aSaved.flare_score) || 0)) / aJumps
        : 0;

      const bScore = bJumps > 0
        ? ((Number(bSaved.pattern_score) || 0)
          + (Number(bSaved.accuracy_score) || 0)
          + (Number(bSaved.flare_score) || 0)) / bJumps
        : 0;

      if (aScore !== bScore) return bScore - aScore;
      return a.name.localeCompare(b.name);
    }

    const aSaved = savedMap.get(a.participant_id) || {};
    const bSaved = savedMap.get(b.participant_id) || {};

    const aScore = Number(aSaved.total_score) || 0;
    const bScore = Number(bSaved.total_score) || 0;

    if (aScore !== bScore) return bScore - aScore;
    return a.name.localeCompare(b.name);
  });

  ordered.forEach(participant => {
    container.appendChild(buildCompetitionRow(
      participant,
      type,
      savedMap.get(participant.participant_id) || {}
    ));
  });

  refreshCompetitionPlacementNumbers(container);
}

async function loadCompetitionPlacements() {
  await Promise.all([
    loadCompetitionRanking("landing", landingCompetitionRanking),
    loadCompetitionRanking("social", socialCompetitionRanking)
  ]);
}

// Landing Competition is ordered automatically by score.
// Social media ranking is also automatic by score.

[adminLandingPatternScore, adminLandingAccuracyScore, adminLandingFlareScore]
  .filter(Boolean)
  .forEach(input => {
    input.addEventListener("focus", () => {
      if (Number(input.value) === 0) {
        requestAnimationFrame(() => input.select());
      }
    });
  });

adminAddLandingScoreButton?.addEventListener("click", async () => {
  const participantId = adminLandingScoreParticipant?.value || "";
  if (!participantId) {
    setAdminLandingScoreStatus("Select a participant.", true);
    return;
  }

  const pattern = Number(adminLandingPatternScore?.value ?? 0);
  const accuracy = Number(adminLandingAccuracyScore?.value ?? 0);
  const flare = Number(adminLandingFlareScore?.value ?? 0);

  const values = [
    ["Pattern", pattern],
    ["Accuracy", accuracy],
    ["Flare", flare]
  ];

  const invalid = values.find(([, value]) =>
    !Number.isFinite(value) || value < 0 || value > 10
  );

  if (invalid) {
    setAdminLandingScoreStatus(`${invalid[0]} must be between 0 and 10.`, true);
    return;
  }

  if (pattern === 0 && accuracy === 0 && flare === 0) {
    setAdminLandingScoreStatus("Enter at least one score above 0.", true);
    return;
  }

  const row = [...landingCompetitionRanking.querySelectorAll(".competition-ranking-row")]
    .find(item => item.dataset.participantId === participantId);

  if (!row) {
    setAdminLandingScoreStatus("Participant was not found in the competition list.", true);
    return;
  }

  adminAddLandingScoreButton.disabled = true;
  setAdminLandingScoreStatus("Adding score…");

  try {
    const patternInput = row.querySelector(".competition-pattern");
    const accuracyInput = row.querySelector(".competition-accuracy");
    const flareInput = row.querySelector(".competition-flare");

    if (patternInput) patternInput.value = String((Number(patternInput.value) || 0) + pattern);
    if (accuracyInput) accuracyInput.value = String((Number(accuracyInput.value) || 0) + accuracy);
    if (flareInput) flareInput.value = String((Number(flareInput.value) || 0) + flare);

    refreshCompetitionPlacementNumbers(landingCompetitionRanking);
    await saveCompetitionRanking("landing", landingCompetitionRanking);

    if (adminLandingPatternScore) adminLandingPatternScore.value = "0";
    if (adminLandingAccuracyScore) adminLandingAccuracyScore.value = "0";
    if (adminLandingFlareScore) adminLandingFlareScore.value = "0";

    setAdminLandingScoreStatus("Score added.");
    setTimeout(() => {
      if (adminLandingScoreStatus?.textContent === "Score added.") {
        setAdminLandingScoreStatus("");
      }
    }, 1800);
  } catch (error) {
    setAdminLandingScoreStatus(`Could not add score: ${error.message}`, true);
  } finally {
    adminAddLandingScoreButton.disabled = false;
  }
});

document.getElementById("refreshLandingCompetitionParticipants")?.addEventListener("click", () => {
  loadCompetitionRanking("landing", landingCompetitionRanking);
});

document.getElementById("refreshSocialCompetitionParticipants")?.addEventListener("click", () => {
  loadCompetitionRanking("social", socialCompetitionRanking);
});


async function saveEvent(status) {
  const name = document.getElementById("eventNameInput").value.trim();
  const startDate = document.getElementById("startDateInput").value;
  const endDate = document.getElementById("endDateInput").value;
  const eventPriceRaw = document.getElementById("eventPriceInput")?.value ?? "";
  const eventPrice = eventPriceRaw === "" ? 0 : Number(eventPriceRaw);

  if (!Number.isFinite(eventPrice) || eventPrice < 0) {
    setStatus(editorStatus, "Event price must be 0 or higher.", true);
    return;
  }

  if (!name || !startDate || !endDate) {
    setStatus(editorStatus, "Event title, start date and end date are required.", true);
    return;
  }
  if (endDate < startDate) {
    setStatus(editorStatus, "End date cannot be before start date.", true);
    return;
  }

  const participants = readParticipantRows();
  if (participants.some(p => !p.name || !p.phone)) {
    setStatus(editorStatus, "Every participant needs a name and phone number.", true);
    return;
  }

  setStatus(editorStatus, status === "published" ? "Publishing event…" : "Saving draft…");
  document.getElementById("saveDraftButton").disabled = true;
  document.getElementById("publishButton").disabled = true;

  try {
    const eventPayload = {
      name,
      start_date: startDate,
      end_date: endDate,
      event_type: getEventType(),
      location_id: locationSelect.value || null,
      venue_id: venueSelect?.value || null,
      venue: document.getElementById("venueInput").value.trim() || null,
      venue_type: eventVenueTypeInput?.value || (getEventType() === "tunnel" ? "tunnel" : "dropzone"),
      venue_url: venueUrlInput?.value.trim() || null,
      description: document.getElementById("descriptionInput").value.trim() || null,
      landing_competition_info: landingCompetitionInfoInput?.value.trim() || null,
      social_media_competition_info: socialMediaCompetitionInfoInput?.value.trim() || null,
      event_price: eventPrice,
      ticket_price: (eventVenueTypeInput?.value || "dropzone") === "dropzone"
        ? (ticketPriceInput?.value ? Number(ticketPriceInput.value) : null)
        : null,
      tunnel_time_cost: (eventVenueTypeInput?.value || "dropzone") === "tunnel"
        ? (tunnelTimeCostInput?.value ? Number(tunnelTimeCostInput.value) : null)
        : null,
      status
    };

    if (currentEventId) {
      const { error } = await client.from("events").update(eventPayload).eq("id", currentEventId);
      if (error) throw error;
    } else {
      const { data, error } = await client.from("events").insert(eventPayload).select("id").single();
      if (error) throw error;
      currentEventId = data.id;
    }

    if (removedMembershipIds.length) {
      const { error } = await client.from("event_participants").delete().in("id", removedMembershipIds);
      if (error) throw error;
      removedMembershipIds = [];
    }

    for (const participant of participants) {
      let participantId = participant.participantId;

      if (participantId) {
        const { error } = await client
          .from("participants")
          .update({
            display_name: participant.name,
            phone: participant.phone || null,
            email: participant.email || null,
            notes: participant.notes || null
          })
          .eq("id", participantId);
        if (error) throw error;
      } else {
        const { data, error } = await client
          .from("participants")
          .insert({
            display_name: participant.name,
            phone: participant.phone || null,
            email: participant.email || null,
            notes: participant.notes || null
          })
          .select("id")
          .single();
        if (error) throw error;
        participantId = data.id;
      }

      const membershipPayload = {
        flight_done: participant.flightDone,
        insurance_done: participant.insuranceDone,
        passport_done: participant.passportDone,
        jersey_done: participant.jerseyDone,
        license_text: participant.licenseText || null,
        reserve_date: participant.reserveDate,
        last_jump_date: participant.lastJumpDate,
        number_of_jumps: participant.numberJumps,
        tunnel_minutes_total: participant.tunnelMinutes,
        canopy_size: participant.canopySize,
        water_training_done: participant.waterTrainingDone,
        canopy_course_done: participant.canopyCourseDone,
        payment_paid: participant.paymentPaid,
        payment_total: eventPrice,
        payment_notes: participant.paymentNotes || null,
        coach_tickets_paid: participant.coachPaid,
        coach_tickets_total: participant.coachTotal
      };

      let membershipId = participant.membershipId;

      if (membershipId) {
        const { error } = await client
          .from("event_participants")
          .update(membershipPayload)
          .eq("id", membershipId);
        if (error) throw error;
      } else {
        const { data: membership, error } = await client
          .from("event_participants")
          .insert({
            event_id: currentEventId,
            participant_id: participantId,
            participant_status: "active",
            ...membershipPayload
          })
          .select("id")
          .single();
        if (error) throw error;
        membershipId = membership.id;
      }
}

    // Event price is the master Payment Total for every participant in this event.
    const { error: paymentTotalError } = await client
      .from("event_participants")
      .update({ payment_total: eventPrice })
      .eq("event_id", currentEventId);

    if (paymentTotalError) throw paymentTotalError;

    if (adminQuestItems?.children.length) {
      const questsSaved = await saveAdminQuests();
      if (!questsSaved) throw new Error("Could not save SHAKSHUKA Quests.");
    }

    if (getEventType() === "skydive" && currentEventId) {
      const { error: coachCalcError } = await client.rpc("recalculate_event_coach_ticket_totals_v30", {
        p_event_id: currentEventId
      });
      if (coachCalcError) throw coachCalcError;
    }

    setStatus(editorStatus, status === "published" ? "Event published successfully." : "Draft saved successfully.");
    await loadAdminEvents();

    setTimeout(() => {
      setAdminEventUrl("");
      showView("dashboard");
    }, 500);
  } catch (error) {
    setStatus(editorStatus, `Could not save event: ${error.message}`, true);
  } finally {
    document.getElementById("saveDraftButton").disabled = false;
    document.getElementById("publishButton").disabled = false;
  }
}

document.getElementById("saveDraftButton").addEventListener("click", () => saveEvent("draft"));
document.getElementById("publishButton").addEventListener("click", () => saveEvent("published"));

client.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") showView("login");
});

routeForSession();


// Keep summary action buttons from toggling their collapsible boxes.
document.getElementById("exportParticipantsButton")?.addEventListener("click", (event) => {
  event.stopPropagation();
});
document.getElementById("exportLogbookButton")?.addEventListener("click", (event) => {
  event.stopPropagation();
});


["startDateInput", "endDateInput"].forEach(id => {
  const input = document.getElementById(id);

  ["change", "input", "blur"].forEach(eventName => {
    input?.addEventListener(eventName, () => {
      currentEventStartDate = document.getElementById("startDateInput")?.value || "";
      currentEventEndDate = document.getElementById("endDateInput")?.value || "";
      refreshNewLogbookDaySelect();
    });
  });
});

newLogbookDaySelect?.addEventListener("focus", refreshNewLogbookDaySelect);
newLogbookDaySelect?.addEventListener("pointerdown", refreshNewLogbookDaySelect);



// routeForSession() is the single source of truth for restoring Admin state.
// Do not run the old dashboard-only restore on DOMContentLoaded, because it
// would override an event restored from ?event=<id> after a page refresh.
