-- Enable Row-Level Security on all tables and apply access policies.
-- Applied 2026-05-27.

-- SESSIONS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_all" ON sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert_anon" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update_anon" ON sessions FOR UPDATE USING (true);
CREATE POLICY "sessions_delete_admin" ON sessions FOR DELETE USING (auth.role() = 'authenticated');

-- PLAYERS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_select_all" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert_anon" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update_own" ON players FOR UPDATE USING (true);
CREATE POLICY "players_delete_admin" ON players FOR DELETE USING (auth.role() = 'authenticated');

-- MARKS
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marks_select_all" ON marks FOR SELECT USING (true);
CREATE POLICY "marks_insert_anon" ON marks FOR INSERT WITH CHECK (true);
CREATE POLICY "marks_delete_admin" ON marks FOR DELETE USING (auth.role() = 'authenticated');

-- COMPANIES
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_select_all" ON companies FOR SELECT USING (true);
CREATE POLICY "companies_insert_admin" ON companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "companies_update_admin" ON companies FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "companies_delete_admin" ON companies FOR DELETE USING (auth.role() = 'authenticated');

-- TRIVIA_QUESTIONS
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trivia_select_all" ON trivia_questions FOR SELECT USING (true);
CREATE POLICY "trivia_insert_admin" ON trivia_questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "trivia_update_admin" ON trivia_questions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "trivia_delete_admin" ON trivia_questions FOR DELETE USING (auth.role() = 'authenticated');

-- CALL_VOTES
ALTER TABLE call_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_votes_select_all" ON call_votes FOR SELECT USING (true);
CREATE POLICY "call_votes_insert_anon" ON call_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "call_votes_delete_admin" ON call_votes FOR DELETE USING (auth.role() = 'authenticated');

-- PLAYER_BADGES
ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_badges_select_all" ON player_badges FOR SELECT USING (true);
CREATE POLICY "player_badges_insert_anon" ON player_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "player_badges_delete_admin" ON player_badges FOR DELETE USING (auth.role() = 'authenticated');
