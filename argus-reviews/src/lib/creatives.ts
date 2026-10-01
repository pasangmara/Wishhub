export function defaultCaption(opts: { feedback: string; name: string | null; rating: number; businessName: string; type: string }) {
  const quote = opts.feedback.length > 220 ? `${opts.feedback.slice(0, 217).trimEnd()}…` : opts.feedback;
  const who = opts.name ? ` — ${opts.name.split(" ")[0]}` : "";
  const stars = "★".repeat(opts.rating);
  const verb = opts.type === "hotel" || opts.type === "resort" ? "staying with us" : "visiting us";
  return `${stars}\n\n“${quote}”${who}\n\nThank you for ${verb} at ${opts.businessName}! 💚\n\n#GuestLove #${opts.businessName.replace(/[^a-z0-9]/gi, "")}`;
}
