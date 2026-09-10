# SHAKSHUKA TRAVEL

Starter frontend + Supabase database for Sequence Body Flight Academy travel events.

## Version 1 included

- Travel landing page
- Events ordered by start date
- Dates displayed as `DD/MM/YYYY`
- Event name and location
- Event detail page
- Useful event links
- Database structure for locations, events, participants and event membership

## 1. Create the database

In Supabase:

1. Open **SQL Editor**
2. Create a new query
3. Paste the contents of `database/schema.sql`
4. Run it

You can then use **Table Editor** to add/edit locations and events.

For an event to appear on the public travel page, set:

`status = published`

## 2. Add Supabase website keys

In Supabase, find your Project URL and public publishable/anon key.

Open:

`supabase-config.js`

and replace the two placeholders.

Do NOT use the database password or service-role key in a public repository.

## 3. GitHub Pages

Upload these files to the root of your new `shakshuka_travel` repository.

Then go to:

Settings → Pages → Deploy from a branch → `main` / root

## Planned next step

Build the secure admin page:

- Create/edit events
- Add locations to the dropdown
- Add participants
- Assign participants to an event
- Participant login by selected name + phone number
- Personal event dashboard
- Jumps/logbook
- Payments
- Accommodation/travel details
