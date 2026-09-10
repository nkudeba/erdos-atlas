import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const runs=sqliteTable('run_results',{
 id:text('id').primaryKey(),problem:integer('problem').notNull(),revision:text('revision').notNull(),
 updatedAt:text('updated_at').notNull(),payload:text('payload').notNull(),
},t=>[index('idx_run_problem_updated').on(t.problem,t.updatedAt)]);
export const publisher=sqliteTable('publisher_status',{id:integer('id').primaryKey(),seenAt:text('seen_at').notNull()});
// Priority-score overrides. The catalogue snapshot stays baked into the build; rows here are what the
// harness has LEARNED since that build (a finished assessment, a new verified proof) and are overlaid live.
export const rankings=sqliteTable('problem_rankings',{
 problem:integer('problem').primaryKey(),revision:text('revision').notNull(),
 updatedAt:text('updated_at').notNull(),payload:text('payload').notNull(),
});
