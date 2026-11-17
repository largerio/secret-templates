# Secret

Share a password, a note or files through a link that opens once.
Everything is encrypted in your browser with XChaCha20-Poly1305, and the
key stays in the link's fragment, which browsers never send: the server
never sees what you share. The server adds its own AES-256-GCM layer on top.

## Features

- Burn after reading, or after a set number of reads
- Expiry from 5 minutes to 30 days, and a delete link
- An optional password, stretched with Argon2id: a wrong one spends no read,
  and the fifth deletes the note
- Up to 10 files per note, encrypted and uploaded in chunks
- Markdown, QR codes, light and dark themes, 10 languages
- No accounts, no analytics, and no content, keys or IP addresses in the logs

## Data and backups

Everything lives in the app's data folder, `app-data/<store>/secret/data`,
`<store>` being the name you gave this store: the SQLite database, the
encrypted files and the server's encryption key, generated on the first
start. Back up the folder whole: without the key,
existing notes can't be decrypted.

## Behind Runtipi's proxy

The app tells visitors apart by the address Traefik forwards, so rate limits
apply per visitor. Someone who reaches the app's port directly, without
Traefik, can choose that address; every write still needs a proof of work.

## Links

- Source and documentation: https://github.com/largerio/secret
- Self-hosting guide: https://github.com/largerio/secret/blob/main/docs/self-hosting.md
- Security model: https://github.com/largerio/secret/blob/main/SECURITY.md
