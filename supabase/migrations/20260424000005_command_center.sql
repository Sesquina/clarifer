-- Team tasks (Kanban cards)
CREATE TABLE IF NOT EXISTS public.team_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  lane TEXT NOT NULL CHECK (lane IN ('build','samira','michael','blocked')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high','medium','low')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','done','archived')),
  due_date DATE,
  category TEXT CHECK (category IN (
    'development','organizational','partnerships',
    'sales','content','legal','infrastructure'
  )),
  assigned_to TEXT,
  created_by TEXT DEFAULT 'claude',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;
-- Command center is internal only; no public access.
-- Service role bypasses RLS automatically.
CREATE POLICY "team_tasks_service_only" ON public.team_tasks
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_team_tasks_lane
  ON public.team_tasks(lane);
CREATE INDEX IF NOT EXISTS idx_team_tasks_status
  ON public.team_tasks(status);

-- Sprint updates (history of every completed sprint)
CREATE TABLE IF NOT EXISTS public.sprint_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_name TEXT NOT NULL,
  sprint_number TEXT,
  branch TEXT,
  summary TEXT NOT NULL,
  tests_before INTEGER,
  tests_after INTEGER,
  files_changed INTEGER,
  migrations_pending JSONB DEFAULT '[]',
  manual_actions JSONB DEFAULT '[]',
  blockers JSONB DEFAULT '[]',
  next_sprint TEXT,
  commit_hash TEXT,
  built_by TEXT DEFAULT 'claude',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sprint_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sprint_updates_service_only"
  ON public.sprint_updates FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_sprint_updates_created_at
  ON public.sprint_updates(created_at DESC);

-- Agent run log
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','error','warning')),
  summary TEXT,
  details JSONB,
  ran_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_runs_service_only"
  ON public.agent_runs FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_name_ran_at
  ON public.agent_runs(agent_name, ran_at DESC);
