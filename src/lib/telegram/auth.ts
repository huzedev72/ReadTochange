import crypto from "crypto";

export interface TelegramUserData {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface ValidatedTelegramAuth {
  user: TelegramUserData;
  authDate: number;
  isValid: boolean;
  isDevBypass?: boolean;
}

/**
 * Validates Telegram WebApp initData string using HMAC-SHA256.
 * In development, if initData is missing or invalid, falls back to a mock user.
 */
export function validateTelegramInitData(
  initData: string | null | undefined,
  botToken: string | undefined = process.env.TELEGRAM_BOT_TOKEN
): ValidatedTelegramAuth {
  // Development Mock Fallback
  if (!initData || initData.trim() === "" || !botToken) {
    if (process.env.NODE_ENV !== "production") {
      return {
        user: {
          id: "dev-user-001",
          first_name: "Alex",
          username: "alex_reader",
        },
        authDate: Math.floor(Date.now() / 1000),
        isValid: true,
        isDevBypass: true,
      };
    }
    return {
      user: { id: "anonymous" },
      authDate: 0,
      isValid: false,
    };
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) {
      if (process.env.NODE_ENV !== "production") {
        return {
          user: { id: "dev-user-001", first_name: "Alex" },
          authDate: Math.floor(Date.now() / 1000),
          isValid: true,
          isDevBypass: true,
        };
      }
      return { user: { id: "anonymous" }, authDate: 0, isValid: false };
    }

    params.delete("hash");

    // Sort parameters alphabetically
    const entries = Array.from(params.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

    // Compute HMAC-SHA256 signature
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    const isValid = computedHash.toLowerCase() === hash.toLowerCase();

    const userRaw = params.get("user");
    const user: TelegramUserData = userRaw ? JSON.parse(userRaw) : { id: "unknown" };
    const authDate = parseInt(params.get("auth_date") || "0", 10);

    return {
      user,
      authDate,
      isValid,
    };
  } catch (error) {
    console.error("Error validating Telegram initData:", error);
    if (process.env.NODE_ENV !== "production") {
      return {
        user: { id: "dev-user-001", first_name: "Alex" },
        authDate: Math.floor(Date.now() / 1000),
        isValid: true,
        isDevBypass: true,
      };
    }
    return { user: { id: "anonymous" }, authDate: 0, isValid: false };
  }
}
