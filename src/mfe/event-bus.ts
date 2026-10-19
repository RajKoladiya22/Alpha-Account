// Invariant 5: Decoupled Cross-MFE Event Bus

export type MfeEventType =
  | "INVOICE_CREATED"
  | "INVOICE_AUTHORIZED"
  | "BILL_CREATED"
  | "BANK_LINE_RECONCILED"
  | "LOCKOUT_TRIGGERED";

export interface MfeEvent<T = any> {
  type: MfeEventType;
  tenantId: string;
  sourceMfe: "INVOICING" | "BILLS" | "BANKING" | "AUTH_SHELL";
  payload: T;
  timestamp: Date;
}

export type MfeEventHandler<T = any> = (event: MfeEvent<T>) => void;

export class CrossMfeEventBus {
  private handlers = new Map<MfeEventType, Set<MfeEventHandler>>();

  public subscribe<T = any>(type: MfeEventType, handler: MfeEventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    const set = this.handlers.get(type)!;
    set.add(handler);

    // Return unbind function
    return () => {
      set.delete(handler);
    };
  }

  public publish<T = any>(event: MfeEvent<T>): void {
    const set = this.handlers.get(event.type);
    if (set) {
      for (const handler of set) {
        try {
          handler(event);
        } catch (err) {
          console.error(`Error in MFE handler for ${event.type}:`, err);
        }
      }
    }
  }

  public clear(): void {
    this.handlers.clear();
  }
}
