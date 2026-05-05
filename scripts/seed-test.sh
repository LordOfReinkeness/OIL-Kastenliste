#!/usr/bin/env bash
set -euo pipefail

STATS_JSON="$(dirname "$0")/../stats_overview_2026-05-05.json"
MEETINGS_JSON="$(dirname "$0")/../meetings_overview_2026-05-05.json"
PSQL="docker exec -i oil-kastenliste-db-dev psql -U postgres -d kastenliste"

echo "=== Seeding users ==="
jq -r '.[] | "INSERT INTO users (id, rz_id, first_name, last_name) VALUES (\$1, \$2, \$3, \$4) ON CONFLICT DO NOTHING;" + "\n\t" + [.id, .rzId, .firstName, .lastName] | @json' "$STATS_JSON" | while IFS= read -r line; do
  :
done

# Build a single SQL file and pipe it in
SQL_FILE="$(mktemp)"
trap 'rm -f "$SQL_FILE"' EXIT

{
  echo "BEGIN;"

  # Users
  echo "-- Users"
  jq -r '.[] | @base64' "$STATS_JSON" | while IFS= read -r row; do
    u=$(echo "$row" | base64 -d)
    id=$(echo "$u" | jq -r '.id')
    rzId=$(echo "$u" | jq -r '.rzId')
    firstName=$(echo "$u" | jq -r '.firstName' | sed "s/'/''/g")
    lastName=$(echo "$u" | jq -r '.lastName' | sed "s/'/''/g")
    echo "INSERT INTO users (id, rz_id, first_name, last_name) VALUES ('$id', '$rzId', '$firstName', '$lastName') ON CONFLICT DO NOTHING;"
  done

  # Meetings
  echo "-- Meetings"
  jq -r '.[] | @base64' "$MEETINGS_JSON" | while IFS= read -r row; do
    m=$(echo "$row" | base64 -d)
    id=$(echo "$m" | jq -r '.id')
    linkToken=$(echo "$m" | jq -r '.linkToken')
    date=$(echo "$m" | jq -r '.date')
    excuseDeadlineMinutes=$(echo "$m" | jq -r '.excuseDeadlineMinutes')
    checkinDeadline=$(echo "$m" | jq -r '.checkinDeadline')
    checkinWindowMinutes=$(echo "$m" | jq -r '.checkinWindowMinutes')
    liveCheckinOpen=$(echo "$m" | jq -r '.liveCheckinOpen')
    capInfractions=$(echo "$m" | jq -r '.capInfractions')
    checkAnswer=$(echo "$m" | jq -r '.checkAnswer')
    maxRetries=$(echo "$m" | jq -r '.maxRetries')
    question=$(echo "$m" | jq -r '.question // ""' | sed "s/'/''/g")
    answer=$(echo "$m" | jq -r '.answer // ""' | sed "s/'/''/g")
    echo "INSERT INTO meetings (id, link_token, date, excuse_deadline_minutes, checkin_deadline, checkin_window_minutes, live_checkin_open, cap_infractions, question, answer, check_answer, max_retries) VALUES ('$id', '$linkToken', '$date', $excuseDeadlineMinutes, '$checkinDeadline', $checkinWindowMinutes, $liveCheckinOpen, $capInfractions, NULLIF('$question',''), NULLIF('$answer',''), $checkAnswer, $maxRetries) ON CONFLICT DO NOTHING;"
  done

  # User-meeting records
  echo "-- User-meeting records"
  # Build lookup: meeting_id -> checkin_deadline (for synthetic post checkin timestamp)
  jq -r '.[] | @base64' "$STATS_JSON" | while IFS= read -r row; do
    u=$(echo "$row" | base64 -d)
    userId=$(echo "$u" | jq -r '.id')
    echo "$u" | jq -r '.meetings[] | @base64' | while IFS= read -r mrow; do
      m=$(echo "$mrow" | base64 -d)
      meetingId=$(echo "$m" | jq -r '.id')
      liveCheckedIn=$(echo "$m" | jq -r '.liveCheckedIn')
      postCheckedIn=$(echo "$m" | jq -r '.postCheckedIn')
      isLate=$(echo "$m" | jq -r '.isLate')
      excuseType=$(echo "$m" | jq -r '.excuseType')
      infractions=$(echo "$m" | jq -r '.infractions')

      # Skip purely pending meetings (no record to insert)
      if [ "$liveCheckedIn" = "null" ] && [ "$postCheckedIn" = "null" ] && [ "$excuseType" = "null" ] && [ "$infractions" = "null" ]; then
        continue
      fi

      # Synthetic timestamps: if checked-in, use meeting date + 30 min (live) or deadline - 1 day (post)
      meetingDate=$(jq -r --arg mid "$meetingId" '.[] | select(.id == $mid) | .date' "$MEETINGS_JSON")
      checkinDeadline=$(jq -r --arg mid "$meetingId" '.[] | select(.id == $mid) | .checkinDeadline' "$MEETINGS_JSON")

      if [ "$liveCheckedIn" = "true" ]; then
        liveCheckedInAt="'$(date -u -v+30M -j -f '%Y-%m-%dT%H:%M:%S' "${meetingDate%.*}" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -d "$meetingDate + 30 minutes" '+%Y-%m-%dT%H:%M:%SZ')'"
      else
        liveCheckedInAt="NULL"
      fi

      if [ "$postCheckedIn" = "true" ]; then
        postCheckedInAt="'$(date -u -v-1d -j -f '%Y-%m-%dT%H:%M:%S' "${checkinDeadline%.*}" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -d "$checkinDeadline - 1 day" '+%Y-%m-%dT%H:%M:%SZ')'"
      else
        postCheckedInAt="NULL"
      fi

      isLateSql="NULL"
      if [ "$isLate" = "true" ]; then isLateSql="true"; fi
      if [ "$isLate" = "false" ]; then isLateSql="false"; fi

      excuseTypeSql="NULL"
      if [ "$excuseType" != "null" ]; then excuseTypeSql="'$excuseType'"; fi

      infractionsSql=0
      if [ "$infractions" != "null" ]; then infractionsSql=$infractions; fi

      echo "INSERT INTO user_meetings (user_id, meeting_id, live_checked_in_at, post_checked_in_at, is_late, excuse_type, infractions, answer_attempts) VALUES ('$userId', '$meetingId', $liveCheckedInAt, $postCheckedInAt, $isLateSql, $excuseTypeSql, $infractionsSql, 0) ON CONFLICT DO NOTHING;"
    done
  done

  echo "COMMIT;"
} > "$SQL_FILE"

echo "Running SQL..."
$PSQL < "$SQL_FILE"
echo "=== Seed complete ==="
