export const log = (msg, type = "info") => {
  const colors = {
    info: "\x1b[36m%s\x1b[0m",
    success: "\x1b[32m%s\x1b[0m",
    error: "\x1b[31m%s\x1b[0m",
  };
  console.log(colors[type] || colors.info, `[${type.toUpperCase()}] ${msg}`);
};
