---
name: basetube-upload
description: Upload, publish and manage videos on the user's Base.tube channel with the `basetube` command-line tool. Use when the user asks to upload or send a video to Base.tube, publish a video on their Base.tube channel, check whether a Base.tube video is ready, change its title, tags, thumbnail or visibility, or list or delete their Base.tube videos.
---

# Base.tube upload

Use the `basetube` CLI (npm package `basetube`, Node.js 18+). Run it as `basetube ...` if installed, otherwise `npx basetube ...`. Never call the HTTP API by hand when the CLI can do it.

## Prerequisites

1. The user needs an API key: base.tube → **Creator Hub → API** → **Create a key**. Only the user can create it.
2. Check whether the CLI is already signed in: `basetube whoami --json`.
   - Exit code 0: signed in. Note the permissions in `data.key.scopes` and `data.dailyUploads.remaining`.
   - Exit code 3: not signed in. Ask the user to run `basetube login` themselves in their terminal (it asks for the key without showing it). If the key is already in an environment variable, sign in with `printf '%s' "$VAR" | basetube login --key-stdin --json`, or pass it as `BASETUBE_API_KEY` for one command.
3. Never ask the user to paste the key into the chat.

## Rules

- **Private by default.** Upload without `--public` unless the user explicitly asked to publish or make the video public in this conversation. When unsure, upload private and ask.
- **Never delete without explicit confirmation.** Before `basetube videos delete <id> --yes`, show the video's ID and title and get a clear "yes" from the user for that video.
- **Never print, log, echo or commit the key.** Do not put it in files, commands shown to the user, commit messages or code. Do not read `~/.config/basetube/config.json`.
- Always add `--json` and read stdout as one JSON document. Progress lines are on stderr; ignore them unless something fails.
- Do not retry in a loop. The CLI already waits when the API asks it to. Follow the error's `hint`.

## Choose the channel

```bash
basetube channels --json
```

`data.channels` is a list of `{ id, name, handle }`. With one channel, `--channel` is not needed. With several, use the one the user named (`--channel 7` or `--channel @handle`); if they did not say, ask which one. Never guess.

## Upload

```bash
basetube upload "<path to video>" --title "<title>" [--description "<text>"] [--tags a,b,c] [--channel <id or @handle>] [--thumbnail "<image>"] [--public] --json
```

- Accepted files: `.mp4`, `.mov`, `.avi`, up to 2 GB. Thumbnail: `.jpg`, `.png`, `.webp`, up to 3 MB.
- The command waits until the video is ready (this can take several minutes for long videos). Use a long timeout. For a quick return, add `--no-wait`; then `--public` and `--thumbnail` are not allowed, so set them later with `videos update` and `videos thumbnail`.
- Success: `{"ok": true, "data": {"uploadId", "video": {"id", "status", "visibility", "watchUrl", ...}}}`. Give the user `data.video.watchUrl` and say whether it is private or public.
- If the command is interrupted, run the exact same command again: it resumes and sends only the missing parts.
- To send a file that was already sent once (error `UPLOAD_ALREADY_COMPLETED`), first confirm the user wants a second copy, then add `--restart`.

## Check status and manage videos

```bash
basetube videos get <id> --json          # data.status: processing | ready | failed
basetube videos list --limit 10 --json   # newest first
basetube videos update <id> --title "<title>" --tags a,b --json
basetube videos update <id> --public --json    # only when the user asked to publish
basetube videos update <id> --private --json
basetube videos thumbnail <id> "<image>" --json
```

A video can be made public only once `status` is `ready`.

## Read errors

On failure, stdout is `{"ok": false, "error": {"code", "message", "hint", "exitCode"}}`. Tell the user the message and the hint in plain words.

| Exit code | Meaning | What to do |
|---|---|---|
| 1 | Something failed (network, processing) | Report the message. Retry once only if the hint says to run the same command again. |
| 2 | Wrong command or input, or a missing `--channel` | Fix the command. Do not retry it unchanged. |
| 3 | Not signed in, or key refused/revoked | The user must create a key and run `basetube login`. |
| 4 | Not allowed (`SCOPE_MISSING`, `CHANNEL_FORBIDDEN`, `ACCOUNT_NOT_ELIGIBLE`) | Tell the user which permission or channel is missing; they fix it on Creator Hub → API. |
| 5 | Limit reached (20 videos a day, 5 uploads at once, calls per minute, file size) | Do not retry now. Tell the user the limit and when it resets (`UPLOAD_DAILY_QUOTA_EXCEEDED` resets at midnight UTC). |

Useful codes: `SCOPE_MISSING` (`error.details.required` names the permission, e.g. `videos:write` to publish or edit, `videos:delete` to delete), `VIDEO_NOT_READY` (wait, then check with `videos get`), `VIDEO_NOT_FOUND` (check the ID with `videos list`).

## Commands at a glance

`login [--key-stdin]`, `logout`, `whoami`, `channels`, `upload <file>`, `videos list|get|update|thumbnail|delete`. Every command takes `--help`, `--json` and `--api <url>`.
