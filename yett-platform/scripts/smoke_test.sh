#!/usr/bin/env bash
# Smoke test for YETT backend
# Usage: bash scripts/smoke_test.sh

BASE=${BASE:-http://localhost:5000/api}
TMP=/tmp/yett_smoke
mkdir -p "$TMP"

echo "Checking backend health: $BASE/health"
curl -sS "$BASE/health" || { echo "Backend health check failed"; exit 1; }

echo "\nRegistering test learner and mentor (if not exists)"
curl -s -X POST "$BASE/register" -H "Content-Type: application/json" -d '{"name":"Smoke Learner","email":"smoke.learner@example.com","password":"pass123","role":"learner"}' > "$TMP/learner.json" || true
curl -s -X POST "$BASE/register" -H "Content-Type: application/json" -d '{"name":"Smoke Mentor","email":"smoke.mentor@example.com","password":"pass123","role":"mentor"}' > "$TMP/mentor.json" || true

echo "\nLogging in mentor and learner"
mentor_token=$(curl -s -X POST "$BASE/login" -H "Content-Type: application/json" -d '{"email":"smoke.mentor@example.com","password":"pass123"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))")
learner_token=$(curl -s -X POST "$BASE/login" -H "Content-Type: application/json" -d '{"email":"smoke.learner@example.com","password":"pass123"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))")

echo "mentor_token present: ${mentor_token:+yes}${mentor_token:-no}"
echo "learner_token present: ${learner_token:+yes}${learner_token:-no}"

if [ -z "$mentor_token" ] || [ -z "$learner_token" ]; then
  echo "Tokens missing; aborting smoke test. Check backend logs and that registration/login succeeded."
  echo "Check $TMP/learner.json and $TMP/mentor.json for responses."
  exit 2
fi

echo "\nMentor creating targeted opportunity to learner"
curl -s -X POST "$BASE/opportunities" -H "Content-Type: application/json" -H "Authorization: Bearer $mentor_token" -d '{"title":"Smoke Offer","description":"Test offer","targetLearnerEmail":"smoke.learner@example.com"}' > "$TMP/offer.json"
cat "$TMP/offer.json" | sed -n '1,8p'

offer_id=$(python3 -c "import sys,json
try:
  d=json.load(open('$TMP/offer.json'))
  print(d.get('opportunity',{}).get('id','') or d.get('id',''))
except Exception:
  print('')")

if [ -z "$offer_id" ]; then
  echo "No offer id returned; printing full response:"; cat "$TMP/offer.json"; exit 3
fi

echo "Offer id: $offer_id"

echo "\nLearner listing opportunities"
curl -s -X GET "$BASE/opportunities" -H "Authorization: Bearer $learner_token" > "$TMP/offers_list.json"
head -c 400 "$TMP/offers_list.json" || true

echo "\nLearner accepting the offer"
curl -s -X POST "$BASE/opportunities/$offer_id/respond" -H "Content-Type: application/json" -H "Authorization: Bearer $learner_token" -d '{"status":"accepted"}' > "$TMP/respond.json"
cat "$TMP/respond.json" | sed -n '1,8p'

echo "\nChecking mentor matches"
curl -s -X GET "$BASE/matches" -H "Authorization: Bearer $mentor_token" > "$TMP/matches.json"
cat "$TMP/matches.json" | sed -n '1,8p'

echo "\nSmoke test complete. Artifacts in $TMP"
exit 0
