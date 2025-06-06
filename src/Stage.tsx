import { ReactElement } from "react";
import {
  StageBase,
  InitialData,
  Message,
  StageResponse,
  LoadResponse
} from "@chub-ai/stages-ts";

/*  Hidden ledger seed  */
import ledgerSeed from "./assets/relationship_char.json";

/* ---------- Type aliases (matching template style) ---------- */
type InitStateType    = { seed: typeof ledgerSeed };
type MessageStateType = { ledger: typeof ledgerSeed };
type ChatStateType    = unknown;
type ConfigType       = unknown;

/* ---------- Stage implementation ---------- */
export class Stage extends StageBase<
  InitStateType,
  ChatStateType,
  MessageStateType,
  ConfigType
> {
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

  /* Runs once after constructor */
  async load(): Promise<
    Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>
  > {
    return {
      initState:    { seed: ledgerSeed },
      messageState: { ledger: structuredClone(ledgerSeed) }
    };
  }

  /* No prompt injection yet */
  async beforePrompt(
    _userMessage: Message
  ): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    return {};
  }

  /* Called right after the assistant’s reply */
  async afterResponse(
    botMessage: Message
  ): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    /* Clone the working ledger (or fallback to seed) */
    const working = structuredClone(
      this.messageState?.ledger ?? ledgerSeed
    );

    /* 🔧  Insert your metric-update logic here
       Example:
       if (/hug|cuddle/i.test(botMessage.content))
           working.metrics.affection.value += 5;
    */

    /* Simple decay step (demo) */
    Object.values(working.metrics as any).forEach((m: any) => {
      m.value -= m.decay;
    });

    return { messageState: { ledger: working } };
  }

  /* No visible UI — stage stays hidden */
  render(): ReactElement {
    return <></>;
  }
}

export default Stage;
