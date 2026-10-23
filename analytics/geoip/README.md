# GeoLite2 database (not committed)

The analytics Docker image copies this directory to `/app/geoip/` and reads
`/app/geoip/GeoLite2-City.mmdb` (`GEOLITE_PATH`). The `.mmdb` file itself is git-ignored (`*.mmdb` in the root
`.gitignore`): MaxMind's license does not allow redistributing it in a public repository.

If the file is missing, the service starts normally, logs
`GeoLite database not found at ... Geo enrichment disabled.`, and stores country/city as `Unknown`.

## Getting the file

1. Create a free MaxMind account and a license key (https://www.maxmind.com/en/geolite2/signup).
2. Download **GeoLite2-City** (`.tar.gz`) and put `GeoLite2-City.mmdb` in this directory before `docker build`,
   or let CI do it (see `.github/workflows/deploy-cloud-run.yml`).

Options for production (details in `docs/DEPLOY.md`):

- **Bake into the image in CI**: download with the license key from a secret right before `docker build`.
  The image then contains the database, so keep the registry private.
- **Mount at run time**: upload the file to a Cloud Storage bucket, mount the bucket as a Cloud Run volume and set
  `GEOLITE_PATH` to the mounted file. Updates no longer need a new image.

License notes (check the current GeoLite2 EULA): attribution to MaxMind is required, the database must not be
redistributed publicly, and MaxMind expects you to keep it current (they publish updates twice a week).

Local dev (`./gradlew bootRun`) uses `GEOLITE_PATH` from `.env`, default `./data/GeoLite2-City.mmdb`.
