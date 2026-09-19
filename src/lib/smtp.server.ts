/**
 * Minimal SMTP client (server-only).
 *
 * Supports implicit TLS (port 465) and STARTTLS (port 587/25) with AUTH LOGIN
 * or AUTH PLAIN. Deliberately dependency-free: the edge runtime this app is
 * deployed to cannot run nodemailer.
 */
import { connect as netConnect, type Socket } from "node:net";
import { connect as tlsConnect, type TLSSocket } from "node:tls";

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean; // implicit TLS (usually port 465)
};

export type SmtpMessage = {
  from: string; // "Name <addr@domain>"
  fromAddress: string; // bare address for MAIL FROM
  to: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
};

class Session {
  private buffer = "";
  private queue: Array<(line: string) => void> = [];
  private failure: ((e: Error) => void)[] = [];
  private socket: Socket | TLSSocket;

  constructor(socket: Socket | TLSSocket) {
    this.socket = socket;
    this.attach();
  }

  private attach() {
    this.socket.setEncoding("utf8");
    this.socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      this.drain();
    });
    this.socket.on("error", (e: Error) => {
      const rejectors = this.failure.splice(0);
      for (const r of rejectors) r(e);
    });
  }

  /** A complete SMTP reply ends with "NNN <space>" on its last line. */
  private drain() {
    while (this.queue.length > 0) {
      const lines = this.buffer.split(/\r?\n/);
      let end = -1;
      for (let i = 0; i < lines.length; i += 1) {
        const l = lines[i]!;
        if (/^\d{3} /.test(l)) {
          end = i;
          break;
        }
      }
      if (end === -1) return;
      const reply = lines.slice(0, end + 1).join("\n");
      this.buffer = lines.slice(end + 1).join("\n");
      this.queue.shift()!(reply);
    }
  }

  read(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("SMTP timeout")), 20000);
      this.queue.push((line) => {
        clearTimeout(timer);
        resolve(line);
      });
      this.failure.push((e) => {
        clearTimeout(timer);
        reject(e);
      });
      this.drain();
    });
  }

  write(line: string) {
    this.socket.write(`${line}\r\n`);
  }

  async command(line: string, expect: number[]): Promise<string> {
    this.write(line);
    const reply = await this.read();
    const code = Number(reply.slice(0, 3));
    if (!expect.includes(code)) {
      throw new Error(`SMTP ${code}: ${reply.split("\n").pop() ?? reply}`);
    }
    return reply;
  }

  replace(socket: TLSSocket) {
    this.socket.removeAllListeners("data");
    this.socket = socket;
    this.buffer = "";
    this.attach();
  }

  end() {
    try {
      this.socket.end();
    } catch {
      /* already closed */
    }
  }
}

function openSocket(cfg: SmtpConfig): Promise<Socket | TLSSocket> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("SMTP connection timeout")), 15000);
    const done = (s: Socket | TLSSocket) => {
      clearTimeout(timer);
      resolve(s);
    };
    if (cfg.secure) {
      const s = tlsConnect({ host: cfg.host, port: cfg.port, servername: cfg.host }, () => done(s));
      s.once("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
    } else {
      const s = netConnect({ host: cfg.host, port: cfg.port }, () => done(s));
      s.once("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
    }
  });
}

function upgrade(socket: Socket, host: string): Promise<TLSSocket> {
  return new Promise((resolve, reject) => {
    const s = tlsConnect({ socket, servername: host }, () => resolve(s));
    s.once("error", reject);
  });
}

function encodeHeader(value: string) {
  // RFC 2047 for non-ASCII subjects so accents don't break the header.
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function dotStuff(body: string) {
  return body.replace(/\r?\n/g, "\r\n").replace(/\r\n\./g, "\r\n..");
}

function buildMime(msg: SmtpMessage) {
  const boundary = `b_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const headers = [
    `From: ${msg.from}`,
    `To: ${msg.to.join(", ")}`,
    msg.replyTo ? `Reply-To: ${msg.replyTo}` : null,
    `Subject: ${encodeHeader(msg.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${msg.fromAddress.split("@")[1] ?? "localhost"}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ]
    .filter(Boolean)
    .join("\r\n");

  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    msg.text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    msg.html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return `${headers}\r\n\r\n${body}`;
}

export async function smtpSend(cfg: SmtpConfig, msg: SmtpMessage): Promise<void> {
  const socket = await openSocket(cfg);
  const session = new Session(socket);
  try {
    const greeting = await session.read();
    if (!greeting.startsWith("220")) throw new Error(`SMTP greeting: ${greeting}`);

    const ehloName = "scousgiftcardexchange";
    let caps = await session.command(`EHLO ${ehloName}`, [250]);

    if (!cfg.secure && /STARTTLS/i.test(caps)) {
      await session.command("STARTTLS", [220]);
      const secured = await upgrade(socket as Socket, cfg.host);
      session.replace(secured);
      caps = await session.command(`EHLO ${ehloName}`, [250]);
    }

    if (cfg.user && cfg.pass) {
      if (/AUTH[^\n]*PLAIN/i.test(caps)) {
        const token = Buffer.from(`\0${cfg.user}\0${cfg.pass}`, "utf8").toString("base64");
        await session.command(`AUTH PLAIN ${token}`, [235]);
      } else {
        await session.command("AUTH LOGIN", [334]);
        await session.command(Buffer.from(cfg.user, "utf8").toString("base64"), [334]);
        await session.command(Buffer.from(cfg.pass, "utf8").toString("base64"), [235]);
      }
    }

    await session.command(`MAIL FROM:<${msg.fromAddress}>`, [250]);
    for (const rcpt of msg.to) {
      await session.command(`RCPT TO:<${rcpt}>`, [250, 251]);
    }
    await session.command("DATA", [354]);
    session.write(`${dotStuff(buildMime(msg))}\r\n.`);
    const stored = await session.read();
    if (!stored.startsWith("250")) throw new Error(`SMTP data: ${stored}`);
    await session.command("QUIT", [221, 250]).catch(() => undefined);
  } finally {
    session.end();
  }
}
