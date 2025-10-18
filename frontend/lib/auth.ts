export type AuthToken = {
  userId: string
  email: string
  role: "employer" | "seeker"
  exp: number
}

export function createToken(userId: string, email: string, role: "employer" | "seeker"): string {
  const token: AuthToken = {
    userId,
    email,
    role,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }
  return Buffer.from(JSON.stringify(token)).toString("base64")
}

export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString())
    if (decoded.exp < Date.now()) {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

export function getUserFromRequest(req: Request): AuthToken | null {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  return verifyToken(token)
}
