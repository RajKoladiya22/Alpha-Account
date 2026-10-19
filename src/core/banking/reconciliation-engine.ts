// Invariant 4: Bank Reconciliation Hierarchical Matching Pipeline

import {
  MatchStage,
  InvoiceStatus,
  BillStatus,
} from "../../types/index.ts";
import type {
  BankStatementLineItem,
  BankRuleItem,
  MatchResult,
  InvoiceEntity,
  BillEntity,
} from "../../types/index.ts";

export class BankReconciliationEngine {
  private rules: BankRuleItem[] = [];
  private openInvoices: InvoiceEntity[] = [];
  private openBills: BillEntity[] = [];
  private historicalMemory: Map<string, { accountId: string; contactId?: string }> = new Map();

  public addBankRule(rule: BankRuleItem): void {
    this.rules.push(rule);
    // Sort rules by priority ascending
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  public setOpenInvoices(invoices: InvoiceEntity[]): void {
    this.openInvoices = invoices.filter(
      (inv) => inv.status === InvoiceStatus.AUTHORIZED || inv.status === InvoiceStatus.PARTIALLY_PAID
    );
  }

  public setOpenBills(bills: BillEntity[]): void {
    this.openBills = bills.filter(
      (bill) => bill.status === BillStatus.AUTHORIZED || bill.status === BillStatus.PARTIALLY_PAID
    );
  }

  public recordHistoricalMemory(narrationPattern: string, accountId: string, contactId?: string): void {
    this.historicalMemory.set(narrationPattern.toLowerCase().trim(), { accountId, contactId });
  }

  // Invariant 4: Strict Hierarchical Matching Execution
  public reconcileLine(line: BankStatementLineItem): MatchResult {
    // -------------------------------------------------------------
    // STEP 1: USER-DEFINED CONDITIONAL BANK RULES
    // -------------------------------------------------------------
    const ruleMatch = this.evaluateRules(line);
    if (ruleMatch) {
      return ruleMatch;
    }

    // -------------------------------------------------------------
    // STEP 2: EXACT MATCHES (1:1 Amount, Polarity, Reference/Contact)
    // -------------------------------------------------------------
    const exactMatch = this.evaluateExactMatch(line);
    if (exactMatch) {
      return exactMatch;
    }

    // -------------------------------------------------------------
    // STEP 3: HEURISTIC / PROBABILISTIC MATCHES
    // -------------------------------------------------------------
    const heuristicMatch = this.evaluateHeuristicMatch(line);
    if (heuristicMatch) {
      return heuristicMatch;
    }

    // -------------------------------------------------------------
    // STEP 4: FALLBACK TO MANUAL ALLOCATION
    // -------------------------------------------------------------
    return {
      statementLineId: line.id,
      stage: MatchStage.MANUAL,
      confidenceScore: 0.0,
      reason: "No deterministic rule, exact 1:1 match, or high-confidence heuristic candidate found. Manual allocation required.",
    };
  }

  // Step 1: Rule Engine
  private evaluateRules(line: BankStatementLineItem): MatchResult | null {
    const isMoneyIn = line.amount > 0;
    const requiredType = isMoneyIn ? "RECEIVE" : "SPEND";

    for (const rule of this.rules) {
      if (rule.targetType !== requiredType) continue;

      let allConditionsMet = true;
      for (const cond of rule.conditions) {
        if (cond.field === "narration") {
          const narrationText = line.narration.toLowerCase();
          const targetVal = String(cond.value).toLowerCase();

          if (cond.operator === "CONTAINS" && !narrationText.includes(targetVal)) {
            allConditionsMet = false;
            break;
          }
          if (cond.operator === "EQUALS" && narrationText !== targetVal) {
            allConditionsMet = false;
            break;
          }
          if (cond.operator === "STARTS_WITH" && !narrationText.startsWith(targetVal)) {
            allConditionsMet = false;
            break;
          }
          if (cond.operator === "REGEX") {
            const re = new RegExp(String(cond.value), "i");
            if (!re.test(line.narration)) {
              allConditionsMet = false;
              break;
            }
          }
        } else if (cond.field === "amount") {
          const absLineAmount = Math.abs(line.amount);
          const targetAmount = Number(cond.value);
          if (Math.abs(absLineAmount - targetAmount) > 0.001) {
            allConditionsMet = false;
            break;
          }
        }
      }

      if (allConditionsMet) {
        return {
          statementLineId: line.id,
          stage: MatchStage.RULE,
          confidenceScore: 1.0,
          matchedDocumentType: "RULE",
          matchedDocumentId: rule.id,
          targetAccountId: rule.targetAccountId,
          targetContactId: rule.targetContactId,
          reason: `Matched conditional Bank Rule '${rule.ruleName}' (Priority ${rule.priority}).`,
        };
      }
    }

    return null;
  }

  // Step 2: Exact Match
  private evaluateExactMatch(line: BankStatementLineItem): MatchResult | null {
    const narrationLower = line.narration.toLowerCase();

    if (line.amount > 0) {
      // Money In: Match against open Accounts Receivable Invoices
      for (const inv of this.openInvoices) {
        const isAmountMatch = Math.abs(inv.amountDue - line.amount) < 0.001;
        const isRefMatch = narrationLower.includes(inv.invoiceNumber.toLowerCase());

        if (isAmountMatch && isRefMatch) {
          return {
            statementLineId: line.id,
            stage: MatchStage.EXACT,
            confidenceScore: 1.0,
            matchedDocumentType: "INVOICE",
            matchedDocumentId: inv.id,
            reason: `Exact 1:1 match with Invoice ${inv.invoiceNumber} for $${inv.amountDue}.`,
          };
        }
      }
    } else {
      // Money Out: Match against open Accounts Payable Bills
      const absAmount = Math.abs(line.amount);
      for (const bill of this.openBills) {
        const isAmountMatch = Math.abs(bill.amountDue - absAmount) < 0.001;
        const isRefMatch = narrationLower.includes(bill.billNumber.toLowerCase());

        if (isAmountMatch && isRefMatch) {
          return {
            statementLineId: line.id,
            stage: MatchStage.EXACT,
            confidenceScore: 1.0,
            matchedDocumentType: "BILL",
            matchedDocumentId: bill.id,
            reason: `Exact 1:1 match with Bill ${bill.billNumber} for $${bill.amountDue}.`,
          };
        }
      }
    }

    return null;
  }

  // Step 3: Heuristic Multi-Factor Scoring
  private evaluateHeuristicMatch(line: BankStatementLineItem): MatchResult | null {
    let bestScore = 0;
    let bestCandidate: { type: "INVOICE" | "BILL"; doc: InvoiceEntity | BillEntity; reason: string } | null = null;

    const lineDate = line.date.getTime();
    const narrationLower = line.narration.toLowerCase();

    if (line.amount > 0) {
      // Evaluate against all open invoices
      for (const inv of this.openInvoices) {
        let score = 0;
        const reasons: string[] = [];

        // 1. Amount proximity (up to 0.40)
        if (Math.abs(inv.amountDue - line.amount) < 0.001) {
          score += 0.4;
          reasons.push("exact amount match (0.40)");
        } else if (Math.abs(inv.amountDue - line.amount) / inv.amountDue < 0.05) {
          score += 0.2;
          reasons.push("amount within 5% (0.20)");
        }

        // 2. Date proximity window (up to 0.25)
        const dayDiff = Math.abs(lineDate - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff <= 7) {
          score += 0.25;
          reasons.push(`date within ${Math.ceil(dayDiff)} days of due date (0.25)`);
        } else if (dayDiff <= 30) {
          score += 0.1;
          reasons.push("date within 30 days (0.10)");
        }

        // 3. String similarity / Contact matching (up to 0.20)
        if (narrationLower.includes(inv.contactId.toLowerCase())) {
          score += 0.2;
          reasons.push("contact identifier identified in narration (0.20)");
        } else if (this.calculateLevenshteinSimilarity(narrationLower, inv.contactId.toLowerCase()) > 0.6) {
          score += 0.15;
          reasons.push("fuzzy contact name similarity (0.15)");
        }

        // 4. Historical transaction memory (up to 0.15)
        for (const [pattern] of this.historicalMemory.entries()) {
          if (narrationLower.includes(pattern)) {
            score += 0.15;
            reasons.push(`matches historical pattern '${pattern}' (0.15)`);
            break;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = { type: "INVOICE", doc: inv, reason: reasons.join(", ") };
        }
      }
    } else {
      // Evaluate against open bills
      const absAmount = Math.abs(line.amount);
      for (const bill of this.openBills) {
        let score = 0;
        const reasons: string[] = [];

        if (Math.abs(bill.amountDue - absAmount) < 0.001) {
          score += 0.4;
          reasons.push("exact amount match (0.40)");
        }

        const dayDiff = Math.abs(lineDate - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff <= 7) {
          score += 0.25;
          reasons.push("date within 7 days (0.25)");
        }

        if (narrationLower.includes(bill.contactId.toLowerCase())) {
          score += 0.2;
          reasons.push("contact identified (0.20)");
        }

        for (const [pattern] of this.historicalMemory.entries()) {
          if (narrationLower.includes(pattern)) {
            score += 0.15;
            reasons.push("historical memory match (0.15)");
            break;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = { type: "BILL", doc: bill, reason: reasons.join(", ") };
        }
      }
    }

    // Heuristic Threshold: minimum 0.65 confidence to recommend
    if (bestCandidate && bestScore >= 0.65) {
      const docIdentifier =
        bestCandidate.type === "INVOICE"
          ? (bestCandidate.doc as InvoiceEntity).invoiceNumber
          : (bestCandidate.doc as BillEntity).billNumber;

      return {
        statementLineId: line.id,
        stage: MatchStage.HEURISTIC,
        confidenceScore: Math.round(bestScore * 100) / 100,
        matchedDocumentType: bestCandidate.type,
        matchedDocumentId: bestCandidate.doc.id,
        reason: `Suggested Match for ${bestCandidate.type} ${docIdentifier} [Confidence: ${(bestScore * 100).toFixed(0)}%]: ${bestCandidate.reason}`,
      };
    }

    return null;
  }

  // Simple string similarity helper
  private calculateLevenshteinSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;

    const costs = new Array();
    for (let i = 0; i <= longer.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= shorter.length; j++) {
        if (i === 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[shorter.length] = lastValue;
    }

    return (longer.length - costs[shorter.length]) / longer.length;
  }
}
