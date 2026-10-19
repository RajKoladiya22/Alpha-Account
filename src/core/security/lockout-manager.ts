// Invariant 1: Strict 15-Minute Sliding-Window Brute-Force Lockout Manager

export interface LockoutRecord {
  userId: string;
  failedAttempts: number;
  lockedUntil: Date | null;
  lastFailedAt: Date | null;
  lastResetReqAt: Date | null;
}

export interface LockoutStatus {
  isLocked: boolean;
  failedAttempts: number;
  remainingSeconds: number;
  lockedUntil: Date | null;
  reason?: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  penalized: boolean;
  newLockedUntil?: Date;
  resetToken?: string;
}

export class LockoutManager {
  public static readonly MAX_FAILED_ATTEMPTS = 5;
  public static readonly LOCKOUT_DURATION_SECONDS = 900; // exactly 15 minutes = 900 seconds
  public static readonly SLIDING_WINDOW_SECONDS = 900;

  private records = new Map<string, LockoutRecord>();

  public getRecord(userId: string): LockoutRecord {
    let rec = this.records.get(userId);
    if (!rec) {
      rec = {
        userId,
        failedAttempts: 0,
        lockedUntil: null,
        lastFailedAt: null,
        lastResetReqAt: null,
      };
      this.records.set(userId, rec);
    }
    return rec;
  }

  public checkLockStatus(userId: string, now: Date = new Date()): LockoutStatus {
    const rec = this.getRecord(userId);

    if (rec.lockedUntil && rec.lockedUntil > now) {
      const remainingSeconds = Math.ceil((rec.lockedUntil.getTime() - now.getTime()) / 1000);
      return {
        isLocked: true,
        failedAttempts: rec.failedAttempts,
        remainingSeconds,
        lockedUntil: rec.lockedUntil,
        reason: `Account locked due to repeated failed login attempts. Please wait ${remainingSeconds} seconds.`,
      };
    }

    // Lock has expired or account was never locked
    if (rec.lockedUntil && rec.lockedUntil <= now) {
      // Automatic window reset after expiration
      rec.lockedUntil = null;
      rec.failedAttempts = 0;
    }

    return {
      isLocked: false,
      failedAttempts: rec.failedAttempts,
      remainingSeconds: 0,
      lockedUntil: null,
    };
  }

  public recordFailedAttempt(userId: string, now: Date = new Date()): LockoutStatus {
    const rec = this.getRecord(userId);
    const currentStatus = this.checkLockStatus(userId, now);

    if (currentStatus.isLocked) {
      return currentStatus;
    }

    // Check sliding window: if last failure was longer than SLIDING_WINDOW_SECONDS ago, reset counter
    if (rec.lastFailedAt) {
      const secondsSinceLastFailure = (now.getTime() - rec.lastFailedAt.getTime()) / 1000;
      if (secondsSinceLastFailure > LockoutManager.SLIDING_WINDOW_SECONDS) {
        rec.failedAttempts = 0;
      }
    }

    rec.failedAttempts += 1;
    rec.lastFailedAt = now;

    if (rec.failedAttempts >= LockoutManager.MAX_FAILED_ATTEMPTS) {
      // Invariant 1: Exactly 5 failed attempts locks the account for exactly 900 seconds
      rec.lockedUntil = new Date(now.getTime() + LockoutManager.LOCKOUT_DURATION_SECONDS * 1000);
      return {
        isLocked: true,
        failedAttempts: rec.failedAttempts,
        remainingSeconds: LockoutManager.LOCKOUT_DURATION_SECONDS,
        lockedUntil: rec.lockedUntil,
        reason: "Account locked due to repeated failed login attempts. Please wait 15 minutes (900 seconds).",
      };
    }

    return {
      isLocked: false,
      failedAttempts: rec.failedAttempts,
      remainingSeconds: 0,
      lockedUntil: null,
      reason: `Invalid credentials. Attempt ${rec.failedAttempts} of ${LockoutManager.MAX_FAILED_ATTEMPTS}.`,
    };
  }

  public recordSuccessfulLogin(userId: string): void {
    const rec = this.getRecord(userId);
    rec.failedAttempts = 0;
    rec.lockedUntil = null;
    rec.lastFailedAt = null;
  }

  public requestPasswordReset(userId: string, now: Date = new Date()): PasswordResetResponse {
    const rec = this.getRecord(userId);
    const status = this.checkLockStatus(userId, now);

    // Invariant 1 Rule: Any password reset request received during this active window MUST reset the countdown timer back to 900 seconds.
    if (status.isLocked) {
      rec.lockedUntil = new Date(now.getTime() + LockoutManager.LOCKOUT_DURATION_SECONDS * 1000);
      rec.lastResetReqAt = now;
      return {
        success: false,
        penalized: true,
        message: "Password reset attempted while account is locked. Security policy has reset the lockout window to 15 minutes (900 seconds).",
        newLockedUntil: rec.lockedUntil,
      };
    }

    // Normal reset link issuance
    rec.lastResetReqAt = now;
    return {
      success: true,
      penalized: false,
      message: "Password reset dispatched from security@alphasteelframes.com.au. Valid for 48 hours.",
      resetToken: `rst_${Buffer.from(`${userId}:${now.getTime()}`).toString("base64")}`,
    };
  }
}
