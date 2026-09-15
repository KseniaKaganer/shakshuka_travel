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
  beerFinesLoadedOnce = false;
  beerFinesLoading = false;
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

  const paymentLeft = Math.max(0, paymentTotal - paymentPaid);
  const coachLeft = Math.max(0, coachTotal - coachPaid);

  setText("selfPaymentTotal", formatMoney(paymentTotal), "0.00");
  setText("selfPaymentPaid", formatMoney(paymentPaid), "0.00");
  setText("selfPaymentLeft", formatMoney(paymentLeft), "0.00");

  setText("selfCoachTotal", formatMoney(coachTotal), "0.00");
  setText("selfCoachPaid", formatMoney(coachPaid), "0.00");
  setText("selfCoachLeft", formatMoney(coachLeft), "0.00");

  document.getElementById("selfPaymentLeft")?.classList.toggle("payment-due", paymentLeft > 0);
  document.getElementById("selfCoachLeft")?.classList.toggle("payment-due", coachLeft > 0);

  const notesBox = document.getElementById("participantPaymentNotesBox");
  const notesText = document.getElementById("participantPaymentNotesText");
  const paymentNotes = String(data.payment_notes || "").trim();

  if (notesBox && notesText) {
    notesText.textContent = paymentNotes;
    notesBox.classList.toggle("hidden", !paymentNotes);
  }

  const coachCard = document.getElementById("selfCoachPaymentCard");
  if (coachCard) {
    coachCard.classList.toggle("hidden", (data.event_type || loadedEvent?.event_type) === "tunnel");
  }
}


async function loadParticipantPaymentNotes() {
  if (!participantSessionToken) return;

  try {
    const { data, error } = await client.rpc("get_participant_payment_notes_by_token_v54", {
      p_event_id: eventId,
      p_token: participantSessionToken
    });

    if (error) throw error;

    const notes = String(data?.payment_notes || "").trim();
    const box = document.getElementById("participantPaymentNotesBox");
    const text = document.getElementById("participantPaymentNotesText");

    if (box && text) {
      text.textContent = notes;
      box.classList.toggle("hidden", !notes);
    }
  } catch (error) {
    console.warn("Could not load payment notes:", error);
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

  if (!participantSessionToken || !list || !status) return;

  status.textContent = "Loading logbook…";
  status.classList.remove("hidden", "error");

  const { data, error } = await client.rpc("get_participant_skydive_logbook_by_token_v29", {
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

  const rows = Array.isArray(data) ? data : [];
  const totalJumps = rows.length;
  const coachedRows = rows.filter(entry => String(entry.coach_name || "").trim());
  const coachedJumps = coachedRows.length;

  setText("participantTotalJumps", String(totalJumps), "0");
  setText("participantCoachedJumps", String(coachedJumps), "0");

  // Each coached group's coach ticket is shared equally between
  // all jumpers in that group. The participant's coach-ticket total
  // is the sum of their share for every coached jump.
  if ((participantAccess?.event_type || loadedEvent?.event_type) === "skydive") {
    const calculatedCoachTotal = coachedRows.reduce((sum, entry) => {
      const ticketPrice = moneyNumber(entry.ticket_price);
      const groupSize = Array.isArray(entry.group_participants)
        ? entry.group_participants.length
        : 0;

      return sum + (groupSize > 0 ? ticketPrice / groupSize : 0);
    }, 0);

    const coachPaid = moneyNumber(participantAccess?.coach_tickets_paid);

    setText("selfCoachTotal", formatMoney(calculatedCoachTotal), "0.00");
    setText("selfCoachPaid", formatMoney(coachPaid), "0.00");
    setText(
      "selfCoachLeft",
      formatMoney(Math.max(0, calculatedCoachTotal - coachPaid)),
      "0.00"
    );
  }

  if (!rows.length) {
    list.innerHTML = '<p class="muted">No jumps entered yet.</p>';
    return;
  }

  const byDay = new Map();

  rows.forEach(entry => {
    const key = entry.day_date || "";
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(entry);
  });

  list.innerHTML = [...byDay.entries()].map(([dayDate, entries]) => {
    const first = entries[0];
    const dayTitle = first?.day_title || "Day";
    const dateLabel = formatLogbookDate(dayDate);

    const rowsHtml = entries.map(entry => {
      const groupParticipants = Array.isArray(entry.group_participants)
        ? entry.group_participants
        : [];

      const groupLabel = groupParticipants.length
        ? groupParticipants.map(name => escapeHtml(name)).join(", ")
        : "—";

      return `
        <tr>
          <td>${escapeHtml(String(entry.load_number ?? ""))}</td>
          <td>${entry.coach_name ? escapeHtml(entry.coach_name) : "—"}</td>
          <td>${groupLabel}</td>
        </tr>
      `;
    }).join("");

    return `
      <section class="participant-logbook-day">
        <div class="participant-logbook-day-header">
          <h3>${escapeHtml(dayTitle)}</h3>
          <span>${escapeHtml(dateLabel)}</span>
        </div>

        <div class="participant-logbook-table-wrap">
          <table class="participant-logbook-table">
            <thead>
              <tr>
                <th>Load</th>
                <th>Coach</th>
                <th>Group</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }).join("");
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


async function loadParticipantQuests() {
  const list = document.getElementById("participantQuestsList");
  const status = document.getElementById("participantQuestsStatus");

  if (!list || !status || !participantSessionToken) return;

  status.textContent = "Loading quests…";
  status.classList.remove("hidden", "error");

  try {
    const { data, error } = await client.rpc("get_participant_quest_items_by_token_v55", {
      p_event_id: eventId,
      p_token: participantSessionToken
    });

    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    status.classList.add("hidden");
    list.innerHTML = "";

    const progressEl = document.getElementById("participantQuestProgress");
    const updateQuestProgress = () => {
      const total = rows.length;
      const done = rows.filter(item => Boolean(item.checked)).length;
      if (progressEl) progressEl.textContent = `${done} / ${total}`;
    };
    updateQuestProgress();

    if (!rows.length) {
      list.innerHTML = '<p class="muted">No quests yet.</p>';
      return;
    }

    const items = document.createElement("div");
    items.className = "participant-quest-items";

    rows.forEach(item => {
      const label = document.createElement("label");
      label.className = "participant-quest-row";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(item.checked);

      const text = document.createElement("span");
      text.textContent = item.item_title || "Quest";

      checkbox.addEventListener("change", async () => {
        const requestedValue = checkbox.checked;
        checkbox.disabled = true;

        try {
          const { data: result, error: updateError } = await client.rpc(
            "set_participant_quest_check_by_token_v47",
            {
              p_event_id: eventId,
              p_token: participantSessionToken,
              p_item_id: item.item_id,
              p_checked: requestedValue
            }
          );

          if (updateError) throw updateError;
          if (!result?.ok) throw new Error("Could not verify participant session.");

          item.checked = requestedValue;
          label.classList.toggle("is-complete", requestedValue);
          updateQuestProgress();
        } catch (updateError) {
          checkbox.checked = !requestedValue;
          status.textContent = `Could not update quest: ${updateError.message}`;
          status.classList.remove("hidden");
          status.classList.add("error");
        } finally {
          checkbox.disabled = false;
        }
      });

      label.classList.toggle("is-complete", checkbox.checked);
      label.append(checkbox, text);
      items.appendChild(label);
    });

    list.appendChild(items);
  } catch (error) {
    status.textContent = `Could not load quests: ${error.message}`;
    status.classList.remove("hidden");
    status.classList.add("error");
  }
}





async function loadParticipantRoom() {
  const content = document.getElementById("participantRoomContent");
  const status = document.getElementById("participantRoomsStatus");
  if (!content || !status || !participantSessionToken) return;

  status.textContent = "Loading rooms…";
  status.classList.remove("hidden", "error");
  content.innerHTML = "";

  try {
    const { data, error } = await client.rpc("get_event_rooms_by_token_v120", {
      p_event_id: eventId,
      p_token: participantSessionToken
    });

    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not load rooms.");

    status.classList.add("hidden");

    const rooms = Array.isArray(data?.rooms) ? data.rooms : [];
    const ownRoomId = data?.own_room_id || null;
    const isHotel = Boolean(data?.is_hotel);

    if (!rooms.length) {
      content.innerHTML = '<p class="muted">No rooms have been added yet.</p>';
      return;
    }

    const list = document.createElement("div");
    list.className = "participant-room-flat-list";

    rooms.forEach((room, index) => {
      const occupants = [
        ...(room.participants || []).map(person => ({
          person_type: "participant",
          person_id: person.participant_id,
          display_name: person.display_name || "Participant"
        })),
        ...(room.people || []).map(person => ({
          person_type: person.person_type || "other",
          person_id: person.id,
          display_name: person.display_name || "Other person"
        }))
      ].sort((a,b) => a.display_name.localeCompare(b.display_name));

      const isOwnRoom = room.id === ownRoomId;

      const row = document.createElement("div");
      row.className = "participant-room-flat-row";
      row.classList.toggle("is-own-room", isOwnRoom);

      const roomInfo = document.createElement("div");
      roomInfo.className = "participant-room-flat-info";

      const number = document.createElement("strong");
      number.className = "participant-room-flat-number";
      number.textContent = isHotel
        ? (room.room_number || String(index + 1))
        : String(room.room_index || index + 1);

      const names = document.createElement("div");
      names.className = "participant-room-flat-names";

      if (!occupants.length) {
        const empty = document.createElement("span");
        empty.className = "muted";
        empty.textContent = "—";
        names.appendChild(empty);
      } else {
        occupants.forEach((person, personIndex) => {
          const name = document.createElement("span");
          name.className = "participant-room-flat-name";
          name.textContent = person.display_name;

          if (
            person.person_type === "participant" &&
            person.person_id === participantAccess?.participant_id
          ) {
            name.classList.add("is-me");
          }

          names.appendChild(name);

          if (personIndex < occupants.length - 1) {
            const separator = document.createElement("span");
            separator.className = "participant-room-name-separator";
            separator.textContent = " · ";
            names.appendChild(separator);
          }
        });
      }

      roomInfo.append(number, names);

      if (isOwnRoom) {
        const badge = document.createElement("span");
        badge.className = "participant-own-room-badge";
        badge.textContent = "Your room";
        roomInfo.appendChild(badge);
      }

      row.appendChild(roomInfo);

      if (isHotel && isOwnRoom) {
        const edit = document.createElement("div");
        edit.className = "participant-room-inline-edit";

        const input = document.createElement("input");
        input.type = "text";
        input.inputMode = "numeric";
        input.maxLength = 3;
        input.pattern = "\\d{3}";
        input.placeholder = "000";
        input.value = room.room_number || "";
        input.setAttribute("aria-label", "Hotel room number");

        const save = document.createElement("button");
        save.type = "button";
        save.className = "secondary-button compact-button";
        save.textContent = "Save";

        input.addEventListener("input", () => {
          input.value = input.value.replace(/\D/g, "").slice(0, 3);
        });

        save.addEventListener("click", async () => {
          const value = input.value.trim();

          if (value && !/^\d{3}$/.test(value)) {
            status.textContent = "Room number must be exactly 3 digits.";
            status.classList.remove("hidden");
            status.classList.add("error");
            return;
          }

          save.disabled = true;
          try {
            const { data: result, error: updateError } = await client.rpc(
              "set_own_room_number_by_token_v117",
              {
                p_event_id: eventId,
                p_token: participantSessionToken,
                p_room_number: value || null
              }
            );

            if (updateError) throw updateError;
            if (result?.ok === false) {
              throw new Error(result?.error || "Could not save room number.");
            }

            status.textContent = "Room number saved.";
            status.classList.remove("hidden", "error");
            setTimeout(() => status.classList.add("hidden"), 1200);
            await loadParticipantRoom();
          } catch (updateError) {
            status.textContent = `Could not save room number: ${updateError.message}`;
            status.classList.remove("hidden");
            status.classList.add("error");
          } finally {
            save.disabled = false;
          }
        });

        edit.append(input, save);
        row.appendChild(edit);
      }

      list.appendChild(row);
    });

    content.appendChild(list);
  } catch (error) {
    status.textContent = `Could not load rooms: ${error.message}`;
    status.classList.remove("hidden");
    status.classList.add("error");
  }
}


async function loadParticipantTransportation() {
  const list = document.getElementById("participantTransportationList");
  const status = document.getElementById("participantTransportationStatus");
  if (!list || !status || !participantSessionToken) return;

  list.innerHTML = "";
  status.textContent = "Loading transportation…";
  status.classList.remove("hidden", "error");

  try {
    const { data, error } = await client.rpc("get_my_transportation_by_token_v127", {
      p_event_id: eventId,
      p_token: participantSessionToken
    });

    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error || "Could not load transportation.");

    status.classList.add("hidden");
    const items = Array.isArray(data?.transportation) ? data.transportation : [];

    if (!items.length) {
      list.innerHTML = '<p class="muted">No transportation assigned to you.</p>';
      return;
    }

    const typeIcons = {
      car: "🚗",
      train: "🚆",
      bus: "🚌",
      flight: "✈️",
      taxi: "🚕"
    };

    const typeLabels = {
      car: "Car",
      train: "Train",
      bus: "Bus",
      flight: "Flight",
      taxi: "Taxi"
    };

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "participant-transport-card";

      const main = document.createElement("div");
      main.className = "participant-transport-main";

      const icon = document.createElement("span");
      icon.className = "participant-transport-icon";
      icon.textContent = typeIcons[item.transport_type] || "🚐";

      const info = document.createElement("div");
      info.className = "participant-transport-info";

      const title = document.createElement("strong");
      title.textContent = typeLabels[item.transport_type] || "Transportation";

      const timing = document.createElement("div");
      timing.className = "participant-transport-time-text";

      const dateText = item.travel_date
        ? new Date(`${item.travel_date}T12:00:00`).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit"
          })
        : "";

      const startText = item.departure_time ? String(item.departure_time).slice(0,5) : "";
      const arrivalText = item.arrival_time ? String(item.arrival_time).slice(0,5) : "";
      timing.textContent = [
        dateText,
        startText && arrivalText ? `${startText} – ${arrivalText}` : startText
      ].filter(Boolean).join(" · ");

      info.append(title, timing);
      main.append(icon, info);

      const luggage = document.createElement("div");
      luggage.className = "participant-transport-luggage";

      const luggageTypes = [
        { key: "suitcase", icon: "🧳", label: "Suitcase" },
        { key: "trolley", icon: "🛄", label: "Trolley" },
        { key: "backpack", icon: "🎒", label: "Backpack" }
      ];

      luggageTypes.forEach(entry => {
        const field = document.createElement("label");
        field.className = "luggage-counter";
        field.title = entry.label;

        const luggageIcon = document.createElement("span");
        luggageIcon.className = "luggage-icon";
        luggageIcon.textContent = entry.icon;

        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.max = "9";
        input.step = "1";
        input.inputMode = "numeric";
        input.value = String(Math.max(0, Number(item.luggage?.[entry.key] || 0)));
        input.setAttribute("aria-label", entry.label);

        input.addEventListener("focus", () => {
          if (input.value === "0") input.select();
        });

        input.addEventListener("change", async () => {
          const value = Math.max(0, Math.min(9, Number.parseInt(input.value || "0", 10) || 0));
          input.value = String(value);

          const current = {
            suitcase: Number(item.luggage?.suitcase || 0),
            trolley: Number(item.luggage?.trolley || 0),
            backpack: Number(item.luggage?.backpack || 0)
          };
          current[entry.key] = value;

          try {
            const { data: result, error: saveError } = await client.rpc(
              "set_my_transport_luggage_by_token_v127",
              {
                p_event_id: eventId,
                p_token: participantSessionToken,
                p_transport_id: item.id,
                p_suitcase: current.suitcase,
                p_trolley: current.trolley,
                p_backpack: current.backpack
              }
            );

            if (saveError) throw saveError;
            if (result?.ok === false) throw new Error(result?.error || "Could not save luggage.");
            item.luggage = current;
          } catch (saveError) {
            status.textContent = `Could not save luggage: ${saveError.message}`;
            status.classList.remove("hidden");
            status.classList.add("error");
          }
        });

        field.append(luggageIcon, input);
        luggage.appendChild(field);
      });

      card.append(main, luggage);
      list.appendChild(card);
    });
  } catch (error) {
    status.textContent = `Could not load transportation: ${error.message}`;
    status.classList.remove("hidden");
    status.classList.add("error");
  }
}


async function loadParticipantSchedule() {
  const list = document.getElementById("participantScheduleList");
  const status = document.getElementById("participantScheduleStatus");
  if (!list || !status || !participantSessionToken) return;

  status.textContent = "Loading schedule…";
  status.classList.remove("hidden", "error");

  try {
    const { data, error } = await client.rpc("get_event_schedule_by_token_v109", {
      p_event_id: eventId,
      p_token: participantSessionToken
    });
    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    list.innerHTML = "";
    status.classList.add("hidden");

    if (!rows.length) {
      list.innerHTML = '<p class="muted">No schedule has been added yet.</p>';
      return;
    }

    const days = new Map();
    rows.forEach(row => {
      if (!days.has(row.day_date)) {
        days.set(row.day_date, {
          day_date: row.day_date,
          day_title: row.day_title || "",
          items: []
        });
      }
      if (row.item_id) days.get(row.day_date).items.push(row);
    });

    [...days.values()].forEach((day, dayIndex) => {
      const dayBox = document.createElement("section");
      dayBox.className = "participant-schedule-day";

      const head = document.createElement("div");
      head.className = "participant-schedule-day-head";

      const label = document.createElement("div");
      const [y,m,d] = String(day.day_date).split("-");
      const dateText = d && m ? `${d}/${m}/${String(y).slice(-2)}` : day.day_date;

      const dayNumber = document.createElement("strong");
      dayNumber.textContent = `Day ${dayIndex} · ${dateText}`;

      label.appendChild(dayNumber);

      if (day.day_title) {
        const title = document.createElement("span");
        title.className = "participant-schedule-day-title";
        title.textContent = day.day_title;
        label.appendChild(title);
      }

      head.appendChild(label);
      dayBox.appendChild(head);

      if (!day.items.length) {
        const empty = document.createElement("p");
        empty.className = "muted small-text participant-schedule-empty";
        empty.textContent = "No scheduled items.";
        dayBox.appendChild(empty);
      } else {
        const items = document.createElement("div");
        items.className = "participant-schedule-day-items";

        day.items
          .sort((a,b) => String(a.item_time || "99:99").localeCompare(String(b.item_time || "99:99")))
          .forEach(item => {
            const row = document.createElement("div");
            row.className = "participant-schedule-item";

            const when = document.createElement("div");
            when.className = "participant-schedule-when";

            if (item.item_time) {
              const time = document.createElement("span");
              const startText = String(item.item_time).slice(0,5);
              const endText = item.end_time ? String(item.end_time).slice(0,5) : "";
              time.textContent = endText ? `${startText} – ${endText}` : startText;
              when.appendChild(time);
            }

            const body = document.createElement("div");
            body.className = "participant-schedule-body";

            const title = document.createElement("strong");
            title.textContent = item.title || "Activity";
            body.appendChild(title);

            if (item.details) {
              const details = document.createElement("p");
              details.textContent = item.details;
              body.appendChild(details);
            }

            row.append(when, body);
            items.appendChild(row);
          });

        dayBox.appendChild(items);
      }

      list.appendChild(dayBox);
    });
  } catch (error) {
    status.textContent = `Could not load schedule: ${error.message}`;
    status.classList.remove("hidden");
    status.classList.add("error");
  }
}

async function loadParticipantCanopyTraining() {
  const list = document.getElementById("participantCanopyTrainingList");
  const status = document.getElementById("participantCanopyTrainingStatus");
  const progress = document.getElementById("participantCanopyProgress");
  const courseLabel = document.getElementById("participantCanopyCourseLabel");

  if (!list || !status || !participantSessionToken) return;

  status.textContent = "Loading Canopy Training…";
  status.classList.remove("hidden", "error");

  try {
    const { data, error } = await client.rpc("get_canopy_training_by_token_v100", {
      p_event_id: eventId,
      p_token: participantSessionToken
    });

    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    status.classList.add("hidden");
    list.innerHTML = "";

    const levels = [...new Set(rows.map(item => item.course_level).filter(Boolean))];
    if (courseLabel) {
      courseLabel.textContent = levels.length ? levels.join(" + ") : "No course assigned";
    }

    const updateProgress = () => {
      const total = rows.length;
      const done = rows.filter(item => Boolean(item.checked)).length;
      if (progress) progress.textContent = `${done} / ${total}`;
    };
    updateProgress();

    if (!rows.length) {
      list.innerHTML = '<p class="muted">You are not assigned to CT1 or CT2 yet.</p>';
      return;
    }

    levels.forEach(level => {
      const section = document.createElement("section");
      section.className = "participant-canopy-course";

      const head = document.createElement("div");
      head.className = "participant-canopy-course-head";

      const title = document.createElement("strong");
      title.textContent = level;
      head.appendChild(title);

      const items = document.createElement("div");
      items.className = "participant-quest-items";

      rows
        .filter(item => item.course_level === level)
        .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
        .forEach(item => {
          const label = document.createElement("label");
          label.className = "participant-quest-row";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = Boolean(item.checked);

          const text = document.createElement("span");
          text.textContent = item.task_title || "Task";

          checkbox.addEventListener("change", async () => {
            const requestedValue = checkbox.checked;
            checkbox.disabled = true;

            try {
              const { data: result, error: updateError } = await client.rpc(
                "set_canopy_training_check_by_token_v100",
                {
                  p_event_id: eventId,
                  p_token: participantSessionToken,
                  p_task_id: item.task_id,
                  p_checked: requestedValue
                }
              );

              if (updateError) throw updateError;
              if (!result?.ok) throw new Error(result?.error || "Could not update task.");

              item.checked = requestedValue;
              label.classList.toggle("is-complete", requestedValue);
              updateProgress();
            } catch (updateError) {
              checkbox.checked = !requestedValue;
              status.textContent = `Could not update task: ${updateError.message}`;
              status.classList.remove("hidden");
              status.classList.add("error");
            } finally {
              checkbox.disabled = false;
            }
          });

          label.classList.toggle("is-complete", checkbox.checked);
          label.append(checkbox, text);
          items.appendChild(label);
        });

      section.append(head, items);
      list.appendChild(section);
    });
  } catch (error) {
    status.textContent = `Could not load Canopy Training: ${error.message}`;
    status.classList.remove("hidden");
    status.classList.add("error");
  }
}


function formatCompetitionScore(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : number.toFixed(1).replace(/\.0$/, "");
}

function showLandingScoreStatus(message = "", isError = false) {
  const status = document.getElementById("landingScoreStatus");
  if (!status) return;

  status.textContent = message;
  status.classList.toggle("hidden", !message);
  status.classList.toggle("error", isError);
}

async function loadLandingCompetitionLeaderboard() {
  const body = document.getElementById("landingLeaderboardBody");
  if (!body || !participantSessionToken) return;

  try {
    const { data, error } = await client.rpc("get_landing_competition_leaderboard_by_token_v57", {
      p_event_id: eventId,
      p_token: participantSessionToken
    });

    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    body.innerHTML = "";

    if (!rows.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 9;
      cell.className = "muted";
      cell.textContent = "No participants yet.";
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }

    rows.forEach((entry, index) => {
      const row = document.createElement("tr");

      if (entry.participant_id === participantAccess?.participant_id) {
        row.classList.add("is-me");
      }

      const values = [
        index + 1,
        entry.display_name || "Participant",
        Number(entry.jump_count) || 0,
        formatCompetitionScore(entry.pattern_score),
        formatCompetitionScore(entry.accuracy_score),
        formatCompetitionScore(entry.flare_score),
        formatCompetitionScore(entry.total_score)
      ];

      values.forEach((value, cellIndex) => {
        const cell = document.createElement("td");
        cell.textContent = String(value);

        if (cellIndex === 1) cell.classList.add("landing-participant-name");
        if (cellIndex === 6) cell.classList.add("landing-total-score");

        row.appendChild(cell);
      });

      body.appendChild(row);
    });
  } catch (error) {
    console.warn("Could not load landing leaderboard:", error);
    showLandingScoreStatus(`Could not load scores: ${error.message}`, true);
  }
}




// ---------------- Beer Fine ----------------
const beerFineEventLists = {
  beer_line: document.getElementById("beerFineEventBeerLineList"),
  yellow_card: document.getElementById("beerFineEventYellowCardList"),
  red_card: document.getElementById("beerFineEventRedCardList")
};

let beerFinesLoadedOnce = false;
let beerFinesLoading = false;

async function loadBeerFines(force = false) {
  if ((!force && beerFinesLoadedOnce) || beerFinesLoading) return;
  beerFinesLoading = true;
  if(!participantSessionToken) {
    beerFinesLoading = false;
    document.getElementById("beerFineUnpaidAlert")?.classList.add("hidden");
    return;
  }
  try {
    const {data,error}=await client.rpc("get_beer_fines_by_token_v70",{p_event_id:eventId,p_token:participantSessionToken});
    if(error) throw error;
    const rows=Array.isArray(data)?data:[];

    Object.values(beerFineEventLists).forEach(list=>{
      if(list) list.innerHTML="";
    });
    const unpaidAlert = document.getElementById("beerFineUnpaidAlert");
    const myParticipantId =
      participantAccess?.participant_id ||
      participantAccess?.id ||
      participantAccess?.participantId ||
      null;
    const hasMyUnpaidFine = rows.some(item => {
      const paid = Number(item.paid_count) || 0;
      const total = Number(
        item.total_count != null ? item.total_count : item.unpaid_count
      ) || 0;

      const sameParticipant =
        item.is_me === true ||
        (Boolean(myParticipantId) &&
          String(item.participant_id || "") === String(myParticipantId)) ||
        (
          String(item.display_name || "").trim().toLowerCase() ===
          String(participantAccess?.display_name || "").trim().toLowerCase()
        );

      return sameParticipant && total > 0 && paid < total;
    });

    if (unpaidAlert) {
      unpaidAlert.classList.toggle("hidden", !hasMyUnpaidFine);
    }

    let myPaidFines = 0;
    let myTotalFines = 0;

    rows.forEach(item=>{
      const list=beerFineEventLists[item.fine_type];
      if(!list) return;

      const row=document.createElement("div");
      row.className="beer-fine-event-row";

      const name=document.createElement("strong");
      name.textContent=item.display_name||"Participant";

      const paidCount = Number(item.paid_count) || 0;
      const totalCount = Number(
        item.total_count != null ? item.total_count : item.unpaid_count
      ) || 0;

      const ratio=document.createElement("span");
      ratio.className="beer-fine-ratio";
      ratio.textContent=`${paidCount}/${totalCount}`;
      ratio.title="Paid / total fines";

      row.append(name,ratio);

      const isMine = item.is_me === true || (
        Boolean(myParticipantId) &&
        String(item.participant_id || "") === String(myParticipantId)
      );

      const isMyFine = isMine || (
        String(item.display_name || "").trim().toLowerCase() ===
        String(participantAccess?.display_name || "").trim().toLowerCase()
      );

      if (isMyFine) {
        myPaidFines += paidCount;
        myTotalFines += totalCount;
      }

      if (isMyFine && totalCount > 0 && paidCount < totalCount) {
        row.classList.add("is-my-beer-fine");

        const paidButton=document.createElement("button");
        paidButton.type="button";
        paidButton.className="beer-fine-mark-paid";
        paidButton.textContent="Mark 1 paid";
        paidButton.addEventListener("click", async () => {
          paidButton.disabled = true;
          paidButton.textContent = "Saving…";

          try {
            const { data: result, error: payError } = await client.rpc(
              "participant_mark_beer_fine_paid_v77",
              {
                p_event_id: eventId,
                p_token: participantSessionToken,
                p_fine_type: item.fine_type
              }
            );

            if (payError) throw payError;
            if (!result?.ok) throw new Error(result?.error || "Could not update Beer Fine.");

            await loadBeerFines(true);
          } catch (payError) {
            console.warn("Could not mark Beer Fine paid:", payError);
            paidButton.disabled = false;
            paidButton.textContent = "Try again";
          }
        });

        row.appendChild(paidButton);
      }

      list.appendChild(row);
    });
    const myFineSummary = document.getElementById("participantBeerFineSummary");
    if (myFineSummary) {
      myFineSummary.textContent = `Your fines: ${myPaidFines} / ${myTotalFines} paid`;
      myFineSummary.classList.toggle("has-unpaid", myPaidFines < myTotalFines);
    }

    Object.values(beerFineEventLists).forEach(list=>{
      if(list && !list.children.length){
        const empty=document.createElement("div");
        empty.className="beer-fine-empty muted small-text";
        empty.textContent="No fines";
        list.appendChild(empty);
      }
    });

    beerFinesLoadedOnce = true;
  } catch(error){
    console.warn("Could not load Beer Fine:",error);
  } finally {
    beerFinesLoading = false;
  }
}


function showSocialScoreStatus(message = "", isError = false) {
  const status = document.getElementById("socialScoreStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("hidden", !message);
  status.classList.toggle("error", isError);
}

async function loadSocialCompetitionLeaderboard() {
  const body = document.getElementById("socialLeaderboardBody");
  if (!body || !participantSessionToken) return;

  try {
    const { data, error } = await client.rpc("get_social_competition_leaderboard_by_token_v66", {
      p_event_id: eventId,
      p_token: participantSessionToken
    });

    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    body.innerHTML = "";

    if (!rows.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 7;
      cell.className = "muted";
      cell.textContent = "No participants yet.";
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }

    rows.forEach((entry, index) => {
      const row = document.createElement("tr");
      if (entry.participant_id === participantAccess?.participant_id) {
        row.classList.add("is-me");
      }

      const values = [
        index + 1,
        entry.display_name || "Participant",
        Number(entry.existing_shakshuka_count) || 0,
        Number(entry.seqlife_count) || 0,
        Number(entry.hashtag_count) || 0,
        Number(entry.story_count) || 0,
        Number(entry.post_count) || 0,
        Number(entry.reel_count) || 0,
        Number(entry.total_score) || 0
      ];

      values.forEach((value, cellIndex) => {
        const cell = document.createElement("td");
        cell.textContent = String(value);
        if (cellIndex === 1) cell.classList.add("social-participant-name");
        if (cellIndex === 8) cell.classList.add("social-total-score");
        row.appendChild(cell);
      });

      body.appendChild(row);
    });
  } catch (error) {
    console.warn("Could not load social media competition:", error);
    showSocialScoreStatus(`Could not load scores: ${error.message}`, true);
  }
}

async function addMySocialScore(action, button) {
  if (!participantSessionToken || !action) return;

  button.disabled = true;
  showSocialScoreStatus("Adding…");

  try {
    const { data, error } = await client.rpc("add_participant_social_score_by_token_v66", {
      p_event_id: eventId,
      p_token: participantSessionToken,
      p_action: action
    });

    if (error) throw error;
    if (!data?.ok) throw new Error(data?.error || "Could not verify participant session.");

    showSocialScoreStatus(`+${data.points_added} points`);
    await loadSocialCompetitionLeaderboard();

    setTimeout(() => {
      const status = document.getElementById("socialScoreStatus");
      if (status?.textContent?.startsWith("+")) showSocialScoreStatus("");
    }, 1400);
  } catch (error) {
    showSocialScoreStatus(`Could not add score: ${error.message}`, true);
  } finally {
    button.disabled = false;
  }
}

document.querySelectorAll("[data-social-action]").forEach(button => {
  button.addEventListener("click", () => addMySocialScore(button.dataset.socialAction, button));
});


function showLoggedInView(data) {
  participantAccess = data;
  loginScreen.classList.add("hidden");
  eventEl.classList.remove("hidden");
  sessionIndicator.classList.remove("hidden");

  setText("participantSessionName", data.display_name, "");
  setText("participantWelcomeName", data.display_name, "Participant");
  renderParticipantFields(data);
  renderPaymentStatus(data);
  loadParticipantPaymentNotes();
  renderMissingAdminInfo(data);
  loadParticipantLogbook();
  loadParticipantSchedule();
  loadParticipantRoom();
  loadParticipantQuests();
  loadParticipantCanopyTraining();
  loadLandingCompetitionLeaderboard();
  loadSocialCompetitionLeaderboard();
  loadBeerFines();
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
        venue_type,
        venue_url,
        ticket_price,
        tunnel_time_cost,
        description,
        landing_competition_info,
        social_media_competition_info,
        status,
        locations (
          name,
          city,
          country,
          address,
          location_type,
          website_url
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
    setText("landingCompetitionInfo", event.landing_competition_info || "Details coming soon.", "");
    setText("socialMediaCompetitionInfo", event.social_media_competition_info || "Details coming soon.", "");

    const livingInfo = document.getElementById("livingLocationInfo");
    const livingTitle = document.getElementById("livingLocationTitle");
    const livingTypeBadge = document.getElementById("livingLocationTypeBadge");

    if (livingInfo) {
      const locationType = loc.location_type === "house" ? "House" : "Hotel";
      const addressLine = [loc.address, loc.city, loc.country]
        .filter(Boolean)
        .filter((value, index, all) => all.indexOf(value) === index)
        .join(" • ");

      if (livingTitle) livingTitle.textContent = loc.name || "Living location";
      if (livingTypeBadge) livingTypeBadge.textContent = loc.name ? locationType : "";

      livingInfo.innerHTML = `
        ${addressLine ? `<span>${escapeHtml(addressLine)}</span>` : ""}
        ${loc.website_url
          ? `<a class="event-info-link" href="${escapeHtml(loc.website_url)}" target="_blank" rel="noopener">Location page ↗</a>`
          : ""}
      `;
    }

    const venueInfo = document.getElementById("eventVenueInfo");
    const venueTitle = document.getElementById("eventVenueTitle");
    const venueTypeBadge = document.getElementById("eventVenueTypeBadge");

    if (venueInfo) {
      const venueType = event.venue_type === "tunnel" ? "Tunnel" : "Drop zone";
      const priceLine = event.venue_type === "tunnel"
        ? (event.tunnel_time_cost != null ? `Tunnel time cost: ${formatMoney(event.tunnel_time_cost)}` : "")
        : (event.ticket_price != null ? `Ticket price: ${formatMoney(event.ticket_price)}` : "");

      if (venueTitle) venueTitle.textContent = event.venue || "Event venue";
      if (venueTypeBadge) venueTypeBadge.textContent = event.venue ? venueType : "";

      venueInfo.innerHTML = `
        ${priceLine ? `<span>${escapeHtml(priceLine)}</span>` : ""}
        ${event.venue_url
          ? `<a class="event-info-link" href="${escapeHtml(event.venue_url)}" target="_blank" rel="noopener">Venue page ↗</a>`
          : ""}
      `;
    }

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
