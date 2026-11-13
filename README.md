# pi-context-status

A compact two-line custom footer for [Pi](https://pi.dev), showing context-window usage and the active thinking level.

## Features

- Active model ID
- Ten-cell context usage bar
- Context percentage and token counts
- Configurable warning and critical thresholds
- Current thinking level
- Footer refresh when the model or thinking level changes
- No third-party runtime dependencies

## Preview

```text
Claude Sonnet 4.5 · ctx ■■■■■■□□□□ 61% (61k/100k)
Thinking mode · high (shift+tab to change)
```

## Requirements

- [Pi Coding Agent](https://pi.dev)

## Installation

Install the package from GitHub:

```bash
pi install git:github.com/Dmitrijs-Vasilevskis/pi-context-status
```

To install a specific release:

```bash
pi install git:github.com/Dmitrijs-Vasilevskis/pi-context-status@v0.1.0
```

Restart Pi or run `/reload` after installation if needed.

## Configuration

The extension works without a configuration file. Defaults:

| Setting | Default |
| --- | ---: |
| Warning threshold | 70% |
| Critical threshold | 85% |

To customize the thresholds, create:

```text
~/.pi/agent/extensions/context-status.json
```

Example:

```json
{
  "thresholds": {
    "warning": 70,
    "critical": 85
  }
}
```

Thresholds must be numbers between 0 and 100, and `warning` must be lower than `critical`. Invalid or unreadable configuration falls back to the defaults.

- Below warning: green
- Warning and above: yellow
- Critical and above: red

The extension is informational only. It does not automatically compact context or start a new session.

The configuration is read when a session starts. After changing it, start a new session or reload the extension.

## Uninstallation

```bash
pi remove git:github.com/Dmitrijs-Vasilevskis/pi-context-status
```

## Development

Try the extension locally without installing the package:

```bash
pi -e ./extensions/context-status.ts
```

Or load the package directory:

```bash
pi -e .
```

## Security

Pi extensions run with the permissions of the Pi process. Review the source code before installing or updating this package.

## License

[MIT](LICENSE)
