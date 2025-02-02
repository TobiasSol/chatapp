import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Home() {
  const [username, setUsername] = useState('')
  const router = useRouter()




  useEffect(() => {
    // Prüfen ob als PWA und Admin
    if (window.matchMedia('(display-mode: standalone)').matches) {
      const isAdmin = localStorage.getItem('isAdmin');
      if (isAdmin) {
        router.replace('/admin');
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!username.trim()) {
      alert('Please enter a username')
      return
    }

    try {
      const { error } = await supabase
        .from('guests')
        .insert([{ username: username.trim() }])

      if (error) {
        console.error('Error inserting guest:', error)
        alert('Failed to join chat. Please try again.')
        return
      }

      localStorage.setItem('username', username.trim())
      router.push('/chat')
      
    } catch (err) {
      console.error('Error:', err)
      alert('An error occurred. Please try again.')
    }
  }

  return (
    <form onSubmit={handleLogin} className="max-w-sm mx-auto mt-10">
      <input 
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="w-full p-2 border rounded text-black"
        required
      />
      <button type="submit" className="w-full mt-2 p-2 bg-blue-500 text-white rounded">
        Join Chat
      </button>
    </form>
  )
}