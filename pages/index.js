import { useState, useEffect } from 'react'
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
    <div className="max-w-sm mx-auto mt-10 space-y-6">
      {/* Gast-Login Form */}
      <div className="bg-white/10 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Als Gast chatten</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-2 border rounded text-black"
            required
          />
          <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Chat beitreten
          </button>
        </form>
      </div>

      {/* Admin Login Button */}
      <div className="bg-white/10 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Administrator</h2>
        <button 
          onClick={() => router.push('/login')}
          className="w-full p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          Als Admin anmelden
        </button>
      </div>
    </div>
  )
}