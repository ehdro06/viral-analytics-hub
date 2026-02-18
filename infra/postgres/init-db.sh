#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE DATABASE virallink_user;
	CREATE DATABASE virallink_redirect;
	CREATE DATABASE virallink_analytics;
EOSQL
