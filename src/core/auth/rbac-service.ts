import { UserRole } from "../../types/index.ts";
import type { UserRole as UserRoleType } from "../../types/index.ts";

export class RbacService {
  /**
   * Evaluates if a role has permission to perform an action
   */
  public hasPermission(
    role: UserRoleType,
    action:
      | "VIEW_QUOTES"
      | "CREATE_QUOTE"
      | "EDIT_QUOTE"
      | "SEND_QUOTE"
      | "CONVERT_QUOTE"
      | "DELETE_QUOTE"
      | "MANAGE_SETTINGS"
      | "VIEW_AUDIT_LOGS"
  ): boolean {
    switch (role) {
      case UserRole.OWNER:
      case UserRole.ADVISER:
        return true;

      case UserRole.STANDARD:
        if (action === "MANAGE_SETTINGS" || action === "VIEW_AUDIT_LOGS") {
          return false;
        }
        return true;

      case UserRole.READONLY:
        return action === "VIEW_QUOTES";

      default:
        return false;
    }
  }

  public assertPermission(
    role: UserRoleType,
    action:
      | "VIEW_QUOTES"
      | "CREATE_QUOTE"
      | "EDIT_QUOTE"
      | "SEND_QUOTE"
      | "CONVERT_QUOTE"
      | "DELETE_QUOTE"
      | "MANAGE_SETTINGS"
      | "VIEW_AUDIT_LOGS"
  ): void {
    if (!this.hasPermission(role, action)) {
      throw new Error(`RBAC Authorization Denied: Role ${role} is not permitted to perform ${action}`);
    }
  }
}
