import { ReactElement } from "react";
import {
  StageBase,
  InitialData,
  Message,
  StageResponse,
  LoadResponse
} from "@chub-ai/stages-ts";

import ledgerSeed from "./assets/relationship_char.json";

/*
  Headless relationship tracker (matches the verbose JSON version)
  ──────────────────────────────────────────────────────────────
  • Reads `ledgerSeed` once in `load()` and stores a clone in messageState.
  • Decays every metric each turn (basic demo).  Add your own rules where marked.
  • No UI — `render()` returns an empty fragment.
*/

// ---------- Type aliases ----------
export type LedgerSchema   = typeof ledgerSeed;
export interface InitState    { seed: LedgerSchema }
export interface MessageState { ledger: LedgerSchema }
export type ChatState   = unknown;
export type ConfigType  = unknown;

// ---------- Stage implementation ----------
export class Stage extends StageBase<
  InitState,
  ChatState,
  MessageState,
  ConfigType
> {
  constructor(
    data: InitialData<InitState, ChatState, MessageState, ConfigType>
  ) {
    super(data);
  }

  /* 1️⃣  Runs once per chat */
  async load(): Promise<Partial<LoadResponse<InitState, ChatState, MessageState>>> {
    return {
      initState:    { seed: ledgerSeed },              // immutable baseline
      messageState: { ledger: structuredClone(ledgerSeed) } // first working copy
    };
  }

  /* 2️⃣  Hook before sending the user prompt (unused for now) */
  async beforePrompt(
    _userMessage: Message
  ): Promise<Partial<StageResponse<ChatState, MessageState>>> {
    return {};  // inject nothing yet
  }

  /* 3️⃣  Hook after receiving assistant response */
  async afterResponse(
    botMessage: Message,
    state: MessageState
  ): Promise<Partial<StageResponse<ChatState, MessageState>>> {
    // Clone the current working ledger
    const working = structuredClone(state.ledger);

    /*
      🔧 TODO: Add your own event-detection logic here.
      Example: if (/hug|cuddle/i.test(botMessage.content)) working.metrics.affection.value += 5;
    */

    // Generic decay step
    Object.values(working.metrics as any).forEach((m: any) => {
      m.value -= m.decay;
    });

    return { messageState: { ledger: working } };
  }

  /* 4️⃣  No UI — stay hidden */
  render(): ReactElement {
    return <></>;
  }
}

export default Stage;
