import { ReactElement } from "react";
import {
  StageBase,
  InitialData,
  Message,
  StageResponse,
  LoadResponse
} from "@chub-ai/stages-ts";

import ledgerSeed from "./assets/relationship_char.json"; // 🔒 hidden JSON

/* ---------- Type aliases ---------- */
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
  /** in-memory working copy (mutated each turn) */
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

  /* 1) Runs once at chat/branch start */
  async load(): Promise<
    Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>
  > {
    this.workingLedger = structuredClone(ledgerSeed);
    return {
      success: true,
      error:   null,
      initState:    { seed: ledgerSeed },
      chatState:    null,
      messageState: { ledger: this.workingLedger }
    };
  }

  /* 2) Called when the engine restores state after a swipe */
  async setState(state: MessageStateType): Promise<void> {
    if (state?.ledger) {
      this.workingLedger = structuredClone(state.ledger);
    }
  }

  /* 3) Before the user's prompt is sent to the LLM */
  async beforePrompt(
    _userMsg: Message
  ): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    /*  Invisible system summary (optional) */
    const m = this.workingLedger.metrics as any;
    const digest =
      `REL_STATE: trust=${m.trust.value.toFixed(0)}, ` +
      `affection=${m.affection.value.toFixed(0)}, ` +
      `resentment=${m.resentment.value.toFixed(0)}`;

    return {
      systemMessage: digest,   // LLM sees it; user does not
      messageState:  { ledger: this.workingLedger }
    };
  }

  /* 4) After the assistant replies */
  async afterResponse(
    botMsg: Message
  ): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    /* 🔧 Example rule — boost affection on “thank you” */
    if (/thank you/i.test(botMsg.content)) {
      const aff = (this.workingLedger.metrics as any).affection;
      aff.value += 3; aff.trend = 3;
    }

    /* Generic decay each turn */
    Object.values(this.workingLedger.metrics as any).forEach((m: any) => {
      m.value -= m.decay;
    });

    return {
      messageState: { ledger: structuredClone(this.workingLedger) }
    };
  }

  /* 5) No visible UI */
  render(): ReactElement {
    return <></>;
  }
}

export default Stage;
