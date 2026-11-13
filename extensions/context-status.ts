
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

interface StatusConfig {
  thresholds: {
    warning: number;
    critical: number;
  };
}

type StatusColor = "success" | "warning" | "error";

const DEFAULT_CONFIG: StatusConfig = {
  thresholds: {
    warning: 70,
    critical: 85,
  },
};

const CONFIG_PATH = join(
  homedir(),
  ".pi",
  "agent",
  "extensions",
  "context-status.json"
);

let tuiRef: { requestRender: () => void } | undefined;

function loadConfig(): StatusConfig {
  try {
    if (!existsSync(CONFIG_PATH)) {
      return DEFAULT_CONFIG;
    }

    const parsed = JSON.parse(
      readFileSync(CONFIG_PATH, "utf-8")
    ) as Partial<StatusConfig>;

    const warning = parsed.thresholds?.warning;
    const critical = parsed.thresholds?.critical;

    if (
      typeof warning !== "number" ||
      typeof critical !== "number" ||
      !Number.isFinite(warning) ||
      !Number.isFinite(critical) ||
      warning < 0 ||
      warning > 100 ||
      critical < 0 ||
      critical > 100 ||
      warning >= critical
    ) {
      return DEFAULT_CONFIG;
    }

    return {
      thresholds: { warning, critical },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function getStatusColor(
  percentage: number,
  config: StatusConfig
): StatusColor {
  if (percentage >= config.thresholds.critical) {
    return "error";
  }

  if (percentage >= config.thresholds.warning) {
    return "warning";
  }

  return "success";
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${Math.round(tokens / 1000)}k`;
  }

  return `${Math.round(tokens)}`;
}

function createProgressBar(percentage: number): {
  filled: number;
  empty: number;
} {
  const filled = Math.max(
    0,
    Math.min(10, Math.round(percentage / 10))
  );

  return {
    filled,
    empty: 10 - filled,
  };
}

export default function (pi: ExtensionAPI) {
  pi.on("thinking_level_select", () => {
    tuiRef?.requestRender();
  });

  pi.on("model_select", () => {
    tuiRef?.requestRender();
  });

  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;

    const config = loadConfig();

    ctx.ui.setFooter((tui, theme, footerData) => {
      tuiRef = tui;

      const disposeBranchListener =
        footerData.onBranchChange(() => {
          tui.requestRender();
        });

      return {
        render(width: number): string[] {
          const usage = ctx.getContextUsage();

          const modelName = ctx.model?.id ?? "unknown";
          const thinkingLevel = ctx.thinkingLevel ?? "off";

          const thinkingLine = [
            theme.fg("dim", "Thinking mode"),
            theme.fg("dim", " · "),
            theme.fg("dim", thinkingLevel.toString()),
            " ",
            theme.fg("dim", "(shift+tab to change)"),
          ].join("");

          let contextLine: string;

          const hasValidUsage =
            usage !== undefined &&
            usage.tokens != null &&
            Number.isFinite(usage.tokens) &&
            usage.tokens >= 0 &&
            Number.isFinite(usage.contextWindow) &&
            usage.contextWindow > 0;

          if (!hasValidUsage) {
            contextLine = [
              theme.fg("accent", modelName),
              theme.fg("dim", " · ctx "),
              theme.fg("dim", "□□□□□□□□□□"),
              theme.fg("dim", " --"),
              theme.fg("dim", " (--/--)"),
            ].join("");
          } else {
            const tokens = usage.tokens!;
            const contextWindow = usage.contextWindow;

            const percentage = Math.max(
              0,
              Math.min(100, (tokens / contextWindow) * 100)
            );

            const roundedPercentage = Math.round(percentage);

            const color = getStatusColor(
              percentage,
              config
            );

            const { filled, empty } =
              createProgressBar(percentage);

            const progressBar =
              theme.fg(color, "■".repeat(filled)) +
              theme.fg("dim", "□".repeat(empty));

            contextLine = [
              theme.fg("accent", modelName),
              " ",
              theme.fg("dim", "·"),
              " ",
              theme.fg("dim", "ctx"),
              " ",
              progressBar,
              " ",
              theme.fg(color, `${roundedPercentage}%`),
              " ",
              theme.fg(
                "dim",
                `(${formatTokens(tokens)}/${formatTokens(contextWindow)})`
              ),
            ].join("");
          }

          return [
            truncateToWidth(contextLine, width),
            truncateToWidth(thinkingLine, width),
          ];
        },

        invalidate() {},

        dispose() {
          disposeBranchListener();

          if (tuiRef === tui) {
            tuiRef = undefined;
          }
        },
      };
    });
  });
}
