-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. People (Team members)
create table people (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  role text not null,
  avatar_url text, -- optional
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Areas (Configurable areas)
create table areas (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Audit Entities (The main audits)
create table audit_entities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  responsible_id uuid references people(id),
  scope text,
  status text check (status in ('Planning', 'Execution', 'Reporting', 'Completed')),
  progress integer default 0,
  start_date date,
  last_updated timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Audit Phases
create table audit_phases (
  id uuid default uuid_generate_v4() primary key,
  audit_id uuid references audit_entities(id) on delete cascade not null,
  name text not null,
  objectives text[], -- Array of strings
  start_week integer,
  duration_weeks integer,
  status text check (status in ('Planning', 'Execution', 'Reporting', 'Completed')),
  alert_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Audit Tasks
create table audit_tasks (
  id uuid default uuid_generate_v4() primary key,
  audit_id uuid references audit_entities(id) on delete cascade not null,
  title text not null,
  status text check (status in ('Pending', 'In Progress', 'Completed')),
  assigned_to uuid references people(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Risk Controls (Risk Matrix)
create table risk_controls (
  id uuid default uuid_generate_v4() primary key,
  audit_id uuid references audit_entities(id) on delete cascade not null,
  process text,
  area text,
  risk_description text,
  impact integer,
  probability integer,
  inherent_risk integer,
  existing_controls text,
  control_effectiveness integer,
  residual_risk integer,
  traffic_light_level text check (traffic_light_level in ('Bajo', 'Medio', 'Alto', 'Crítico')),
  status text check (status in ('Completado', 'En curso', 'Pendiente')),
  responsible text, -- Can be free text or linked to person, keeping simple for now
  implementation_date date,
  recommendation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. CLA Criteria
create table cla_criteria (
  id uuid default uuid_generate_v4() primary key,
  audit_id uuid references audit_entities(id) on delete cascade not null,
  area text,
  criterion text,
  description text,
  source text,
  complies text check (complies in ('Sí', 'No', 'N/A')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Planner Templates (Standard tasks for planner)
create table planner_entries (
  id uuid default uuid_generate_v4() primary key,
  scope text,
  task text,
  phase text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Seed Data (Optional, based on constants.tsx)
-- You can run these inserts after creating the tables to populate initial data.

-- Example: Insert Areas
insert into areas (name) values 
('Compras'), ('Licitación'), ('Almacén'), ('Finanzas'), ('RRHH')
on conflict do nothing;
