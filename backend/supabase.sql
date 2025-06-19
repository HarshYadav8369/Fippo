-- Create users table to store additional user information
create table if not exists users (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text,
  avatar_url text,
  email text unique,
  phone text,
  company text,
  plan text default 'free',
  credits integer default 0
);

-- Create conversion jobs table
create table if not exists conversion_jobs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references users(id) on delete cascade,
  status text not null default 'pending',
  type text not null,
  input_file text not null,
  output_file text,
  error_message text,
  credits_used integer default 1,
  progress integer default 0,
  estimated_completion timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Create function to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language 'plpgsql';

-- Create trigger to update updated_at for users table
create trigger update_users_updated_at
  before update on users
  for each row
  execute function update_updated_at_column();

-- Create trigger to update updated_at for conversion_jobs table
create trigger update_conversion_jobs_updated_at
  before update on conversion_jobs
  for each row
  execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table users enable row level security;
alter table conversion_jobs enable row level security;

-- Create policies for users table
create policy "Users can view their own data"
  on users for select
  using (auth.uid() = id);

create policy "Users can update their own data"
  on users for update
  using (auth.uid() = id);

-- Create policies for conversion_jobs table
create policy "Users can view their own conversion jobs"
  on conversion_jobs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversion jobs"
  on conversion_jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversion jobs"
  on conversion_jobs for update
  using (auth.uid() = user_id);
