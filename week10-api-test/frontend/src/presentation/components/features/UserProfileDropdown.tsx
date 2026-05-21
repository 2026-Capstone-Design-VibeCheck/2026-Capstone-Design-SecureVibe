'use client'

import { useState } from 'react'
import { Form, LogIn, User } from 'lucide-react'


export default function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [isloggedIn, setIsLogin] = useState(false) // 실제 로그인 상태에 따라 변경해야 합니다.
  const [signup, setSignup] = useState(false)  
  const userinfo = new FormData()
  
  const login = async () => {
    // 여기에 로그인 로직을 구현합니다.
    // 예: API 호출하여 로그인 처리, 세션 저장 등
    const userinfo = new FormData()
    const id = (document.getElementById('id') as HTMLInputElement).value
    const password = (document.getElementById('password') as HTMLInputElement).value
    userinfo.append('id', id)
    userinfo.append('password', password)
    console.log('Logging in with:', userinfo.get('id'), userinfo.get('password'))
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        body: userinfo,
      })
      const data = await response.json()
      if (response.ok) {
        // 로그인 성공 처리
        setIsOpen(false)
        setIsLogin(true)
        sessionStorage.setItem('user', JSON.stringify({ id: data.user.id, name: data.user.name, apikey: data.user.key })) // 세션에 사용자 정보 저장
        console.log('User info stored in session:', sessionStorage.getItem('user'))
        console.log('Login successful')
      } else {
        // 로그인 실패 처리
        console.error('Login failed')
      }
    } catch (error) {
      console.error('Error during login:', error)
    }
  }
  const signingup = async () => {
    const userinfo = new FormData()
    const sid = (document.getElementById('sid') as HTMLInputElement).value
    const sname = (document.getElementById('sname') as HTMLInputElement).value
    const spassword = (document.getElementById('spassword') as HTMLInputElement).value
    const sconfirmPassword = (document.getElementById('sconfirmPassword') as HTMLInputElement).value
    const sapikey = (document.getElementById('sapikey') as HTMLInputElement).value
    if (spassword !== sconfirmPassword) {
      alert('Password and Confirm Password do not match.')
      return
    }
    userinfo.append('sid', sid)
    userinfo.append('sname', sname)
    userinfo.append('spassword', spassword)
    userinfo.append('sapikey', sapikey)
    console.log('Signing up with:', userinfo.get('sid'), userinfo.get('sname'), userinfo.get('spassword'), userinfo.get('sconfirmPassword'), userinfo.get('sapikey'))
    try {
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        body: userinfo,
      })
      if (response.ok) {
        // 회원가입 성공 처리
        console.log('Signup successful')
        setSignup(false) // 회원가입 폼 닫기
      } else {
        // 회원가입 실패 처리
        console.error('Signup failed')
      }
    }
      catch (error) {
        console.error('Error during signup:', error)
      } 
  }

  return (
    <div className="relative">
      <button 
        aria-label="user profile" 
        className="p-2 hover:bg-gray-100 rounded-full"
        onClick={() => setIsOpen(!isOpen) }
      >
        <User className="w-5 h-5" />
      </button>
      {isOpen && !signup && (isloggedIn ? (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
          <div className="p-4 border-b">
            <p className="font-semibold text-gray-800">name: {JSON.parse(sessionStorage.getItem('user') || '{}').name}</p>
            <p className="text-xs text-gray-500">security-admin@vibe.com</p>
          </div>
          <button className="w-full text-left p-4 text-red-600 hover:bg-red-50 transition-colors">
            Logout
          </button>
        </div>
      ) : (
        
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
          <input id = "id" type="text" placeholder="ID" className="w-full px-4 py-2 border-b focus:outline-none"/>
          <input id="password" type="password" placeholder="Password" className="w-full px-4 py-2 border-b focus:outline-none" />
          <button onClick={login} className="w-full text-left p-4 text-gray-800 hover:bg-gray-100 transition-colors" >
            Login
          </button>
          <button className="w-full text-left p-4 text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => { setSignup(true);}}>
            Sign Up
          </button>
        </div>
      )
    )
    
      }
      {signup && isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50 p-4">
          <input id = "sid" type="text" placeholder="ID" className="w-full px-4 py-2 border-b focus:outline-none mb-2"/>
          <input id = "sname" type ="text" placeholder="Name" className="w-full px-4 py-2 border-b focus:outline-none mb-2"/>
          <input id = "spassword" type="password" placeholder="Password" className="w-full px-4 py-2 border-b focus:outline-none mb-2" />
          <input id = "sconfirmPassword" type="password" placeholder="Confirm Password" className="w-full px-4 py-2 border-b focus:outline-none mb-4" />
          <input id = "sapikey" type="text" placeholder="API key for ai" className="w-full px-4 py-2 border-b focus:outline-none mb-4" />
          <button onClick={signingup} className="w-full text-left p-4 text-gray-800 hover:bg-gray-100 transition-colors">
            Sign Up
          </button>
          <button className="w-full text-left p-4 text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => { setSignup(false);}}>
            cancel
          </button>
        </div>
      )}
    </div>
  )
}
