import { ReactElement } from "react";
import {
  StageBase,
  InitialData,
  Message,
  StageResponse,
  LoadResponse
} from "@chub-ai/stages-ts";

/* 🔒 hidden seed JSON  */
import ledgerSeed from "./assets/relationship_char.json";

/* ---------- Types ---------- */
type Ledger             = typeof ledgerSeed;
type InitStateType      = { seed: Ledger };
type MessageStateType   = { ledger: Ledger };
type ChatStateType      = unknown;
type ConfigType         = unknown;

/* ---------- Stage implementation ---------- */
export class Stage extends StageBase<
  InitStateType,
  ChatStateType,
  MessageStateType,
  ConfigType
> {
  /** Working copy that mutates each turn */
  private workingLedger: Ledger = structuredClone(ledgerSeed);

  constructor(
    data: InitialData<
      InitStateType,
      ChatStateType,
      MessageStateType,
      ConfigType
    >
  ) {
    super(data);
  }

  /* 1️⃣  Runs at chat or branch start */
  async load(): Promise<
    Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>
  > {
    this.workingLedger = structuredClone(ledgerSeed);

    return {
      initState:    { seed: ledgerSeed },
      messageState: { ledger: this.workingLedger }
    };
  }

  /* 2️⃣  Engine calls this when restoring state after a swipe */
  async setState(state: MessageStateType): Promise<void> {
    if (state?.ledger) {
      this.workingLedger = structuredClone(state.ledger);
    }
  }

  /* 3️⃣  No prompt injection for now (keeps JSON hidden) */
  async beforePrompt(
    _userMsg: Message
  ): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    return {};
  }

  /* 4️⃣  Update ledger after assistant reply */
  async afterResponse(
    botMsg: Message
  ): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {

    /* --- Example rules (edit as you wish) --- */
    const text = botMsg.content.toLowerCase();
    const m = this.workingLedger.metrics as any;

    /* Positive event */
    if (/thanks|thank you/.test(text)) {
      m.affection.value   += 4;
      m.affection.trend    = 4;
      m.resentment.value  -= 2;          // soften grudges a bit
    }

    /* Negative event */
    if (/idiot|hate you|stupid/.test(text)) {
      m.resentment.value  += 10;
      m.trust.value       -= 5;
    }

    /* Generic decay each turn */
    Object.values(m).forEach((metric: any) => {
      metric.value -= metric.decay;
    });

    return {
      messageState: { ledger: structuredClone(this.workingLedger) }
    };
  }

  /* 5️⃣  No visible UI */
  render(): ReactElement {
    return <></>;
  }
}

export default Stage;
