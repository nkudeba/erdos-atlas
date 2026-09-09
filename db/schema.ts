import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const runs=sqliteTable('run_results',{
 id:text('id').primaryKey(),problem:integer('problem').notNull(),revision:text('revision').notNull(),
 updatedAt:text('updated_at').notNull(),payload:text('payload').notNull(),
},t=>[index('idx_run_problem_updated').on(t.problem,t.updatedAt)]);
export const publisher=sqliteTable('publisher_status',{id:integer('id').primaryKey(),seenAt:text('seen_at').notNull()});
