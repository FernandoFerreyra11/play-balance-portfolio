import { pgTable, text, integer, timestamp, uuid, pgEnum, primaryKey, AnyPgColumn } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['parent', 'child', 'super_admin', 'professional', 'org_admin']);
export const statusEnum = pgEnum('status', ['pending', 'approved', 'rejected']);
export const questStatusEnum = pgEnum('quest_status', ['in_progress', 'pending_approval', 'completed']);
export const receiverTypeEnum = pgEnum('receiver_type', ['parents', 'children', 'professional']);
export const routineStatusEnum = pgEnum('routine_status', ['active', 'archived']);
export const feedbackTypeEnum = pgEnum('feedback_type', ['bug', 'feature', 'other']);

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  logo: text('logo'),
  primaryColor: text('primary_color').default('#06b6d4'),
  config: text('config'), // JSON stringificado para ajustes extra
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  password: text('password'),
  image: text('image'),
  role: roleEnum('role').default('child'),
  parentId: uuid('parent_id'),
  familyId: uuid('family_id').references((): AnyPgColumn => families.id),
  organizationId: uuid('organization_id').references(() => organizations.id), // Vinculado a una clínica/escuela
  balance: integer('balance').default(0),
  subscriptionPlan: text('subscription_plan').default('free'), // 'free', 'growth', 'unlimited'
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastCheckinDate: text('last_checkin_date'), // 'YYYY-MM-DD' para comparación simple de fechas
  birthDate: text('birth_date'), // 'YYYY-MM-DD' para calcular la edad del niño
  licenseNumber: text('license_number'), // PASO 1 (Backend): Nueva columna en la base de datos para guardar la matrícula del profesional
  botTheme: text('bot_theme').default('botanical'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
});

export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique().notNull(),
  plan: text('plan').default('free'), // 'free' o 'premium'
  organizationId: uuid('organization_id').references(() => organizations.id), // Familia bajo una organización
  professionalId: uuid('professional_id').references((): AnyPgColumn => users.id), // Terapeuta asignado
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
});

export const accounts = pgTable('accounts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
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
  familyId: uuid('family_id').references(() => families.id), // Vinculado a la familia
  targetChildId: uuid('target_child_id').references(() => users.id), // Si es null, es para todos los niños de la familia
  isTherapy: integer('is_therapy').default(0), // 0 = false, 1 = true (Misión Clínica)
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rewards = pgTable('rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  cost: integer('cost').notNull(),
  minutes: integer('minutes'),
  icon: text('icon'),
  familyId: uuid('family_id').references(() => families.id), // Vinculado a la familia
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

export const rewardClaims = pgTable('reward_claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  childId: uuid('child_id').references(() => users.id).notNull(),
  rewardId: uuid('reward_id').references(() => rewards.id).notNull(),
  status: statusEnum('status').default('pending'),
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

export const professionalNotes = pgTable('professional_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  professionalId: uuid('professional_id').references(() => users.id).notNull(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  childId: uuid('child_id').references(() => users.id), // Opcional, puede ser nota general de la familia o específica de un niño
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(), // Pro, Parent, or Child
  receiverType: receiverTypeEnum('receiver_type').notNull(), // 'parents', 'children', 'professional'
  content: text('content').notNull(),
  read: integer('read').default(0), // 0 = false, 1 = true
  createdAt: timestamp('created_at').defaultNow(),
});

export const bodyCheckins = pgTable('body_checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  childId: uuid('child_id').references(() => users.id).notNull(),
  eyes: text('eyes').notNull(),  // 'tired' | 'normal' | 'good'
  neck: text('neck').notNull(),  // 'tense' | 'normal' | 'good'
  head: text('head').notNull(),  // 'dizzy' | 'normal' | 'clear'
  createdAt: timestamp('created_at').defaultNow(),
});

export const moodCheckins = pgTable('mood_checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  childId: uuid('child_id').references(() => users.id).notNull(),
  mood: text('mood').notNull(),       // 'happy' | 'calm' | 'neutral' | 'sad' | 'anxious' | 'angry'
  energy: text('energy').notNull(),   // 'low' | 'medium' | 'high'
  note: text('note'),                 // Reflexión opcional
  createdAt: timestamp('created_at').defaultNow(),
});

export const routines = pgTable('routines', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon').default('🌙'),
  totalTokens: integer('total_tokens').notNull(),
  steps: text('steps').notNull(), // JSON array: [{order, title, icon, tokens}]
  status: routineStatusEnum('status').default('active'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const routineCompletions = pgTable('routine_completions', {
  id: uuid('id').defaultRandom().primaryKey(),
  childId: uuid('child_id').references(() => users.id).notNull(),
  routineId: uuid('routine_id').references(() => routines.id).notNull(),
  stepsCompleted: integer('steps_completed').default(0),
  totalSteps: integer('total_steps').notNull(),
  completed: integer('completed').default(0), // 0 = en progreso, 1 = completada
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const jomoProjects = pgTable('jomo_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  childId: uuid('child_id').references(() => users.id).notNull(),
  title: text('title').notNull(),                 // Ej: "Armé un fuerte"
  description: text('description').notNull(),     // Detalles de lo que hizo
  minutesSpent: integer('minutes_spent'),         // Tiempo invertido (opcional)
  suggestedTokens: integer('suggested_tokens'),   // ¿Cuántos tokens cree que vale?
  grantedTokens: integer('granted_tokens'),       // Lo que finalmente otorga el padre
  status: statusEnum('status').default('pending'),// pending, approved, rejected
  parentFeedback: text('parent_feedback'),        // Comentarios del padre
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
});

export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant', 'system']);

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  childId: uuid('child_id').references(() => users.id).notNull(),
  title: text('title').default('Nueva Conversación'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => chatSessions.id, { onDelete: 'cascade' }).notNull(),
  role: chatRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const betaFeedback = pgTable('beta_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id),
  userId: uuid('user_id').references(() => users.id).notNull(), // El padre que lo envía
  type: feedbackTypeEnum('type').default('other'),
  content: text('content').notNull(),
  status: statusEnum('status').default('pending'), // pending, reviewed
  adminResponse: text('admin_response'),
  createdAt: timestamp('created_at').defaultNow(),
});
