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
const modalPaymentPaid = document.getElementById("modalPaymentPaid");
const modalPaymentLeft = document.getElementById("modalPaymentLeft");
const modalCoachTotal = document.getElementById("modalCoachTotal");
const modalCoachPaid = document.getElementById("modalCoachPaid");
const modalCoachLeft = document.getElementById("modalCoachLeft");
const exportParticipantsButton = document.getElementById("exportParticipantsButton");
const coachTicketsPaymentRow = document.getElementById("coachTicketsPaymentRow");

let currentEventId = null;
let removedMembershipIds = [];
let locations = [];
let editingParticipantRow = null;
let editingLocationId = null;

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

async function updateLoggedInIndicator() {
  const { data: { user } } = await client.auth.getUser();
  loggedInEmail.textContent = user?.email || "";
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
  showView("dashboard");
  await Promise.all([loadLocations(), loadAdminEvents()]);
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
  showView("dashboard");
  await Promise.all([loadLocations(), loadAdminEvents()]);
});

signOutButton.addEventListener("click", async () => {
  await client.auth.signOut();
  loggedInEmail.textContent = "";
  showView("login");
});

async function loadLocations() {
  const { data, error } = await client
    .from("locations")
    .select("id,name,country,city,dropzone,address,active,venue_type")
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
    participantEventTypeBadge.textContent = type === "tunnel" ? "TUNNEL" : "SKYDIVE";
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
    modalPaymentLeft.textContent = formatMoney(calculateLeft(modalPaymentTotal.value, modalPaymentPaid.value));
  }
  if (modalCoachLeft) {
    modalCoachLeft.textContent = formatMoney(calculateLeft(modalCoachTotal.value, modalCoachPaid.value));
  }
}

[modalPaymentTotal, modalPaymentPaid, modalCoachTotal, modalCoachPaid].forEach(input => {
  input?.addEventListener("input", updatePaymentCalculations);
});

function resetEventForm() {
  currentEventId = null;
  removedMembershipIds = [];
  document.getElementById("eventForm").reset();
  setEventType("skydive");
  participantsList.innerHTML = "";
  updateParticipantCount();
  renderLocationOptions("");
  setStatus(editorStatus, "");
  document.getElementById("editorEyebrow").textContent = "NEW EVENT";
  document.getElementById("editorTitle").textContent = "Create travel event";
  hideNewLocationForm();
}

async function openEventEditor(eventId = null) {
  resetEventForm();
  showView("editor");

  if (!eventId) {
    return;
  }

  currentEventId = eventId;
  document.getElementById("editorEyebrow").textContent = "EDIT EVENT";
  document.getElementById("editorTitle").textContent = "Edit travel event";
  setStatus(editorStatus, "Loading event…");

  const { data: event, error: eventError } = await client
    .from("events")
    .select("id,name,start_date,end_date,event_type,location_id,venue,additional_location_info,description,status")
    .eq("id", eventId)
    .single();

  if (eventError) {
    setStatus(editorStatus, eventError.message, true);
    return;
  }

  document.getElementById("eventNameInput").value = event.name || "";
  document.getElementById("startDateInput").value = event.start_date || "";
  document.getElementById("endDateInput").value = event.end_date || "";
  renderLocationOptions(event.location_id || "");
  document.getElementById("venueInput").value = event.venue || "";
document.getElementById("descriptionInput").value = event.description || "";
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
      coachPaid: membership.coach_tickets_paid,
      coachTotal: membership.coach_tickets_total
    });
  });

  setStatus(editorStatus, "");
}

document.getElementById("newEventButton").addEventListener("click", () => openEventEditor());
document.getElementById("backToDashboard").addEventListener("click", async () => {
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
  row.querySelector(".participant-summary-name").textContent = name;
  row.querySelector(".participant-summary-phone").textContent = phone;
}

function openParticipantModal(row) {
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
  document.getElementById("participantCount").textContent = rows.length;
}

function showNewLocationForm(mode = "new") {
  const box = document.getElementById("newLocationBox");
  box.classList.remove("hidden");
  editingLocationId = mode === "edit" ? locationSelect.value : null;

  const deleteButton = document.getElementById("deleteLocationButton");
  if (editingLocationId) {
    const location = locations.find(item => item.id === editingLocationId);
    if (!location) return;
    document.getElementById("locationFormTitle").textContent = "Edit location";
    document.getElementById("locationNameInput").value = location.name || "";
    document.getElementById("locationCountryInput").value = location.country || "";
    document.getElementById("locationCityInput").value = location.city || "";
    document.getElementById("locationTypeInput").value = location.venue_type || "dropzone";
    document.getElementById("locationAddressInput").value = location.address || "";
    deleteButton.classList.remove("hidden");
  } else {
    document.getElementById("locationFormTitle").textContent = "Add a location";
    ["locationNameInput", "locationCountryInput", "locationCityInput", "locationAddressInput"]
      .forEach(id => document.getElementById(id).value = "");
    document.getElementById("locationTypeInput").value = "dropzone";
    deleteButton.classList.add("hidden");
  }
}

function hideNewLocationForm() {
  document.getElementById("newLocationBox").classList.add("hidden");
  editingLocationId = null;
  ["locationNameInput", "locationCountryInput", "locationCityInput", "locationAddressInput"]
    .forEach(id => document.getElementById(id).value = "");
  document.getElementById("locationTypeInput").value = "dropzone";
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
    setStatus(editorStatus, "Location name is required.", true);
    return;
  }

  const payload = {
    name,
    country: document.getElementById("locationCountryInput").value.trim() || null,
    city: document.getElementById("locationCityInput").value.trim() || null,
    venue_type: document.getElementById("locationTypeInput").value,
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
    setStatus(editorStatus, "Location updated.");
  } else {
    const { data, error } = await client.from("locations").insert(payload).select().single();
    if (error) {
      setStatus(editorStatus, `Could not add location: ${error.message}`, true);
      return;
    }
    locations.push(data);
    renderLocationOptions(data.id);
    setStatus(editorStatus, "Location added.");
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

async function saveEvent(status) {
  const name = document.getElementById("eventNameInput").value.trim();
  const startDate = document.getElementById("startDateInput").value;
  const endDate = document.getElementById("endDateInput").value;

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
      venue: document.getElementById("venueInput").value.trim() || null,
description: document.getElementById("descriptionInput").value.trim() || null,
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
        payment_total: participant.paymentTotal,
        coach_tickets_paid: participant.coachPaid,
        coach_tickets_total: participant.coachTotal
      };

      if (participant.membershipId) {
        const { error } = await client
          .from("event_participants")
          .update(membershipPayload)
          .eq("id", participant.membershipId);
        if (error) throw error;
      } else {
        const { error } = await client
          .from("event_participants")
          .insert({
            event_id: currentEventId,
            participant_id: participantId,
            participant_status: "active",
            ...membershipPayload
          });
        if (error) throw error;
      }
    }

    setStatus(editorStatus, status === "published" ? "Event published successfully." : "Draft saved successfully.");
    await loadAdminEvents();

    setTimeout(() => {
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
