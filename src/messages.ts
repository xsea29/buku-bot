import type { Limits } from "./config";
import type { BookRequest } from "./types";

/** All user-facing copy lives here so wording (or translation) never touches logic. */
export const messages = {
  help: [
    "🐧 Hiii, I'm Buku!",
    "",
    "🐾 I'll wiggle my tiny paws to find your ebook.",
    "📚 /request — Request a book",
    "💌 /email — Add your email to a request",
    "🐧 /thanks — Send Buku some love",
    "🫶 /help — Show these commands",
    "",
    "Requests are reviewed by my human before delivery.",
  ].join("\n"),

  startInGroup: "Psst! Please open my private chat to request a book. 🐾",
  requestInGroup: "Please request your ebook in my private chat. 💌",
  emailInGroup: "Please share your email in my private chat only. 💌",
  thanks: "Eeeep! You're welcome! *happy little waddle* 🐧💙",
  cancelled: "Request input cancelled. No worries! 🐾",
  noActiveStep: "Want an ebook? Send /request and I'll help! 🐧📚",
  startWithRequest: "Let's start with /request so I know which book to find! 📚",
  restartRequest: "Please start again with /request. 🐾",

  askTitle:
    "Yay, let's go book hunting! 📚🐾\n\nWhat's the title of the ebook you'd like?",
  askEmail:
    "Please type the email address where you'd like your ebook delivered. 💌\n\nOnly send it here in this private chat.",
  invalidEmail: "Oopsie! That email doesn't look quite right. Please try again. 💌",

  invalidTitle: (limits: Limits) =>
    `Please send a book title between ${limits.titleMin} and ${limits.titleMax} characters. 📚`,

  titleSaved: (title: string) =>
    `A tiny note for my book list: "${title}" 📚💙\n\n` +
    "Now, send the email address where you'd like the book delivered. " +
    "You can also send /cancel to stop.",

  requestSaved: (title: string) =>
    `Yippee! 🐧 Your request for "${title}" is saved!\n\n` +
    "My human will review it and look for an authorized copy. " +
    "I'll let you know when there's an update. 💙",

  admin: {
    deniedVerbose: "Sorry, this command is for Buku's admin only. 🐧",
    denied: "Admin only. 🐧",
    nothingPending: "No requests are waiting for review. 🌿",
    notFound: "I couldn't find that pending request. Check /pending. 🐾",
    usage: (command: string) => `Usage: /${command} REQUEST_ID`,

    pendingList: (rows: BookRequest[]) =>
      rows
        .map(
          (r) =>
            `#${r.id} — ${r.bookTitle}\n` +
            `Email: ${r.email ?? "—"}\n` +
            `User ID: ${r.telegramUserId}` +
            (r.username ? ` (@${r.username})` : "") +
            `\nCreated: ${r.createdAt}`
        )
        .join("\n\n"),

    newRequest: (
      request: Pick<BookRequest, "id" | "bookTitle" | "telegramUserId" | "email">
    ) =>
      `📚 New ebook request #${request.id}\n` +
      `Title: ${request.bookTitle}\n` +
      `Email: ${request.email ?? "—"}\n` +
      `User ID: ${request.telegramUserId}\n` +
      `Review with /pending, then /approve ${request.id} or /reject ${request.id}.`,
  },
};
