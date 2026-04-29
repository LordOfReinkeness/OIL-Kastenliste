#!/usr/bin/env bash
# Usage: ./check-endpoints.sh [base-url]
# Default base URL is http://localhost:3030/api

BASE=${1:-"http://localhost:3030/api"}
COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"' EXIT

# Login to get an admin session cookie
curl -s -o /dev/null -c "$COOKIE_JAR" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password": "'"${ADMIN_PASSWORD:-admin}"'"}'

# ─────────────────────────────────────────────
# Route definitions: "METHOD PATH label write?"
# Add your routes here. write=1 means it mutates state.
# ─────────────────────────────────────────────
routes=(
  # Auth
  "GET    /auth/me                                                           auth: check session            0"
  "POST   /auth/login                                                        auth: login                    1"
  "POST   /auth/logout                                                       auth: logout                   1"

  # Health
  "GET    /health                                                            health check                   0"

  # Meetings (public)
  "GET    /meetings/next                                                     meetings: next upcoming        0"
  "GET    /meetings/t/YOURTOKEN                                              meetings: get by token         0"
  "POST   /meetings/t/YOURTOKEN/live-checkin                                 meetings: live check-in        1"
  "POST   /meetings/t/YOURTOKEN/post-checkin                                 meetings: post check-in        1"
  "POST   /meetings/t/YOURTOKEN/excuse                                       meetings: submit excuse        1"

  # Meetings (admin)
  "GET    /meetings                                                          meetings: list all             0"
  "POST   /meetings                                                          meetings: create               1"
  "GET    /meetings/00000000-0000-0000-0000-000000000000                     meetings: get by id            0"
  "PATCH  /meetings/00000000-0000-0000-0000-000000000000                     meetings: update               1"
  "DELETE /meetings/00000000-0000-0000-0000-000000000000                     meetings: delete               1"

  # Attendance (admin)
  "GET    /meetings/00000000-0000-0000-0000-000000000000/attendance          attendance: list               0"
  "PATCH  /meetings/00000000-0000-0000-0000-000000000000/attendance/00000000-0000-0000-0000-000000000000  attendance: update  1"

  # Users (public)
  "POST   /users                                                             users: create                  1"
  "GET    /users/validate-rz-id/abc123                                       users: validate rz-id          0"
  "GET    /users/lookup/abc123                                               users: lookup by rz-id         0"
  "GET    /users/00000000-0000-0000-0000-000000000000                        users: get by id               0"
  "GET    /users/00000000-0000-0000-0000-000000000000/stats                  users: get stats               0"

  # Users (admin)
  "GET    /users                                                             users: list all                0"
  "PATCH  /users/00000000-0000-0000-0000-000000000000                        users: update                  1"
  "DELETE /users/00000000-0000-0000-0000-000000000000                        users: delete                  1"

  # Admin stats
  "GET    /admin/stats                                                       admin: stats                   0"
  "GET    /admin/stats/export                                                admin: export csv              0"
)

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

printf "\n%-6s %-8s %-5s %-50s %s\n" "STATUS" "METHOD" "WRITE" "PATH" "LABEL"
printf '%s\n' "$(printf '─%.0s' {1..100})"

for route in "${routes[@]}"; do
  read -r method path label _ write <<< "$route"

  # Reconstruct label (may contain spaces)
  label=$(echo "$route" | awk '{
    # skip method and path, collect everything before last field
    n=NF; label=""
    for(i=3;i<n;i++) label=label" "$i
    print substr(label,2)
  }')
  write=$(echo "$route" | awk '{print $NF}')

  anon_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$path")
  auth_code=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X "$method" "$BASE$path")

  if   [ "$anon_code" = "401" ];                        then access="${RED}protected${RESET}"
  elif [ "$anon_code" = "200" ] || [ "$anon_code" = "201" ] || [ "$anon_code" = "400" ] || [ "$anon_code" = "404" ]; then access="${GREEN}public   ${RESET}"
  else                                                       access="${YELLOW}?        ${RESET}"
  fi

  if [ "$write" = "1" ]; then
    write_marker="${YELLOW}write${RESET}"
  else
    write_marker="read "
  fi

  printf "%-6s ${BLUE}%-8s${RESET} %b  %-50s %b  (anon:%s auth:%s)\n" \
    "" "$method" "$write_marker" "$path" "$access" "$anon_code" "$auth_code"
done

printf '\n'
