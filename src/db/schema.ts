import { pgTable, text, integer, timestamp, uuid, pgEnum, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from '@auth/core/adapters';

export const roleEnum = pgEnum('role', ['parent', 'child']);
export const statusEnum = pgEnum('status', ['pending', 'approved', 'rejected']);
export const questStatusEnum = pgEnum('quest_status', ['in_progress', 'pending_approval', 'completed']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  password: text('password'),
  image: text('image'),
  role: roleEnum('role').default('child'),
  balance: integer('balance').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccount['type']>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
}));

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

export const quests = pgTable('quests', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  reward: integer('reward').notNull(),
  category: text('category').default('general'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rewards = pgTable('rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  cost: integer('cost').notNull(),
  minutes: integer('minutes'),
  icon: text('icon'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const suggestions = pgTable('suggestions', {
  id: uuid('id').defaultRandom().primaryKey(),
  childId: uuid('child_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  status: statusEnum('status').default('pending'),
  parentResponse: text('parent_response'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const activeQuests = pgTable('active_quests', {
  id: uuid('id').defaultRandom().primaryKey(),
  childId: uuid('child_id').references(() => users.id).notNull(),
  questId: uuid('quest_id').references(() => quests.id).notNull(),
  status: questStatusEnum('status').default('in_progress'),
  proofUrl: text('proof_url'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(),
  type: text('type').notNull(), // 'earn' or 'spend'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});
