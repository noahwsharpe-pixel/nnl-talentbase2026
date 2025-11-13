NNL TalentBase — Vite React project (ready for Vercel)

Important environment variables (set these in Vercel dashboard):
- VITE_SUPABASE_URL = your Supabase project URL
- VITE_SUPABASE_ANON_KEY = your Supabase anon public key

Supabase setup (quick):
1. Create a free Supabase project.
2. In SQL Editor, run the SQL from the earlier instructions to create 'teams' and 'players' tables.
3. Create a Storage bucket named 'player-photos' (public for easiest setup).
4. Use the included sample data file 'nnl_sample_data.json' to import via the app's Import feature or insert via Supabase UI.

Deployment:
1. Create a GitHub repo and push this folder.
2. In Vercel, import the repo and set the environment variables above.
3. Deploy.

Admin email: noahwsharpe@gmail.com
Site header: NNL TalentBase
Theme: Light/Dark toggle included.
