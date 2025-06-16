'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select' // Assuming Select is installed via Shadcn
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from '@supabase/supabase-js'

// Mock data for classes - replace with actual data from Supabase
// const MOCK_CLASSES = [
//   { id: 1, name: 'Primero A' },
//   { id: 2, name: 'Primero B' },
//   { id: 3, name: 'Segundo A' },
//   { id: 4, name: 'Segundo B' },
//   { id: 5, name: 'Tercero A' },
//   { id: 6, name: 'Tercero B' },
// ]

interface Student {
  id?: number
  full_name: string
  class_id: number
  class_name?: string // For display
}

export default function ProfileForm() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('') // Parent's full name
  const [students, setStudents] = useState<Student[]>([])
  const [newStudentName, setNewStudentName] = useState('')
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [availableClasses] = useState<{ id: number; name: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true)
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', currentUser.id)
          .single()

        if (profile) {
          setFullName(profile.full_name)
        } else if (profileError) {
          console.error('Error fetching profile:', profileError.message)
          setError('Could not load profile data.')
        }

        // Fetch students for this parent
        // This requires a join or multiple queries. For now, let's assume we can get class names too.
        // In a real scenario, you'd fetch students and then map class_id to class_name.
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id, full_name, class_id, classes ( name )') // Assumes RLS allows and 'classes' is the related table name
          .eq('parent_id', currentUser.id)

        if (studentData) {
          const formattedStudents = studentData.map(s => ({
            id: s.id,
            full_name: s.full_name,
            class_id: s.class_id,
            // @ts-expect-error: s.classes puede ser undefined si no hay relación
            class_name: s.classes?.name || 'Unknown Class'
          }))
          setStudents(formattedStudents)
        } else if (studentError) {
          console.error('Error fetching students:', studentError.message)
          // setError('Could not load student data.') // Might be too noisy if parent has no students yet
        }

        // TODO: Fetch actual classes from the 'classes' table
        // For now, we use MOCK_CLASSES
        // const { data: classesData, error: classesError } = await supabase.from('classes').select('id, name');
        // if (classesData) setAvailableClasses(classesData);
      }
      setLoading(false)
    }
    fetchUserAndProfile()
  }, [])

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !newStudentName || !selectedClassId) {
      setError('Please enter student name and select a class.')
      return
    }
    setLoading(true)
    setError(null)
    setMessage(null)

    const { data: newStudent, error: insertError } = await supabase
      .from('students')
      .insert([{ parent_id: user.id, full_name: newStudentName, class_id: parseInt(selectedClassId) }])
      .select('id, full_name, class_id, classes ( name )') // Fetch with class name
      .single()

    if (insertError) {
      setError(`Error adding student: ${insertError.message}`)
    } else if (newStudent) {
      // @ts-expect-error: newStudent.classes puede ser undefined
      const studentToAdd: Student = { ...newStudent, class_name: newStudent.classes?.name || 'Unknown Class' }
      setStudents([...students, studentToAdd])
      setNewStudentName('')
      setSelectedClassId(null)
      setMessage('Student added successfully!')
    }
    setLoading(false)
  }

  const handleUpdateProfile = async () => {
    if(!user) return;
    setLoading(true); setError(null); setMessage(null);
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);
    if(updateError) setError(`Error updating profile: ${updateError.message}`);
    else setMessage("Profile updated successfully!");
    setLoading(false);
  }


  if (loading && !user) return <p>Loading user information...</p>
  if (!user) return <p>You must be logged in to view this page. <a href="/signin" className="underline">Sign In</a></p>

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-1.5 mb-4">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" value={user.email || ''} disabled />
          </div>
          <div className="grid w-full items-center gap-1.5 mb-4">
            <Label htmlFor="profileFullName">Full Name</Label>
            <Input
              type="text"
              id="profileFullName"
              placeholder="Your Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Your Children</CardTitle>
          <CardDescription>Add your children and assign them to their classes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddStudent} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="studentName">Child&apos;s Full Name</Label>
                <Input
                  id="studentName"
                  type="text"
                  placeholder="Child&apos;s Name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="classSelect">Class</Label>
                <Select
                  value={selectedClassId || ''}
                  onValueChange={(value) => setSelectedClassId(value)}
                  required
                >
                  <SelectTrigger id="classSelect">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                {loading ? 'Adding...' : 'Add Child'}
              </Button>
            </div>
          </form>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {message && <p className="text-green-500 text-sm mb-4">{message}</p>}

          <div>
            <h3 className="text-lg font-semibold mb-2">Your Registered Children:</h3>
            {students.length === 0 && !loading && <p>No children added yet.</p>}
            {loading && students.length === 0 && <p>Loading children...</p>}
            <ul className="space-y-2">
              {students.map((student) => (
                <li key={student.id || student.full_name} className="p-2 border rounded">
                  {student.full_name} - {student.class_name}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
