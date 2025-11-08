import chalk from "chalk";
/**
 * Formats message input to a consistent string output
 */
function format(msg) {
    if (msg instanceof Error)
        return chalk.red(msg.message);
    if (typeof msg === "object")
        return chalk.white(JSON.stringify(msg, null, 2));
    return chalk.white(String(msg));
}
/**
 * Typed CLI Logger utility with colors
 */
export const log = {
    info: (msg) => {
        console.log(` ${chalk.cyan("ℹ INFO")}  ${format(msg)}`);
    },
    success: (msg) => {
        console.log(` ${chalk.green("✔ SUCCESS")}  ${format(msg)}`);
    },
    warn: (msg) => {
        console.warn(` ${chalk.yellow("⚠ WARN")}  ${format(msg)}`);
    },
    error: (msg) => {
        console.error(` ${chalk.red("✖ ERROR")}  ${format(msg)}`);
    },
    debug: (msg) => {
        if (process.env.DEBUG === "true") {
            console.log(` ${chalk.magenta("🐛 DEBUG")}  ${format(msg)}`);
        }
    },
    divider: () => {
        console.log(chalk.gray("──────────────────────────────────────────────"));
    },
};
