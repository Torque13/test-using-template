
import ledgerSeed from "./assets/relationship_char.json";
import { StageBase, InitialData } from "chub-stage-lib";

type Metric = { value: number; trend: number; decay: number };
interface LedgerSchema { 
    char_id: string;
    personality: Record<string, number>;
    metrics: Record<string, Metric>;
    flags: Record<string, any>;
    memories: any[];
}

interface InitState { seed: LedgerSchema }
interface MessageState { ledger: LedgerSchema }
interface ChatState {}

export default class RelationshipStage extends StageBase<InitState, ChatState, MessageState> {
  constructor(data: InitialData<InitState, ChatState, MessageState>) {
    super(data);
  }

  async load() {
    return { initState: { seed: ledgerSeed } };
  }

  adjust(metricKey: string, delta: number, working: LedgerSchema) {
    const metric = working.metrics[metricKey];
    if (metric) {
      metric.value += delta;
      metric.trend = delta;
    }
  }

  decayAll(working: LedgerSchema) {
    for (const m of Object.values(working.metrics)) {
      m.value -= m.decay;
    }
  }

  async afterResponse({ state, botMessage }) {
    const working: LedgerSchema = structuredClone(state?.ledger ?? this.initState.seed);

    const text = botMessage.content.toLowerCase();

    if (/hug|cuddle|embraces/.test(text)) this.adjust("physical_intimacy", 8, working);
    if (/kiss/.test(text)) {
      this.adjust("physical_intimacy", 12, working);
      this.adjust("sexual_tension", -30, working);
    }
    if (/push(es)? away|rejects/.test(text)) this.adjust("physical_intimacy", -10, working);
    if (/thank(s)? you/.test(text)) this.adjust("trust", 2, working);
    if (/argue|yell/.test(text)) {
      this.adjust("trust", -5, working);
      this.adjust("resentment", 5, working);
    }

    this.decayAll(working);

    return { messageState: { ledger: working } };
  }

  render() {
    return null; // hidden tracker
  }
}
