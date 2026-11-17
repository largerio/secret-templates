# Secret templates

Templates to install [Secret](https://github.com/largerio/secret) from
Runtipi or Unraid. Secret shares notes and files end-to-end encrypted,
through links that open once.

## Runtipi

This repository is a Runtipi app store. In Runtipi, go to **Settings → App
Stores → Add App Store**, paste `https://github.com/largerio/secret-templates`,
then install **Secret** from the store.

Everything the app keeps lives in `app-data/<store>/secret/data`, `<store>`
being the name given to the store: the SQLite database, the encrypted files
and the server's encryption key, generated on the first start. Back up that folder whole. The app runs as uid 1001; a
short-lived init container hands it the folder before each start.

## Unraid

The template is `unraid/secret.xml`. Until it's in Community Applications,
add it by hand from the Unraid terminal:

```sh
wget -O /boot/config/plugins/dockerMan/templates-user/my-Secret.xml \
  https://raw.githubusercontent.com/largerio/secret-templates/main/unraid/secret.xml
```

Then **Docker → Add Container**, and pick **Secret** as the template.

The app runs as uid 1001. Before the first start, give it its data folder:

```sh
mkdir -p /mnt/user/appdata/secret && chown -R 1001:1001 /mnt/user/appdata/secret
```

Behind a reverse proxy (SWAG, Nginx Proxy Manager, Traefik), set
`ADDRESS_HEADER` to `X-Forwarded-For` in the advanced settings, so that
rate limits tell visitors apart.

## For each Secret release

- **Runtipi:** in `apps/secret/docker-compose.yml`, set both image tags to
  the new version; in `apps/secret/config.json`, set `version`, add 1 to
  `tipi_version` and set `updated_at` to the time in milliseconds.
- **Unraid:** nothing to do. The template follows the `:1` tag, which each
  1.x release moves.

## Tests

```sh
bun install && bun test
```

They check each Runtipi app against Runtipi's schema, and that each Unraid
template points at itself and at its icon. CI runs them on every push.
