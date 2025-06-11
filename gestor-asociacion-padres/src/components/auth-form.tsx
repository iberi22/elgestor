'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthFormProps {
  mode: 'signin' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('') // Only for signup
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const title = mode === 'signin' ? 'Sign In' : 'Sign Up'
  const description = mode === 'signin' ? 'Enter your credentials to access your account.' : 'Create a new account.'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      if (signUpError) {
        setError(signUpError.message)
      } else if (data.user) {
        // Insert into profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, full_name: fullName, role: 'parent' }]) // Default role 'parent'

        if (profileError) {
          setError(`Error creating profile: ${profileError.message}`)
          // Potentially delete the auth user if profile creation fails or handle it otherwise
        } else {
          setMessage('Sign up successful! Please check your email to verify your account.')
          // Redirect or clear form, for now, just a message
          // router.push('/')
        }
      } else {
         setMessage('Sign up successful! Please check your email to verify your account.')
      }
    } else { // Sign In
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(signInError.message)
      } else {
        setMessage('Sign in successful! Redirecting...')
        router.push('/dashboard') // Redirect to a dashboard page after sign in
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="grid w-full items-center gap-1.5 mb-4">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  type="text"
                  id="fullName"
                  placeholder="Your Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="grid w-full items-center gap-1.5 mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid w-full items-center gap-1.5 mb-6">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                placeholder="Your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (mode === 'signin' ? 'Signing In...' : 'Signing Up...') : title}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm">
          {mode === 'signin' ? (
            <p>Don't have an account? <a href="/signup" className="underline">Sign Up</a></p>
          ) : (
            <p>Already have an account? <a href="/signin" className="underline">Sign In</a></p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
