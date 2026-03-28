import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim()
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim()

const supabase = createClient(url, key)

// Create documents bucket (private)
const { error: e1 } = await supabase.storage
  .createBucket('documents', {
    public: false,
    fileSizeLimit: 52428800
  })
console.log('documents bucket:', e1?.message || 'created')

// Create avatars bucket (public)
const { error: e2 } = await supabase.storage
  .createBucket('avatars', {
    public: true
  })
console.log('avatars bucket:', e2?.message || 'created')
