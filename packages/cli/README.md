# basetube

Send videos to your [Base.tube](https://beta.base.tube) channel from a terminal, a script or an AI agent (Claude Code, Codex).
A video sent this way goes through the same processing and checks as one uploaded on the website.

Needs Node.js 18 or newer. No other dependency.

## Install

```bash
npm install -g basetube     # then run: basetube ...
# or, without installing:
npx basetube ...
```

## Quick start (60 seconds)

1. On base.tube, open **Creator Hub → API** and create a key. Copy it: it is shown once.
2. Save it on this computer:
   ```bash
   basetube login
   ```
   Paste the key when asked. It is not shown on screen. It is checked with Base.tube, then saved in `~/.config/basetube/config.json`, readable only by you.
3. Send a video:
   ```bash
   basetube upload episode-12.mp4 --title "Episode 12"
   ```
   You see one line per part sent, then the watch address:
   ```
   Ready (private): https://beta.base.tube/video/4821
   ```

The video is **private** until you make it public, with `--public` on the upload or later with `basetube videos update 4821 --public`.

If the upload stops (lost connection, closed laptop, Ctrl-C), run the same command again. It sends only the parts that are missing.

## Commands

| Command | What it does |
|---|---|
| `basetube login [--key-stdin]` | Check your key and save it. `--key-stdin` reads it from stdin instead of asking. |
| `basetube logout` | Remove the saved key from this computer. |
| `basetube whoami` | Account, key name, permissions, uploads left today. |
| `basetube channels` | Channels this key can publish to (ID and handle). |
| `basetube upload <file> [options]` | Send a video and wait until it is ready. |
| `basetube videos list [--channel] [--page] [--limit]` | Your videos, newest first. |
| `basetube videos get <id>` | One video: `processing`, `ready` or `failed`, visibility, watch address. |
| `basetube videos update <id> [--title] [--description] [--tags] [--public \| --private]` | Change a video. |
| `basetube videos thumbnail <id> <image>` | Replace the thumbnail (JPEG, PNG or WebP, 3 MB max). |
| `basetube videos delete <id> [--yes]` | Delete a video. Asks you to type the ID; without a terminal it needs `--yes`. |

Upload options:

| Option | Meaning |
|---|---|
| `--title <text>` | Title (default: the file name). |
| `--description <text>` | Description. |
| `--tags a,b,c` | Tags, separated by commas. |
| `--channel <id or @handle>` | Needed when the key covers several channels. |
| `--thumbnail <image>` | Replace the thumbnail once the video is ready. |
| `--public` | Make the video public once it is ready. |
| `--no-wait` | Return as soon as the file is received. Check later with `basetube videos get <id>`. |
| `--restart` | Ignore saved progress for this file and start a new upload (also to send the same file a second time). |

Every command accepts `--help` (with an example), `--json` and `--api <url>`.
Accepted video files: `.mp4`, `.mov`, `.avi`, up to 2 GB. Limits: 20 videos a day per account (website and API together), 5 uploads in progress at once.

## Settings

| Setting | Default |
|---|---|
| `BASETUBE_API_KEY` | Used instead of the saved key when set. |
| `BASETUBE_API_URL` or `--api` | `https://api.base.tube/v1` |
| `BASETUBE_CONFIG_DIR` | `~/.config/basetube` (or `$XDG_CONFIG_HOME/basetube`) |

Files the CLI writes, all inside that folder and readable only by you:

- `config.json`: the key saved by `basetube login`.
- `uploads/<fingerprint>.json`: progress of an unfinished upload, so it can resume. It holds an upload ID, never your key or a storage address. It is deleted once the video is ready. Nothing is written next to your video.

The key is never printed and never put in a web address. File parts go straight to storage without your key.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Done. |
| 1 | Something failed (network, processing, a saved upload that cannot continue). Read the message. |
| 2 | Wrong command, option or value (including a missing `--channel`, or a prompt that cannot be shown because there is no terminal). |
| 3 | Not signed in, or the key was refused (invalid, revoked, expired). |
| 4 | Not allowed: the key lacks a permission, cannot use that channel, or the account cannot use the API. |
| 5 | A limit was reached: videos per day, uploads in progress, calls per minute, or file size. |

Every error prints the API's error code, its message, and one sentence saying what to do.

## Use it from an AI agent

The CLI is built to be driven by Claude Code, Codex or any agent that runs shell commands:

- Add `--json`: stdout then holds exactly one JSON document, `{"ok": true, "data": ...}` or `{"ok": false, "error": {"code", "message", "hint", "exitCode"}}`. Progress goes to stderr.
- It never waits for input when stdin is not a terminal. Sign in with `printf '%s' "$BASETUBE_KEY" | basetube login --key-stdin`, or set `BASETUBE_API_KEY`.
- Branch on the exit code (table above).
- Videos stay private unless the command says `--public`. Deleting needs `--yes`.

An agent skill, `basetube-upload`, teaches these rules to Claude Code and Codex.

```bash
basetube whoami --json
basetube channels --json
basetube upload clip.mp4 --title "Clip" --channel @mychannel --json
basetube videos get 4821 --json
```
