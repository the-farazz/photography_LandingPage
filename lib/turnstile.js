/**
 * Server-side verification for Cloudflare Turnstile CAPTCHA tokens
 * 
 * @param {string} token - Turnstile token submitted from client
 * @param {string} remoteIp - Visitor IP address (optional)
 * @returns {Promise<{ success: boolean, error?: string, errorCodes?: Array<string> }>}
 */
export async function verifyTurnstileToken(token, remoteIp = "") {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If secret key is not set in environment variables, log a warning and pass verification in dev mode
  if (!secretKey) {
    console.warn(
      "[Turnstile] TURNSTILE_SECRET_KEY is not defined in environment variables. Skipping backend verification."
    );
    return { success: true, warning: "Turnstile secret key missing" };
  }

  if (!token) {
    return {
      success: false,
      error: "Cloudflare Turnstile verification failed: CAPTCHA token is missing.",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    const data = await res.json();

    if (!data.success) {
      console.warn("[Turnstile] Server verification failed:", data["error-codes"]);
      return {
        success: false,
        error: "CAPTCHA security check failed. Please refresh and try again.",
        errorCodes: data["error-codes"],
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[Turnstile] Error calling Cloudflare verification API:", error);
    return {
      success: false,
      error: "Unable to verify CAPTCHA token with Cloudflare server.",
    };
  }
}
