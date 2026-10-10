import type {
  BehaviorEvent,
  BehaviorQuery,
} from '../../domain/entities/behavior-event.entity.js';

export interface BehaviorPort {
  append(events: BehaviorEvent[]): Promise<number>;
  overview(query: BehaviorQuery): Promise<Record<string, unknown>>;
  rebuildDaily(since: Date): Promise<void>;
  touchUser(userId: string, login: boolean): Promise<void>;
  observeMenu(restaurantId: string, actorUserId: string): Promise<void>;
}

export interface BehaviorRecorder {
  record(event: string, data?: Partial<Omit<BehaviorEvent, 'event'>>): void;
}
