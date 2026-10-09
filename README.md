# Josey Records — Black Friday RSD 2026 wishlist

Includes 183 releases from the **Alpha By Artist** worksheet of the supplied Alliance order form. Each UPC is a separate title/format variant.

## Start locally

```bash
ADMIN_PASSWORD='choose-a-long-secret-password' npm start
```

Open `http://localhost:3000` for the public wishlist and `http://localhost:3000/admin.html` for the tally. When prompted for admin credentials, enter any username and the `ADMIN_PASSWORD` as the password. Download a CSV tally from the admin screen.

## Deploy

Host as a **Node web service** (e.g. Render), with build command left blank and start command `npm start`. Set `ADMIN_PASSWORD` as a secret environment variable and enable HTTPS on your domain. **Important:** the app writes submissions to `submissions.json`. On Render, ephemeral storage is wiped on restarts/deployments. Attach a persistent disk and set `DATA_FILE=/var/data/submissions.json` (using your disk's actual mount path) before accepting real submissions. Alternatively, migrate persistence to your existing PostgreSQL database. Do not use the default ephemeral file for production.

This is a wishlist only, not an inventory allocation or reservation. The `available` field reflects the distributor's total U.S. quantity and may change. Submissions do not ask for or store names or email addresses; protect the submission disk and backups appropriately. The admin view reports aggregated counts only. Each submission counts once per UPC; repeat submissions by the same person are not automatically deduplicated. The simple in-memory submission throttle is not a replacement for bot protection on a public deployment.
